import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat threads table
export const chats = pgTable("chats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 255 }).notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertChatSchema = createInsertSchema(chats).pick({
  topic: true,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Chat cards table (stores generated content)
export const chatCards = pgTable("chat_cards", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // JSON string of generated card
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertChatCardSchema = createInsertSchema(chatCards).pick({
  chatId: true,
  content: true,
});

export type InsertChatCard = z.infer<typeof insertChatCardSchema>;
export type ChatCard = typeof chatCards.$inferSelect;

export const userTopicInteractions = pgTable("user_topic_interactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  interactionCount: integer("interaction_count").notNull().default(1),
  likeCount: integer("like_count").notNull().default(0),
  isLiked: boolean("is_liked").notNull().default(false),
  lastInteraction: text("last_interaction")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const userLikedCards = pgTable("user_liked_cards", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const learningSessions = pgTable("learning_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  cardsCompleted: integer("cards_completed").notNull().default(0),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type UserTopicInteraction = typeof userTopicInteractions.$inferSelect;
export type UserLikedCard = typeof userLikedCards.$inferSelect;
export type LearningSession = typeof learningSessions.$inferSelect;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  details: text("details"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
