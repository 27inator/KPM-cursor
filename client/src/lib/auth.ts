import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem("auth_token", data.token);
  
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/register", { email, password });
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem("auth_token", data.token);
  
  return data;
}

export function logout(): void {
  localStorage.removeItem("auth_token");
}

export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
