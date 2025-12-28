import pool from '../database/db';

export interface User {
  id: number;
  email?: string;
  name?: string;
  provider: 'kakao' | 'google';
  provider_id: string;
  avatar_url?: string;
  created_at: Date;
}

export interface CreateUserData {
  email?: string;
  name?: string;
  provider: 'kakao' | 'google';
  providerId: string;
  avatarUrl?: string;
}

/**
 * 사용자 생성 또는 업데이트
 */
export async function findOrCreateUser(data: CreateUserData): Promise<User> {
  const { email, name, provider, providerId, avatarUrl } = data;

  // 기존 사용자 찾기
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE provider = $1 AND provider_id = $2`,
    [provider, providerId]
  );

  if (existingUser.rows.length > 0) {
    // 기존 사용자 정보 업데이트
    const result = await pool.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           name = COALESCE($2, name),
           avatar_url = COALESCE($3, avatar_url)
       WHERE provider = $4 AND provider_id = $5
       RETURNING *`,
      [email, name, avatarUrl, provider, providerId]
    );
    return result.rows[0];
  }

  // 새 사용자 생성
  const result = await pool.query(
    `INSERT INTO users (email, name, provider, provider_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, name, provider, providerId, avatarUrl]
  );

  return result.rows[0];
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}
