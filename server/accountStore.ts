import { randomUUID } from "crypto";
import {
  learningSessions,
  userLikedCards,
  userTopicInteractions,
  users,
  type LearningSession,
  type User,
  type UserLikedCard,
  type UserTopicInteraction,
} from "../shared/schema";
import { and, eq } from "drizzle-orm";
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
    const result = await db.select().from(users);
    return result.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  return Array.from(memoryUsers.values()).find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );
}

export async function findUserById(id: string): Promise<User | undefined> {
  if (db) {
    const result = await db.select().from(users);
    return result.find((user) => user.id === id);
  }

  return memoryUsers.get(id);
}

export async function createAccount(input: CreateUserInput): Promise<User> {
  if (db) {
    const inserted = await db.insert(users).values(input).returning();
    return inserted[0];
  }

  const user: User = {
    id: randomUUID(),
    email: input.email,
    username: input.username,
    password: input.password,
    createdAt: new Date().toISOString(),
  };
  memoryUsers.set(user.id, user);
  return user;
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
    const current = await db.select().from(userLikedCards);
    const existing = current.find(
      (card) =>
        card.userId === input.userId &&
        card.topic === input.topic &&
        card.content === input.content,
    );

    if (input.liked && !existing) {
      await db.insert(userLikedCards).values({
        userId: input.userId,
        topic: input.topic,
        content: input.content,
      });
    }

    if (!input.liked && existing) {
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
    const current = await db.select().from(userTopicInteractions);
    const existing = current.find(
      (interaction) =>
        interaction.userId === input.userId && interaction.topic === input.topic,
    );

    if (existing) {
      await db
        .update(userTopicInteractions)
        .set({
          interactionCount: existing.interactionCount + (input.increment ?? 1),
          likeCount: existing.likeCount + (input.isLiked ? 1 : 0),
          isLiked: input.isLiked ?? existing.isLiked,
          lastInteraction: new Date().toISOString(),
        })
        .where(eq(userTopicInteractions.id, existing.id));
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
    const result = await db.select().from(learningSessions);
    return result.filter((session) => session.userId === userId);
  }

  return memoryLearningSessions.get(userId) ?? [];
}

async function getUserInteractions(userId: string) {
  if (db) {
    const result = await db.select().from(userTopicInteractions);
    return result.filter((interaction) => interaction.userId === userId);
  }

  return memoryTopicInteractions.get(userId) ?? [];
}

export async function getUserLikedCards(userId: string) {
  if (db) {
    const result = await db.select().from(userLikedCards);
    return result
      .filter((card) => card.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
