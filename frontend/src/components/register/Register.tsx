import { useState, useEffect } from "react";
import { REGISTER_URL } from "../../urls";
import axios from "axios";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "./register.css";

export default function Register(): JSX.Element {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [role, setRole] = useState<"user" | "admin" | "">("");
    const [adminGroupCode, setAdminGroupCode] = useState<string>("");
    const [authorizationCode, setAuthorizationCode] = useState<string>("");

    const [isLengthValid, setIsLengthValid] = useState(false);
    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasLowerCase, setHasLowerCase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);
    const [usernameError, setUsernameError] = useState<string>("");

    const navigate: NavigateFunction = useNavigate();

    useEffect(() => {
        setIsLengthValid(password.length >= 8);
        setHasUpperCase(/[A-Z]/.test(password));
        setHasLowerCase(/[a-z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
        setHasSpecialChar(/[^A-Za-z0-9]/.test(password));
    }, [password]);

    const isUsernameValid = (username: string) => {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    };

    const handleRegister = async (e:React.MouseEvent<HTMLButtonElement>): Promise<void> => { 
        e.preventDefault();

        if (!username || !password || !role) {
            toast.error("All fields must be filled!");
            return;
        }

        if (!isUsernameValid(username)) {
            toast.error("Username does not meet the requirements");
            return;
        }

        if (!(isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
            toast.error("Password does not meet complexity requirements.");
            return;
        }
    
        // Validate role-specific field
        if (role === "user" && !adminGroupCode) {
            toast.error("Admin group code must be provided for users!");
            return;
        }
    
        if (role === "admin" && !authorizationCode) {
            toast.error("Authorization code must be provided for admins!");
            return;
        }

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
            } else toast.error(response.data.message);
        }catch(error: any){
            toast.error(error.response.data.message);
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
                        onChange={(e) => {
                            const value = e.target.value;
                            setUsername(value);
                          
                            if (value.length < 3) {
                              setUsernameError("Username must be at least 3 characters.");
                            } else if (value.length > 20) {
                              setUsernameError("Username must be at most 20 characters.");
                            } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                              setUsernameError("only letters, numbers, and '_' allowed.");
                            } else {
                              setUsernameError(""); // Valid
                            }
                          }}
                        placeholder="Enter username. 3-20 chars"
                    />
                    <div className="username-error-container">
                        {usernameError && <p className="username-error">{usernameError}</p>}
                    </div>
                </div>
                <div className="input-container">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                    />
                </div>

                <ul className="requirements-list">
                    <li className="requirement-item">{isLengthValid ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />} Minimum 8 characters</li>
                    <li className="requirement-item">{hasUpperCase ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />} At least 1 uppercase letter</li>
                    <li className="requirement-item">{hasLowerCase ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />} At least 1 lowercase letter</li>
                    <li className="requirement-item">{hasNumber ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />} At least 1 number</li>
                    <li className="requirement-item">{hasSpecialChar ? <FaCheck className="icon valid" /> : <FaTimes className="icon invalid" />} At least 1 special character</li>
                </ul>

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
                    <span>User</span>
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
                    <span>Admin</span>
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
                    />
                </div>
                )}

                {role === "admin" && (
                <div className="input-container">
                    <label>Authorization Code:</label>
                    <input
                    type="password"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                    placeholder="Enter authorization code"
                    />
                </div>
                )}

                <button onClick={handleRegister} className="register-button">Register</button>
                <button onClick={handleLoginRedirect} className="login-redirect-button">Back to login</button>
            </form>
        </div>
    );
}