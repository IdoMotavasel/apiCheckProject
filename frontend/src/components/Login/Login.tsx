import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setTokens } from '../../store/authSlice';
import { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { LOGIN_URL } from '../../urls';
import { clearTokens } from '../../store/authSlice';
import { jwtDecode } from 'jwt-decode';
import { AppDispatch } from '../../store/store';
import "./login.css";

export default function Login():JSX.Element {
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        dispatch(clearTokens());
    }, [dispatch]);

    const [errorFeed, setErrorFeed] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const navigate: NavigateFunction = useNavigate();

    const handleLogin = async (e:React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        if (!username || !password) {
            setErrorFeed("Both fields must be filled!");
            return;
        }
        try{
            const response = await axios.post(LOGIN_URL, {username,password});
            if(response.status === 200 && response.data.userId){
                const { accessToken, refreshToken } = response.data;
                dispatch(setTokens({accessToken,refreshToken})); 
                const role: string | null = accessToken ? jwtDecode<{ role: string }>(accessToken).role : null;
                if (role === 'admin' || role === 'user') {
                    console.log("redirecting to shared home");
                    navigate('/home');
                }
            }
            else setErrorFeed(response.data.message);
        }catch(error: any){
            setErrorFeed(error.response.data.message);
        } 
    };

    const handleRegisterRedirect = (): void => {
        navigate('/auth/register');
    };

    return (
    <div className = "login-container">
        <h1 className="login-title">Login</h1>
        <div className="login-form">
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input"
                />
                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                />
                {errorFeed && (
                    <div className="error-message">{errorFeed}</div>
                )}
            </div>
            <div className="authentication-buttons">
                <button onClick={handleLogin} className="login-button">Login</button>
                <button onClick={handleRegisterRedirect} className="register-redirect-button">Don't have an account? </button>
            </div>
        </div>
    </div>
    );
}