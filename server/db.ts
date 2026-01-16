/**
 * Database Module - Hybrid Drizzle ORM setup
 * Works with PostgreSQL in production, falls back to in-memory for local dev
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
const { Pool } = pg;
import * as schema from "../shared/schema";
import { IStorage } from "./storage";
import { eq } from "drizzle-orm";
import { User, InsertUser } from "../shared/schema";
// Database connection pool
let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
// Initialize database connection
export const initializeDB = async () => {
  try {
    // Only initialize in production or if PG connection string exists
    if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      });
      // Test the connection
      await pool.query("SELECT 1");
      console.log("✅ PostgreSQL connected successfully");
      // Initialize Drizzle
      db = drizzle(pool, { schema });
      // Migrations disabled temporarily
      // await migrate(db, { migrationsFolder: './drizzle' });
      // console.log('✅ Database migrations applied');
      return db;
    } else {
      console.log("🔶 Running in development mode - using in-memory storage");
      return null;
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    if (process.env.NODE_ENV === "production") {
      console.error("Fatal: Database required in production");
      process.exit(1);
    }
    return null;
  }
};
// Hybrid storage that works with both DB and memory
export class HybridStorage implements IStorage {
  private memoryFallback: IStorage;
  constructor(fallback: IStorage) {
    this.memoryFallback = fallback;
  }
  async getUser(id: string): Promise<User | undefined> {
    if (db) {
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
      return result[0];
    }
    return this.memoryFallback.getUser(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (db) {
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, username));
      return result[0];
    }
    return this.memoryFallback.getUserByUsername(username);
  }
  async createUser(user: InsertUser): Promise<User> {
    if (db) {
      const result = await db.insert(schema.users).values(user).returning();
      return result[0];
    }
    return this.memoryFallback.createUser(user);
  }
}
// Database accessor
export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB() first.");
  }
  return db;
};
// Export for use in routes
export { db };
