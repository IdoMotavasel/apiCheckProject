import React from 'react';
import { Link } from 'react-router-dom';
import apiIcon from '../../../assets/api-icon.png';
import { useToken } from "../../utils/decodingUtils";

const HomeIconLink: React.FC = () => {
    const accessToken: string =  useToken("access")!;

    const getHomePath = (): string => {  
        return accessToken ? '/home' : '/auth/login';
    };

    const homePath: string = getHomePath();

    return(
            <Link to={homePath} className="home-link">
                <img src={apiIcon} alt="Home" className="home-icon" />
            </Link>
    );
};

export default HomeIconLink;
