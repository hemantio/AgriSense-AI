/**
 * AgriSense AI — User & Auth Types
 * ====================================
 * TypeScript interfaces matching the backend Pydantic schemas.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "farmer";
  phone_number?: string;
  village_name?: string;
  preferred_language: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "admin" | "farmer";
  phone_number?: string;
  village_name?: string;
  preferred_language?: string;
  notes?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserUpdateRequest {
  name?: string;
  phone_number?: string;
  village_name?: string;
  preferred_language?: string;
  notes?: string;
}
