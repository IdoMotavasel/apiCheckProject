import { useState } from "react";
import { REGISTER_URL } from "../../urls";
import axios from "axios";
import { NavigateFunction, useNavigate } from "react-router-dom";

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
        <div>
            <h1>Register</h1>
            <form>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                    />
                </div>
                <div>
                    <label>
                    <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={role === "user"}
                        onChange={() => setRole("user")}
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
                    />
                    Admin
                    </label>
                </div>

                {/* Conditional Inputs */}
                {role === "user" && (
                <div>
                    <label>Admin Group Code:</label>
                    <input
                    type="text"
                    value={adminGroupCode}
                    onChange={(e) => setAdminGroupCode(e.target.value)}
                    placeholder="Enter admin group code"
                    />
                </div>
                )}

                {role === "admin" && (
                <div>
                    <label>Authorization Code:</label>
                    <input
                    type="text"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                    placeholder="Enter authorization code"
                    />
                </div>
                )}

                <button onClick={handleRegister}>Register</button>
                <button onClick={handleLoginRedirect}>Back to login</button>
                <div>{errorFeed}</div>
                <div>{role}</div>
            </form>
        </div>
    );
}