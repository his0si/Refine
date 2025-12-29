import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RefineRequest, RefineResponse, HistoryResponse, AuthResponse } from '../types';

// API 베이스 URL - 실제 환경에 맞게 수정 필요
// 로컬 개발: http://localhost:3000
// 실제 배포: 실제 서버 주소
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 카카오 로그인
 */
export async function loginWithKakao(accessToken: string): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL.replace('/api', '')}/api/auth/kakao`,
      { accessToken }
    );
    return response.data;
  } catch (error) {
    console.error('카카오 로그인 실패:', error);
    throw error;
  }
}

/**
 * 구글 로그인
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL.replace('/api', '')}/api/auth/google`,
      { idToken }
    );
    return response.data;
  } catch (error) {
    console.error('구글 로그인 실패:', error);
    throw error;
  }
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
}

/**
 * 텍스트 다듬기 요청
 */
export async function refineText(
  request: RefineRequest,
  openaiApiKey?: string | null
): Promise<RefineResponse> {
  try {
    const payload = {
      ...request,
      ...(openaiApiKey && { openaiApiKey }), // OpenAI API 키가 있으면 포함
    };
    const response = await api.post<RefineResponse>('/refine', payload);
    return response.data;
  } catch (error) {
    console.error('텍스트 다듬기 실패:', error);
    throw error;
  }
}

/**
 * 히스토리 조회
 */
export async function getHistory(limit: number = 50): Promise<HistoryResponse> {
  try {
    const response = await api.get<HistoryResponse>('/history', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('히스토리 조회 실패:', error);
    throw error;
  }
}

/**
 * 특정 refinement 조회
 */
export async function getRefinementById(id: number): Promise<RefineResponse> {
  try {
    const response = await api.get<RefineResponse>(`/history/${id}`);
    return response.data;
  } catch (error) {
    console.error('항목 조회 실패:', error);
    throw error;
  }
}

/**
 * refinement 삭제
 */
export async function deleteRefinement(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    console.error('삭제 실패:', error);
    throw error;
  }
}
