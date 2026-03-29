import { randomUUID } from "crypto";
import {
  adminAuditLogs,
  chatCards,
  chats,
  learningSessions,
  passwordResetTokens,
  userLikedCards,
  userTopicInteractions,
  users,
  type AdminAuditLog,
  type LearningSession,
  type PasswordResetToken,
  type User,
  type UserLikedCard,
  type UserTopicInteraction,
} from "../shared/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";

interface CreateUserInput {
  email: string;
  username: string;
  password: string;
}

interface RecordSessionInput {
  userId: string;
  topic: string;
  durationSeconds: number;
  cardsCompleted: number;
  startedAt: string;
  endedAt: string;
}

interface ToggleLikeInput {
  userId: string;
  topic: string;
  content: string;
  liked: boolean;
}

interface TrackTopicInput {
  userId: string;
  topic: string;
  increment?: number;
  isLiked?: boolean;
}

const memoryUsers = new Map<string, User>();
const memoryTopicInteractions = new Map<string, UserTopicInteraction[]>();
const memoryLikedCards = new Map<string, UserLikedCard[]>();
const memoryLearningSessions = new Map<string, LearningSession[]>();
const memoryAdminAuditLogs: AdminAuditLog[] = [];
const memoryPasswordResetTokens: PasswordResetToken[] = [];

const DEFAULT_RECOMMENDATION_TOPICS = [
  "Quantum Computing",
  "Neuroplasticity",
  "Dark Matter",
  "Biohacking",
  "AI Ethics",
  "Renewable Energy",
  "Climate Science",
  "Psychology",
  "Astronomy",
  "Philosophy",
  "Economics",
  "Design Thinking",
];

