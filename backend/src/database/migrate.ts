import pool from './db';

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // users 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        provider VARCHAR(50) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_id)
      );
    `);

    // refinements 테이블 생성 (user_id 추가)
    await client.query(`
      CREATE TABLE IF NOT EXISTS refinements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        refined_text TEXT NOT NULL,
        context VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 인덱스 생성 (성능 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refinements_user_id
      ON refinements(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refinements_created_at
      ON refinements(created_at DESC);
    `);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrate;
