import { useState } from "react";
import { REGISTER_URL } from "../../urls";
import axios from "axios";
import { NavigateFunction, useNavigate } from "react-router-dom";
import "./register.css";

export default function Register(): JSX.Element {
    const [errorFeed, setErrorFeed] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [role, setRole] = useState<"user" | "admin" | "">("");
    const [adminGroupCode, setAdminGroupCode] = useState<string>("");
    const [authorizationCode, setAuthorizationCode] = useState<string>("");

    const navigate: NavigateFunction = useNavigate();


    const handleRegister = async (e:React.MouseEvent<HTMLButtonElement>): Promise<void> => { 
        e.preventDefault();
        console.log("role: ", role);
        const requestBody = {
            username,
            password,
            role,
            adminGroupCode: role === "user" ? adminGroupCode : undefined,
            adminAuthorizationCode: role === "admin" ? authorizationCode : undefined,
        };
        console.log("auth code: ", requestBody.adminAuthorizationCode);
        try{
            const response = await axios.post(REGISTER_URL, requestBody);
            if(response.status === 201){
                navigate("/auth/login");
                setUsername("");
                setPassword("");
                setRole("");
                setAdminGroupCode("");
                setAuthorizationCode(""); 
            } else setErrorFeed(response.data.message);
        }catch(error: any){
            setErrorFeed(error.response.data.message);
        }

    };

    const handleLoginRedirect = (): void => {
        navigate('/auth/login');
    };

    return (
        <div className="register-container">
            <h1 className="register-title">Register</h1>
            <form className="register-form">
                <div className="input-container">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="register-input"
                    />
                </div>
                <div className="input-container">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="register-input"
                    />
                </div>
                <div className="role-selection">
                    <label>
                    <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={role === "user"}
                        onChange={() => setRole("user")}
                        className="role-radio"
                    />
                    User
                    </label>
                    <label>
                    <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        className="role-radio"
                    />
                    Admin
                    </label>
                </div>

                {/* Conditional Inputs */}
                {role === "user" && (
                <div className="input-container">
                    <label>Admin Group Code:</label>
                    <input
                    type="text"
                    value={adminGroupCode}
                    onChange={(e) => setAdminGroupCode(e.target.value)}
                    placeholder="Enter admin group code"
                    className="register-input"
                    />
                </div>
                )}

                {role === "admin" && (
                <div className="input-container">
                    <label>Authorization Code:</label>
                    <input
                    type="text"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                    placeholder="Enter authorization code"
                    className="register-input"
                    />
                </div>
                )}

                <button onClick={handleRegister} className="register-button">Register</button>
                <button onClick={handleLoginRedirect} className="login-redirect-button">Back to login</button>
                <div className="error-message">{errorFeed}</div>
            </form>
        </div>
    );
}