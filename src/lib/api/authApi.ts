import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResultDto {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResultDto {
  message: string;
  email: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: 'Customer' | 'Admin';
  accessToken: string;
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'Customer' | 'Admin';
  };
}

export const authApi = {
  /**
   * POST /auth/login → AuthResultDto
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResultDto>('/auth/login', data);
    const dto = res.data;
    const computedName = dto.email.split('@')[0].replace(/[._-]/g, ' ');
    const computedRole = (dto.role === 'Admin' ? 'Admin' : 'Customer') as 'Customer' | 'Admin';

    return {
      userId: String(dto.userId),
      email: dto.email,
      fullName: computedName,
      role: computedRole,
      accessToken: dto.accessToken,
      token: dto.accessToken,
      user: {
        id: String(dto.userId),
        email: dto.email,
        fullName: computedName,
        role: computedRole,
      },
    };
  },

  /**
   * POST /auth/register → RegisterResultDto
   */
  async register(data: RegisterRequest): Promise<RegisterResultDto> {
    const res = await apiClient.post<any>('/auth/register', data);
    const msg = res.data?.message || res.data?.Message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.';
    const email = res.data?.email || res.data?.Email || data.email;
    return { message: String(msg), email: String(email) };
  },

  /**
   * GET /auth/verify-email?token=...
   */
  async verifyEmail(token: string): Promise<string> {
    const safeToken = token.includes(' ') ? token.replace(/ /g, '+') : token;
    const res = await apiClient.get<any>('/auth/verify-email', {
      params: { token: safeToken },
    });
    const msg = res.data?.message || res.data?.Message || 'Xác minh email thành công. Bạn có thể đăng nhập ngay bây giờ.';
    return String(msg);
  },

  /**
   * POST /auth/forgot-password → { message }
   */
  async forgotPassword(email: string): Promise<string> {
    const res = await apiClient.post<any>('/auth/forgot-password', { email });
    return res.data?.message || 'Link đặt lại mật khẩu đã được gửi đến email của bạn!';
  },

  /**
   * POST /auth/resend-verification → { message }
   */
  async resendVerification(email: string): Promise<string> {
    const res = await apiClient.post<any>('/auth/resend-verification', { email });
    return res.data?.message || 'Link xác minh mới đã được gửi lại thành công! Vui lòng kiểm tra email.';
  },

  /**
   * PATCH /auth/change-password
   */
  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    await apiClient.patch('/auth/change-password', data);
  },

  /**
   * POST /auth/reset-password → { token, newPassword }
   */
  async resetPassword(data: { token: string; newPassword: string }): Promise<string> {
    const safeToken = data.token.includes(' ') ? data.token.replace(/ /g, '+') : data.token;
    const res = await apiClient.post<any>('/auth/reset-password', {
      token: safeToken,
      newPassword: data.newPassword,
    });
    return res.data?.message || 'Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.';
  },
};