function getAdminAllowlist() {
  return new Set(
    (process.env.ADMIN_EMAIL_ALLOWLIST || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAllowlistedAdmin(email: string) {
  return getAdminAllowlist().has(email.trim().toLowerCase());
}

function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase();
}

function uniqueBy<T>(items: T[], keyGetter: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyGetter(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getWeekStart(date: Date) {
  const clone = new Date(date);
  const day = clone.getDay();
  const offset = day === 0 ? 6 : day - 1;
  clone.setDate(clone.getDate() - offset);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateCurrentStreak(sessions: LearningSession[]) {
  const uniqueDays = Array.from(
    new Set(sessions.map((session) => formatDayKey(new Date(session.endedAt)))),
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    if (formatDayKey(expected) === day) {
      streak += 1;
      expected.setDate(expected.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      expected.setDate(expected.getDate() - 1);
      if (formatDayKey(expected) === day) {
        streak += 1;
      }
    }
    break;
  }

  return streak;
}

function buildRecommendationCandidates(
  interactions: UserTopicInteraction[],
  likedCards: UserLikedCard[],
) {
  const seedTopics = [
    ...interactions.map((interaction) => interaction.topic),
    ...likedCards.map((card) => card.topic),
  ];

  const seedWords = new Set(
    seedTopics
      .flatMap((topic) => normalizeTopic(topic).split(/\s+/))
      .filter((word) => word.length > 2),
  );

  const seenTopics = new Set(seedTopics.map((topic) => normalizeTopic(topic)));

  const scored = DEFAULT_RECOMMENDATION_TOPICS
    .filter((topic) => !seenTopics.has(normalizeTopic(topic)))
    .map((topic) => {
      const words = normalizeTopic(topic).split(/\s+/);
      const overlapScore = words.reduce(
        (total, word) => total + (seedWords.has(word) ? 3 : 0),
        0,
      );
      const interestScore = interactions.reduce((total, interaction) => {
        const matches = normalizeTopic(interaction.topic)
          .split(/\s+/)
          .some((word) => words.includes(word));
        if (!matches) {
          return total;
        }
        return (
          total +
          interaction.interactionCount +
          interaction.likeCount * 3 +
          (interaction.isLiked ? 5 : 0)
        );
      }, 0);

      return {
        topic,
        score: overlapScore + interestScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.topic);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  if (db) {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);
    return result[0];
  }

  return Array.from(memoryUsers.values()).find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );
}

export async function findUserById(id: string): Promise<User | undefined> {
  if (db) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  return memoryUsers.get(id);
}

export async function updateUserAdminStatus(userId: string, isAdmin: boolean) {
  if (db) {
    const updated = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  const current = memoryUsers.get(userId);
  if (!current) {
    return undefined;
  }

  const next = { ...current, isAdmin };
  memoryUsers.set(userId, next);
  return next;
}

export async function syncBootstrapAdminStatus(user: User): Promise<User> {
  if (user.isAdmin || !isAllowlistedAdmin(user.email)) {
    return user;
  }

  return (await updateUserAdminStatus(user.id, true)) ?? user;
}

export async function createAccount(input: CreateUserInput): Promise<User> {
  if (db) {
    const inserted = await db
      .insert(users)
      .values({ ...input, isAdmin: isAllowlistedAdmin(input.email) })
      .returning();
    return inserted[0];
  }

  const user: User = {
    id: randomUUID(),
    email: input.email,
    username: input.username,
    password: input.password,
    isAdmin: isAllowlistedAdmin(input.email),
    createdAt: new Date().toISOString(),
  };
  memoryUsers.set(user.id, user);
  return user;
}

export async function updateUserPassword(userId: string, password: string) {
  if (db) {
    const updated = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  const current = memoryUsers.get(userId);
  if (!current) {
    return undefined;
  }

  const next = { ...current, password };
  memoryUsers.set(userId, next);
  return next;
}

export async function recordLearningSession(input: RecordSessionInput) {
  if (db) {
    await db.insert(learningSessions).values(input);
    return;
  }

  const sessions = memoryLearningSessions.get(input.userId) ?? [];
  sessions.push({
    id: randomUUID(),
    userId: input.userId,
    topic: input.topic,
    durationSeconds: input.durationSeconds,
    cardsCompleted: input.cardsCompleted,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    createdAt: new Date().toISOString(),
  });
  memoryLearningSessions.set(input.userId, sessions);
}

export async function toggleLikedCard(input: ToggleLikeInput) {
  if (db) {
    const existing = await db
      .select()
      .from(userLikedCards)
      .where(
        and(
          eq(userLikedCards.userId, input.userId),
          eq(userLikedCards.topic, input.topic),
          eq(userLikedCards.content, input.content),
        ),
      )
      .limit(1);

    if (input.liked && !existing[0]) {
      await db.insert(userLikedCards).values({
        userId: input.userId,
        topic: input.topic,
        content: input.content,
      });
    }

    if (!input.liked && existing[0]) {
      await db
        .delete(userLikedCards)
        .where(
          and(
            eq(userLikedCards.userId, input.userId),
            eq(userLikedCards.topic, input.topic),
            eq(userLikedCards.content, input.content),
          ),
        );
    }
  } else {
    const current = memoryLikedCards.get(input.userId) ?? [];
    const next = input.liked
      ? uniqueBy(
          [
            ...current,
            {
              id: randomUUID(),
              userId: input.userId,
              topic: input.topic,
              content: input.content,
              createdAt: new Date().toISOString(),
            },
          ],
          (card) => `${card.topic}:${card.content}`,
        )
      : current.filter(
          (card) => !(card.topic === input.topic && card.content === input.content),
        );
    memoryLikedCards.set(input.userId, next);
  }

  await trackTopicInteraction({
    userId: input.userId,
    topic: input.topic,
    increment: 0,
    isLiked: input.liked,
  });
}

export async function trackTopicInteraction(input: TrackTopicInput) {
  if (db) {
    const existing = await db
      .select()
      .from(userTopicInteractions)
      .where(
        and(
          eq(userTopicInteractions.userId, input.userId),
          eq(userTopicInteractions.topic, input.topic),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(userTopicInteractions)
        .set({
          interactionCount: existing[0].interactionCount + (input.increment ?? 1),
          likeCount: existing[0].likeCount + (input.isLiked ? 1 : 0),
          isLiked: input.isLiked ?? existing[0].isLiked,
          lastInteraction: new Date().toISOString(),
        })
        .where(eq(userTopicInteractions.id, existing[0].id));
      return;
    }

    await db.insert(userTopicInteractions).values({
      userId: input.userId,
      topic: input.topic,
      interactionCount: Math.max(input.increment ?? 1, 1),
      likeCount: input.isLiked ? 1 : 0,
      isLiked: Boolean(input.isLiked),
      lastInteraction: new Date().toISOString(),
    });
    return;
  }

  const current = memoryTopicInteractions.get(input.userId) ?? [];
  const existingIndex = current.findIndex(
    (interaction) => interaction.topic === input.topic,
  );

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      interactionCount:
        current[existingIndex].interactionCount + (input.increment ?? 1),
      likeCount:
        current[existingIndex].likeCount + (input.isLiked ? 1 : 0),
      isLiked: input.isLiked ?? current[existingIndex].isLiked,
      lastInteraction: new Date().toISOString(),
    };
  } else {
    current.push({
      id: randomUUID(),
      userId: input.userId,
      topic: input.topic,
      interactionCount: Math.max(input.increment ?? 1, 1),
      likeCount: input.isLiked ? 1 : 0,
      isLiked: Boolean(input.isLiked),
      lastInteraction: new Date().toISOString(),
    });
  }

  memoryTopicInteractions.set(input.userId, current);
}

async function getUserSessions(userId: string) {
  if (db) {
    return db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.userId, userId));
  }

  return memoryLearningSessions.get(userId) ?? [];
}

async function getUserInteractions(userId: string) {
  if (db) {
    return db
      .select()
      .from(userTopicInteractions)
      .where(eq(userTopicInteractions.userId, userId));
  }

  return memoryTopicInteractions.get(userId) ?? [];
}

export async function getUserLikedCards(userId: string) {
  if (db) {
    return db
      .select()
      .from(userLikedCards)
      .where(eq(userLikedCards.userId, userId))
      .orderBy(desc(userLikedCards.createdAt));
  }

  return (memoryLikedCards.get(userId) ?? []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getDashboardSummary(userId: string) {
  const sessions = await getUserSessions(userId);
  const interactions = await getUserInteractions(userId);
  const likedCards = await getUserLikedCards(userId);

  const totalLearningMinutes = Math.round(
    sessions.reduce((total, session) => total + session.durationSeconds, 0) / 60,
  );
  const cardsCompleted = sessions.reduce(
    (total, session) => total + session.cardsCompleted,
    0,
  );

  const weekStart = getWeekStart(new Date());
  const sessionsThisWeek = sessions.filter(
    (session) => new Date(session.endedAt) >= weekStart,
  );

  const weeklyMinutes = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const dayKey = formatDayKey(day);
    const totalMinutes = Math.round(
      sessions
        .filter((session) => formatDayKey(new Date(session.endedAt)) === dayKey)
        .reduce((total, session) => total + session.durationSeconds, 0) / 60,
    );

    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: totalMinutes,
    };
  });

  const recentTopics = uniqueBy(
    [
      ...sessions
        .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
        .map((session) => session.topic),
      ...interactions
        .sort((a, b) => b.lastInteraction.localeCompare(a.lastInteraction))
        .map((interaction) => interaction.topic),
    ],
    (topic) => topic.toLowerCase(),
  ).slice(0, 5);

  return {
    totalLearningMinutes,
    currentStreak: calculateCurrentStreak(sessions),
    sessionsThisWeek: sessionsThisWeek.length,
    cardsCompleted,
    likedCardsCount: likedCards.length,
    weeklyMinutes,
    recentTopics,
  };
}

export async function getRecommendedTopics(userId: string) {
  const interactions = await getUserInteractions(userId);
  const likedCards = await getUserLikedCards(userId);
  return buildRecommendationCandidates(interactions, likedCards).slice(0, 6);
}

async function getAllPasswordResetTokens() {
  if (db) {
    return db.select().from(passwordResetTokens);
  }

  return memoryPasswordResetTokens;
}

export async function createPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  if (db) {
    const inserted = await db
      .insert(passwordResetTokens)
      .values(input)
      .returning();
    return inserted[0];
  }

  const token: PasswordResetToken = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    usedAt: null,
    ...input,
  };
  memoryPasswordResetTokens.unshift(token);
  return token;
}

export async function getActivePasswordResetTokenByHash(tokenHash: string) {
  const tokens = await getAllPasswordResetTokens();
  const now = new Date().toISOString();

  return tokens
    .filter((token) => token.tokenHash === tokenHash)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((token) => !token.usedAt && token.expiresAt > now);
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  const usedAt = new Date().toISOString();

  if (db) {
    const updated = await db
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(eq(passwordResetTokens.id, tokenId))
      .returning();
    return updated[0];
  }

  const index = memoryPasswordResetTokens.findIndex((token) => token.id === tokenId);
  if (index < 0) {
    return undefined;
  }

  memoryPasswordResetTokens[index] = {
    ...memoryPasswordResetTokens[index],
    usedAt,
  };

  return memoryPasswordResetTokens[index];
}

export async function invalidatePasswordResetTokensForUser(userId: string) {
  const usedAt = new Date().toISOString();

  if (db) {
    await db
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt),
        ),
      );
    return;
  }

  for (let index = 0; index < memoryPasswordResetTokens.length; index += 1) {
    const token = memoryPasswordResetTokens[index];
    if (token.userId === userId && !token.usedAt) {
      memoryPasswordResetTokens[index] = {
        ...token,
        usedAt,
      };
    }
  }
}

