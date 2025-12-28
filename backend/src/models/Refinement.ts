import pool from '../database/db';

export interface Refinement {
  id: number;
  user_id?: number;
  original_text: string;
  refined_text: string;
  context?: string;
  created_at: Date;
}

export interface CreateRefinementData {
  userId?: number;
  originalText: string;
  refinedText: string;
  context?: string;
}

/**
 * 새로운 refinement 저장
 */
export async function createRefinement(data: CreateRefinementData): Promise<Refinement> {
  const { userId, originalText, refinedText, context } = data;

  const result = await pool.query(
    `INSERT INTO refinements (user_id, original_text, refined_text, context)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId || null, originalText, refinedText, context]
  );

  return result.rows[0];
}

/**
 * 최근 refinement 히스토리 조회 (사용자별 또는 전체)
 */
export async function getRecentRefinements(userId?: number, limit: number = 50): Promise<Refinement[]> {
  if (userId) {
    const result = await pool.query(
      `SELECT * FROM refinements
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // 비로그인 사용자는 user_id가 null인 것만 조회
  const result = await pool.query(
    `SELECT * FROM refinements
     WHERE user_id IS NULL
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * ID로 refinement 조회
 */
export async function getRefinementById(id: number, userId?: number): Promise<Refinement | null> {
  if (userId) {
    const result = await pool.query(
      `SELECT * FROM refinements WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  const result = await pool.query(
    `SELECT * FROM refinements WHERE id = $1 AND user_id IS NULL`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * refinement 삭제
 */
export async function deleteRefinement(id: number, userId?: number): Promise<boolean> {
  if (userId) {
    const result = await pool.query(
      `DELETE FROM refinements WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  const result = await pool.query(
    `DELETE FROM refinements WHERE id = $1 AND user_id IS NULL`,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}
