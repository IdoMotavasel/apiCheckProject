import { Link } from 'react-router-dom';
import { useDispatch} from 'react-redux';
import { logoutUser } from '../../utils/authUtils';
import { useToken } from '../../utils/decodingUtils';
import { AppDispatch } from '../../store/store';

const LogoutLink = () => {
    const dispatch: AppDispatch = useDispatch();
    const accessToken: string | null  = useToken("access");
    const refreshToken: string | null = useToken("refresh");

    const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        await logoutUser(dispatch, accessToken, refreshToken);
    };
    return (
        <Link to="/auth/login" onClick={handleLogout}>Logout</Link>
    );
};

export default LogoutLink;
