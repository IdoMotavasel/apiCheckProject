import React, { useEffect,useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setTokens, clearTokens } from '../../store/authSlice';
import { JwtPayload } from 'jwt-decode';

const TokenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate: NavigateFunction = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const { accessToken, refreshToken } = useSelector((state: RootState) => state.auth);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkTokens = async (): Promise<void> => {
            const isAccessTokenValid = (token: string): boolean => {
                if (!token) return false;
                    try {
                        const decodedToken: JwtPayload = jwtDecode(token);
                        if (decodedToken.exp) {
                            const expiryTime: number = decodedToken.exp * 1000;
                            return new Date().getTime() < expiryTime;
                        }
                        return false;
                    } catch {
                        return false;
                    }
            };

            if (!accessToken && !refreshToken) {
                dispatch(clearTokens());
                navigate('/auth/login');
                setLoading(false);
                return;
            }
            
            if(accessToken && !isAccessTokenValid(accessToken)) {
                if (refreshToken) {
                    try {
                        console.log('before refresh');
                        const refreshResponse = await axios.post('http://localhost:3000/refresh', { accessToken, refreshToken }, {
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        });

                        if (refreshResponse.status === 200) {
                            console.log('success');
                            const newAccessToken = refreshResponse.data.accessToken;
                            dispatch(setTokens({ accessToken: newAccessToken, refreshToken }));
                        } else {
                            console.log('not success');
                            dispatch(clearTokens());
                            navigate('/auth/login');
                        }
                    } catch(error:any) {
                        console.error('error while refreshing:\n',error);
                        dispatch(clearTokens());
                        navigate('/auth/login');
                    }
                } else {
                    dispatch(clearTokens());
                    navigate('/auth/login');
                }
            }
            setLoading(false);
        };

        checkTokens();
    }, [accessToken, refreshToken, dispatch, navigate]);

    if (loading) {
        return <div>Loading...</div>; 
    }

    return <>{children}</>;
};

export default TokenWrapper;