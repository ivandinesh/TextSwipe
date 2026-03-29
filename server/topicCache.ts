import { createHash } from "crypto";
import fs from "fs";
import path from "path";

export interface CachedTopicOption {
  title: string;
  description: string;
}

export interface TopicCacheQuery {
  topic: string;
  model: string;
  count: number;
  generateOptions: boolean;
}

export interface TopicCacheValue {
  snippets: string[];
  options?: CachedTopicOption[];
}

interface TopicCacheRecord extends TopicCacheValue {
  schemaVersion: number;
  cacheKey: string;
  originalTopic: string;
  normalizedTopic: string;
  model: string;
  count: number;
  generateOptions: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TopicCacheIndexEntry {
  cacheKey: string;
  originalTopic: string;
  normalizedTopic: string;
  fileName: string;
  model: string;
  count: number;
  generateOptions: boolean;
  createdAt: string;
  updatedAt: string;
}

const CACHE_SCHEMA_VERSION = 1;
const indexMap = new Map<string, TopicCacheIndexEntry>();

let initialized = false;
let initializePromise: Promise<void> | null = null;
let writeQueue = Promise.resolve();

function isCacheEnabled() {
  return process.env.TOPIC_CACHE_ENABLED !== "false";
}

function getCacheRootDir() {
  return path.resolve(process.cwd(), process.env.TOPIC_CACHE_DIR || "cache");
}

export async function getTopicCacheHealth() {
  if (!isCacheEnabled()) {
    return { status: "disabled" as const };
  }

  try {
    await fs.promises.mkdir(getCacheRootDir(), { recursive: true });
    return { status: "up" as const, rootDir: getCacheRootDir() };
  } catch (error) {
    console.error("Topic cache health check failed:", error);
    return { status: "down" as const, rootDir: getCacheRootDir() };
  }
}

function getTopicsDir() {
  return path.join(getCacheRootDir(), "topics");
}

function getIndexPath() {
  return path.join(getCacheRootDir(), "topic-index.json");
}

export function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildTopicCacheKey(query: TopicCacheQuery) {
  return [
    query.model,
    normalizeTopic(query.topic),
    query.count,
    query.generateOptions ? "with-options" : "no-options",
  ].join(":");
}

function slugifyTopic(topic: string) {
  const slug = normalizeTopic(topic)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "topic";
}

function getFileName(topic: string, cacheKey: string) {
  const hash = createHash("sha256").update(cacheKey).digest("hex").slice(0, 8);
  return `${slugifyTopic(topic)}--${hash}.json`;
}

async function ensureInitialized() {
  if (!isCacheEnabled() || initialized) {
    return;
  }

  if (!initializePromise) {
    initializePromise = (async () => {
      const cacheRootDir = getCacheRootDir();
      const topicsDir = getTopicsDir();
      const indexPath = getIndexPath();

      await fs.promises.mkdir(cacheRootDir, { recursive: true });
      await fs.promises.mkdir(topicsDir, { recursive: true });

      try {
        const rawIndex = await fs.promises.readFile(indexPath, "utf8");
        const parsedIndex = JSON.parse(rawIndex);

        if (!Array.isArray(parsedIndex?.entries)) {
          throw new Error("Invalid topic cache index structure");
        }

        for (const entry of parsedIndex.entries) {
          if (
            entry &&
            typeof entry.cacheKey === "string" &&
            typeof entry.fileName === "string"
          ) {
            indexMap.set(entry.cacheKey, entry as TopicCacheIndexEntry);
          }
        }
      } catch (error) {
        const isMissingFileError =
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT";

        if (!isMissingFileError) {
          const backupPath = `${indexPath}.${Date.now()}.bak`;
          try {
            await fs.promises.rename(indexPath, backupPath);
          } catch {
            // Ignore backup rename failures; we can still rebuild from scratch.
          }
          console.warn("Topic cache index was invalid and has been reset.");
        }
      }

      initialized = true;
    })().finally(() => {
      initializePromise = null;
    });
  }

  await initializePromise;
}

async function writeJsonAtomically(filePath: string, payload: string) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempPath, payload, "utf8");
  await fs.promises.rm(filePath, { force: true });
  await fs.promises.rename(tempPath, filePath);
}

function queueWrite(task: () => Promise<void>) {
  writeQueue = writeQueue
    .then(task)
    .catch((error) => {
      console.error("Topic cache write failed:", error);
    });

  return writeQueue;
}

async function persistIndex() {
  const indexPath = getIndexPath();
  const payload = JSON.stringify(
    {
      schemaVersion: CACHE_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      entries: Array.from(indexMap.values()).sort((a, b) =>
        a.cacheKey.localeCompare(b.cacheKey),
      ),
    },
    null,
    2,
  );

  await writeJsonAtomically(indexPath, payload);
}

function isValidTopicCacheRecord(value: unknown): value is TopicCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<TopicCacheRecord>;
  return (
    typeof record.cacheKey === "string" &&
    typeof record.originalTopic === "string" &&
    typeof record.normalizedTopic === "string" &&
    typeof record.model === "string" &&
    typeof record.count === "number" &&
    typeof record.generateOptions === "boolean" &&
    Array.isArray(record.snippets)
  );
}

export async function readTopicCache(
  query: TopicCacheQuery,
): Promise<TopicCacheValue | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  await ensureInitialized();

  const cacheKey = buildTopicCacheKey(query);
  const indexEntry = indexMap.get(cacheKey);
  if (!indexEntry) {
    return null;
  }

  const filePath = path.join(getTopicsDir(), indexEntry.fileName);

  try {
    const rawRecord = await fs.promises.readFile(filePath, "utf8");
    const parsedRecord = JSON.parse(rawRecord);

    if (!isValidTopicCacheRecord(parsedRecord) || parsedRecord.cacheKey !== cacheKey) {
      throw new Error("Topic cache record failed validation");
    }

    return {
      snippets: parsedRecord.snippets,
      options: parsedRecord.options,
    };
  } catch (error) {
    console.warn(`Topic cache miss after invalid entry for "${query.topic}":`, error);
    indexMap.delete(cacheKey);
    await queueWrite(persistIndex);
    return null;
  }
}

export async function writeTopicCache(
  query: TopicCacheQuery,
  value: TopicCacheValue,
): Promise<void> {
  if (!isCacheEnabled()) {
    return;
  }

  await ensureInitialized();

  const cacheKey = buildTopicCacheKey(query);
  const normalizedTopic = normalizeTopic(query.topic);
  const existingEntry = indexMap.get(cacheKey);
  const now = new Date().toISOString();
  const fileName = existingEntry?.fileName ?? getFileName(query.topic, cacheKey);
  const filePath = path.join(getTopicsDir(), fileName);

  const topicRecord: TopicCacheRecord = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    cacheKey,
    originalTopic: query.topic,
    normalizedTopic,
    model: query.model,
    count: query.count,
    generateOptions: query.generateOptions,
    snippets: value.snippets,
    options: value.options,
    createdAt: existingEntry?.createdAt ?? now,
    updatedAt: now,
  };

  const indexEntry: TopicCacheIndexEntry = {
    cacheKey,
    originalTopic: query.topic,
    normalizedTopic,
    fileName,
    model: query.model,
    count: query.count,
    generateOptions: query.generateOptions,
    createdAt: existingEntry?.createdAt ?? now,
    updatedAt: now,
  };

  await queueWrite(async () => {
    await fs.promises.mkdir(getTopicsDir(), { recursive: true });
    await writeJsonAtomically(filePath, JSON.stringify(topicRecord, null, 2));
    indexMap.set(cacheKey, indexEntry);
    await persistIndex();
  });
}
