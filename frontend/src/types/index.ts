export interface Refinement {
  id: number;
  originalText: string;
  refinedText: string;
  suggestions?: string[];
  context?: string;
  createdAt: string;
}

export interface RefineRequest {
  text: string;
  context?: string;
}

export interface RefineResponse {
  success: boolean;
  data?: Refinement;
  message?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: Refinement[];
  message?: string;
}

export interface User {
  id: number;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  message?: string;
}
