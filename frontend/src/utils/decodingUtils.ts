import { RootState } from "../store/store";
import { useSelector } from "react-redux";
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
    role?: string;
    userId?: string;
    username?: string;
    exp?: string;
};

interface TokenType {
    access?: 'access';
    refresh?: 'refresh';
}

export const useTokenProperty = (property: keyof TokenPayload): string => {
    const { accessToken } = useSelector((state: RootState) => state.auth);
    const decodedToken = jwtDecode<TokenPayload>(accessToken!);
    return decodedToken[property]!;
};

export const useToken = (tokenType: keyof TokenType): string | null => {
    const token: string | null = useSelector((state: RootState) =>
        tokenType === "access" ? state.auth.accessToken : state.auth.refreshToken
      );
      return token || null;
};