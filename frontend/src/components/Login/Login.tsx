import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setTokens } from '../../store/authSlice';
import { useState, useEffect } from 'react';
import { NavigateFunction, useNavigate } from "react-router-dom";
import { LOGIN_URL } from '../../urls';
import { clearTokens } from '../../store/authSlice';
import { jwtDecode } from 'jwt-decode';
import { AppDispatch } from '../../store/store';

export default function Login():JSX.Element {
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        dispatch(clearTokens());
        //to add refresh to blacklist if was authenticated.
    }, [dispatch]);

    const [errorFeed, setErrorFeed] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const navigate: NavigateFunction = useNavigate();

    const handleLogin = async (e:React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        try{
            const response = await axios.post(LOGIN_URL, {username,password});
            if(response.status === 200 && response.data.userId){
                const { accessToken, refreshToken } = response.data;
                dispatch(setTokens({accessToken,refreshToken})); 
                const role: string | null = accessToken ? jwtDecode<{ role: string }>(accessToken).role : null;
                if (role === 'admin') {
                    console.log("redirecting to admin home");
                    navigate('/admin/home');
                } else if (role === 'user') {
                    console.log("redirecting to user home");
                    navigate('/user/home');
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
    <div>
        <h1>Login</h1>
        <div>
            <div>
                <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {errorFeed}
            </div>
            <div className="authentication-buttons">
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegisterRedirect}>Don't have an account? </button>
            </div>
        </div>
    </div>
    );
}