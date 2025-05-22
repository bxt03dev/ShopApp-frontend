export interface SocialLoginResponse {
  message: string;
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  userProfile?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatarUrl: string;
    role: string;
    isNewUser: boolean;
  };
} 