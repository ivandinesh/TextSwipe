import session from "express-session";
import type pg from "pg";

type StoredSessionRow = {
  session: string;
  expires_at: Date | string;
};

export class PostgresSessionStore extends session.Store {
  private readonly pool: pg.Pool;
  private readonly tableName: string;

  constructor(pool: pg.Pool, tableName = "user_sessions") {
    super();
    this.pool = pool;
    this.tableName = tableName;
  }

  private getExpiryDate(sess: session.SessionData) {
    const cookieExpiry = sess.cookie?.expires;
    if (cookieExpiry) {
      return new Date(cookieExpiry);
    }

    const maxAge = sess.cookie?.maxAge;
    if (typeof maxAge === "number") {
      return new Date(Date.now() + maxAge);
    }

    return new Date(Date.now() + 1000 * 60 * 60 * 24);
  }

  override get(
    sid: string,
    callback: (err?: unknown, session?: session.SessionData | null) => void,
  ) {
    void this.pool
      .query<StoredSessionRow>(
        `SELECT session, expires_at
         FROM ${this.tableName}
         WHERE sid = $1 AND expires_at > NOW()`,
        [sid],
      )
      .then((result) => {
        if (!result.rows[0]) {
          callback(undefined, null);
          return;
        }

        const parsed = JSON.parse(result.rows[0].session) as session.SessionData;
        callback(undefined, parsed);
      })
      .catch((error) => callback(error));
  }

  override set(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: unknown) => void,
  ) {
    const serialized = JSON.stringify(sess);
    const expiresAt = this.getExpiryDate(sess);

    void this.pool
      .query(
        `INSERT INTO ${this.tableName} (sid, session, expires_at, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (sid)
         DO UPDATE SET
           session = EXCLUDED.session,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW()`,
        [sid, serialized, expiresAt],
      )
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  override destroy(sid: string, callback?: (err?: unknown) => void) {
    void this.pool
      .query(`DELETE FROM ${this.tableName} WHERE sid = $1`, [sid])
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  override touch(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: unknown) => void,
  ) {
    const expiresAt = this.getExpiryDate(sess);

    void this.pool
      .query(
        `UPDATE ${this.tableName}
         SET expires_at = $2, updated_at = NOW()
         WHERE sid = $1`,
        [sid, expiresAt],
      )
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }
}
