import { Router, Request, Response } from 'express';
import axios from 'axios';
import { findOrCreateUser } from '../models/User';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * POST /api/auth/kakao
 * 카카오 로그인
 */
router.post('/kakao', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: '액세스 토큰이 필요합니다.',
      });
    }

    // 카카오 사용자 정보 조회
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = kakaoResponse.data;

    // 사용자 생성 또는 업데이트
    const user = await findOrCreateUser({
      email: kakaoUser.kakao_account?.email,
      name: kakaoUser.kakao_account?.profile?.nickname,
      provider: 'kakao',
      providerId: kakaoUser.id.toString(),
      avatarUrl: kakaoUser.kakao_account?.profile?.profile_image_url,
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error: any) {
    console.error('카카오 로그인 실패:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: '카카오 로그인에 실패했습니다.',
    });
  }
});

/**
 * POST /api/auth/google
 * 구글 로그인
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID 토큰이 필요합니다.',
      });
    }

    // 구글 ID 토큰 검증
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const googleUser = googleResponse.data;

    if (!googleUser.sub) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // 사용자 생성 또는 업데이트
    const user = await findOrCreateUser({
      email: googleUser.email,
      name: googleUser.name,
      provider: 'google',
      providerId: googleUser.sub,
      avatarUrl: googleUser.picture,
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (error: any) {
    console.error('구글 로그인 실패:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: '구글 로그인에 실패했습니다.',
    });
  }
});

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    const { getUserById } = await import('../models/User');
    const user = await getUserById(payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회에 실패했습니다.',
    });
  }
});

export default router;
