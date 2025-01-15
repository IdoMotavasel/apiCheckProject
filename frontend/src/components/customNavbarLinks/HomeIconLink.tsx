import React from 'react';
import { Link } from 'react-router-dom';
import apiIcon from '../../../assets/api-icon.png';
import { useTokenProperty, useToken } from "../../utils/decodingUtils";

const HomeIconLink: React.FC = () => {
    const accessToken: string =  useToken("access")!;
    const role: string = useTokenProperty("role");

    const getHomePath = (): string => {
        if(!accessToken) return 'auth/login';   
        return role === 'admin' ? 'admin/home' : '/user/home';
    };

    const homePath: string = getHomePath();

    return(
        <Link to={homePath} className="home-link">
            <img src={apiIcon} alt="Home" className="home-icon" />
        </Link>
    );
};

export default HomeIconLink;
