import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import refineRoutes from './routes/refineRoutes';
import authRoutes from './routes/authRoutes';
import pool from './database/db';
import migrate from './database/migrate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet()); // 보안 헤더
app.use(cors()); // CORS 허용
app.use(morgan('dev')); // 로그
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true }));

// 헬스 체크
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api', refineRoutes);

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
  });
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
  });
});

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결 확인
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // 마이그레이션 실행
    console.log('Running database migrations...');
    await migrate();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
