import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { refineText } from '../services/aiService';
import {
  createRefinement,
  getRecentRefinements,
  getRefinementById,
  deleteRefinement,
} from '../models/Refinement';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// 모든 라우트에 optionalAuth 적용 (로그인 선택적)
router.use(optionalAuth);

/**
 * POST /api/refine
 * 텍스트를 AI로 다듬기
 */
router.post(
  '/refine',
  [
    body('text').isString().notEmpty().withMessage('텍스트는 필수입니다'),
    body('context').optional().isString(),
    body('openaiApiKey').optional().isString(), // 사용자가 제공한 OpenAI API 키 (선택)
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { text, context, openaiApiKey } = req.body;
      const userId = req.userId; // 로그인한 경우 userId 존재

      // AI로 텍스트 다듬기 (사용자 API 키 전달)
      const result = await refineText({
        originalText: text,
        context,
        userApiKey: openaiApiKey, // 사용자가 OpenAI API 키를 제공했으면 OpenAI 사용, 아니면 Ollama 사용
      });

      // 데이터베이스에 저장
      const savedRefinement = await createRefinement({
        userId,
        originalText: text,
        refinedText: result.refinedText,
        context,
      });

      res.json({
        success: true,
        data: {
          id: savedRefinement.id,
          originalText: savedRefinement.original_text,
          refinedText: result.refinedText,
          suggestions: result.suggestions,
          context: savedRefinement.context,
          createdAt: savedRefinement.created_at,
          provider: result.provider, // 어떤 AI를 사용했는지 클라이언트에 전달
        },
      });
    } catch (error: any) {
      console.error('텍스트 다듬기 실패:', error);
      res.status(500).json({
        success: false,
        message: error.message || '텍스트 다듬기에 실패했습니다.',
      });
    }
  }
);

/**
 * GET /api/history
 * 히스토리 조회
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.userId;

    const refinements = await getRecentRefinements(userId, limit);

    res.json({
      success: true,
      data: refinements.map(r => ({
        id: r.id,
        originalText: r.original_text,
        refinedText: r.refined_text,
        context: r.context,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('히스토리 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '히스토리 조회에 실패했습니다.',
    });
  }
});

/**
 * GET /api/history/:id
 * 특정 refinement 조회
 */
router.get('/history/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    const refinement = await getRefinementById(id, userId);

    if (!refinement) {
      return res.status(404).json({
        success: false,
        message: '항목을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: {
        id: refinement.id,
        originalText: refinement.original_text,
        refinedText: refinement.refined_text,
        context: refinement.context,
        createdAt: refinement.created_at,
      },
    });
  } catch (error) {
    console.error('항목 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '항목 조회에 실패했습니다.',
    });
  }
});

/**
 * DELETE /api/history/:id
 * refinement 삭제
 */
router.delete('/history/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    const deleted = await deleteRefinement(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '항목을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '삭제되었습니다.',
    });
  } catch (error) {
    console.error('삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '삭제에 실패했습니다.',
    });
  }
});

export default router;