async function getAllUsers() {
  if (db) {
    return db.select().from(users);
  }

  return Array.from(memoryUsers.values());
}

async function getAllSessions() {
  if (db) {
    return db.select().from(learningSessions);
  }

  return Array.from(memoryLearningSessions.values()).flat();
}

async function getAllInteractions() {
  if (db) {
    return db.select().from(userTopicInteractions);
  }

  return Array.from(memoryTopicInteractions.values()).flat();
}

async function getAllLikedCards() {
  if (db) {
    return db.select().from(userLikedCards);
  }

  return Array.from(memoryLikedCards.values()).flat();
}

async function getAllChats() {
  if (db) {
    return db.select().from(chats);
  }

  return [];
}

async function getAllChatCards() {
  if (db) {
    return db.select().from(chatCards);
  }

  return [];
}

export async function recordAdminAuditEvent(input: {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
}) {
  const entry = {
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    details: input.details ?? null,
  };

  if (db) {
    const inserted = await db.insert(adminAuditLogs).values(entry).returning();
    return inserted[0];
  }

  const memoryEntry: AdminAuditLog = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  memoryAdminAuditLogs.unshift(memoryEntry);
  return memoryEntry;
}

export async function getRecentAdminAuditLogs(limit = 20) {
  if (db) {
    return db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit);
  }

  return memoryAdminAuditLogs.slice(0, limit);
}

