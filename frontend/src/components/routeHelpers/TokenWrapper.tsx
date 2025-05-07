import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setTokens, clearTokens } from '../../store/authSlice';

const TokenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { accessToken, refreshToken, role } = useSelector((state: RootState) => state.auth);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTokenExpired = (token: string): boolean => {
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      return !exp || Date.now() > exp * 1000;
    } catch {
      return true;
    }
  };

  const refreshTokens = async () => {
    try {
      const response = await axios.post('http://localhost:3000/refresh', {
        accessToken,
        refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 200) {
        const { accessToken: newAccessToken } = response.data;
        console.log("🆕 New access token received: ", newAccessToken);
        if (refreshToken) {
            dispatch(setTokens({ accessToken: newAccessToken, refreshToken }));
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      dispatch(clearTokens());
      navigate('/auth/login');
    }
  };

  useEffect(() => {
    const checkAndRefresh = async () => {
      if (!accessToken || isTokenExpired(accessToken)) {
        if (refreshToken && !isTokenExpired(refreshToken)) {
          await refreshTokens();
        } else {
          dispatch(clearTokens());
          navigate('/auth/login');
          return;
        }
      }
    };

    checkAndRefresh();

    // Periodic refresh
    if (!refreshIntervalRef.current) {
      refreshIntervalRef.current = setInterval(() => {
        if (accessToken) {
          try {
            const { exp } = jwtDecode<JwtPayload>(accessToken);
            const timeLeft = exp! * 1000 - Date.now();
            if (timeLeft < 30000) {
              refreshTokens();
            }
          } catch {
            console.warn('Invalid token during interval check');
          }
        }
      }, 15000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [accessToken, refreshToken, dispatch, navigate]);

  useEffect(() => {
    // ✅ Set loading done only when all required fields are in Redux
    if (accessToken && refreshToken && role) {
      console.log("🟢 Tokens & role ready — rendering app");
      setIsTokenChecked(true);
    } else {
      console.log("🟡 Waiting for tokens/role. Current:", { accessToken, refreshToken, role });
    }
  }, [accessToken, refreshToken, role]);

  if (!isTokenChecked) return <div>Loading...</div>;
  return <>{children}</>;
};

export default TokenWrapper;


/*import React, { useEffect,useState } from 'react';
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
    const [key, setKey] = useState<number>(0);

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
                            setKey(prevKey => prevKey + 1);
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

    return <div key={key}>{children}</div>;
};

export default TokenWrapper;*/