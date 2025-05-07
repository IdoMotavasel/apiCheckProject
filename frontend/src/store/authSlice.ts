import { createSlice, PayloadAction} from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    role: string | null;
};

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    role: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers:{
        setTokens: (state, action: PayloadAction<{accessToken: string; refreshToken: string}>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            try {
                const decoded: any = jwtDecode(action.payload.accessToken);
                state.role = decoded.role ?? null;
            } catch {
                state.role = null;
            }
        },
        clearTokens: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.role = null;
        },
    },
});

export const { setTokens, clearTokens } = authSlice.actions;
export default authSlice.reducer;