export interface LoginRequestBody {
    username: string;
    password: string;
}

export interface RegisterRequestBody {
    username: string;
    password: string;
    role: 'user' | 'admin';
    adminGroupCode?: string;
    adminAuthorizationCode?: string;
}