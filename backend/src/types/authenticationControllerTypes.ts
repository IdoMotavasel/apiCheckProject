export interface LoginRequestBody {
    username: string;
    password: string;
}

export interface LogoutRequestBody {
    refreshToken: string;
}

export interface RegisterRequestBody {
    username: string;
    password: string;
    role: 'user' | 'admin';
    adminGroupCode?: string;
    adminAuthorizationCode?: string;
}