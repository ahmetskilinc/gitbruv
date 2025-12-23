export interface AuthenticatedUser {
  id: string;
  username: string;
}

export interface Credentials {
  identifier: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}

