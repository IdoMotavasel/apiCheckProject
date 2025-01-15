import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';
import LogoutLink from '../customNavbarLinks/LogoutLink';
import HomeIconLink from '../customNavbarLinks/HomeIconLink';

interface NavbarProps {
  links: { name: string; href: string }[]; 
}

const Navbar: React.FC<NavbarProps> = ({ links }) => {
    return (
        <nav className="navbar">
          <ul>
          <li>
              <HomeIconLink />
          </li>
            {links.map((link, index) => (
              <li key={index}>
                <Link to={link.href}>{link.name}</Link>
              </li>
            ))}
            <li>
              <LogoutLink />
            </li>
          </ul>
        </nav>
      );
};

export default Navbar;