export async function getAdminOverview() {
  const [allUsers, sessions, interactions, likedCards, auditLogs] = await Promise.all([
    getAllUsers(),
    getAllSessions(),
    getAllInteractions(),
    getAllLikedCards(),
    getRecentAdminAuditLogs(8),
  ]);

  const activeToday = new Set(
    sessions
      .filter((session) => formatDayKey(new Date(session.endedAt)) === formatDayKey(new Date()))
      .map((session) => session.userId),
  ).size;

  const topTopics = Array.from(
    interactions.reduce((map, interaction) => {
      const current = map.get(interaction.topic) ?? 0;
      map.set(
        interaction.topic,
        current + interaction.interactionCount + interaction.likeCount * 2,
      );
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, score]) => ({ topic, score }));

  return {
    totals: {
      users: allUsers.length,
      admins: allUsers.filter((user) => user.isAdmin).length,
      sessions: sessions.length,
      savedHits: likedCards.length,
      activeToday,
    },
    topTopics,
    recentAudit: auditLogs,
  };
}

export async function getAdminUsersSnapshot() {
  const [allUsers, sessions, likedCards, interactions] = await Promise.all([
    getAllUsers(),
    getAllSessions(),
    getAllLikedCards(),
    getAllInteractions(),
  ]);

  return allUsers
    .map((user) => {
      const userSessions = sessions.filter((session) => session.userId === user.id);
      const userLikes = likedCards.filter((card) => card.userId === user.id);
      const userInteractions = interactions.filter(
        (interaction) => interaction.userId === user.id,
      );

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        sessionCount: userSessions.length,
        savedHits: userLikes.length,
        cardsCompleted: userSessions.reduce(
          (total, session) => total + session.cardsCompleted,
          0,
        ),
        currentStreak: calculateCurrentStreak(userSessions),
        lastSeenAt:
          userSessions
            .map((session) => session.endedAt)
            .sort((a, b) => b.localeCompare(a))[0] ??
          userInteractions
            .map((interaction) => interaction.lastInteraction)
            .sort((a, b) => b.localeCompare(a))[0] ??
          user.createdAt,
      };
    })
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export async function getAdminContentSnapshot() {
  const [sessions, interactions, likedCards, allChats, allChatCards] = await Promise.all([
    getAllSessions(),
    getAllInteractions(),
    getAllLikedCards(),
    getAllChats(),
    getAllChatCards(),
  ]);

  const recentSessions = [...sessions]
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
    .slice(0, 10);

  const hotTopics = Array.from(
    interactions.reduce((map, interaction) => {
      map.set(
        interaction.topic,
        (map.get(interaction.topic) ?? 0) +
          interaction.interactionCount +
          interaction.likeCount * 2,
      );
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, score]) => ({ topic, score }));

  const recentGeneratedCards = [...allChatCards]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12)
    .map((card) => {
      const chat = allChats.find((entry) => entry.id === card.chatId);
      return {
        id: card.id,
        chatId: card.chatId,
        topic: chat?.topic ?? "Unknown topic",
        createdAt: card.createdAt,
        content: card.content,
      };
    });

  return {
    totals: {
      sessions: sessions.length,
      topicSignals: interactions.length,
      savedHits: likedCards.length,
      chats: allChats.length,
      generatedCards: allChatCards.length,
    },
    recentSessions,
    hotTopics,
    recentGeneratedCards,
  };
}
