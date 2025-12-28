import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Express의 기본 User 타입과 충돌을 피하기 위해 다른 이름 사용
export interface AuthRequest extends Request {
  userId?: number;
  authUser?: {
    userId: number;
    email?: string;
    name?: string;
  };
}

/**
 * JWT 인증 미들웨어 (선택적)
 * 토큰이 있으면 검증하고 req.userId 설정, 없어도 통과
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (payload) {
    req.userId = payload.userId;
    req.authUser = payload;
  }

  next();
}

/**
 * JWT 인증 미들웨어 (필수)
 * 토큰이 없거나 유효하지 않으면 401 에러
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
    });
  }

  req.userId = payload.userId;
  req.authUser = payload;
  next();
}
