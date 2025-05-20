import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoutLink from '../customNavbarLinks/LogoutLink';
import HomeIconLink from '../customNavbarLinks/HomeIconLink';
import '../../globalCss/navbar.css';

interface NavbarProps {
  links: { name: string; href: string }[]; 
}

const Navbar: React.FC<NavbarProps> = ({ links }) => {
  const location = useLocation();
  return (
    <nav className="navbar">
    <div className="navbar-content">
      <div className="navbar-left">
        <HomeIconLink />
      </div>
      <div className="navbar-center">
        {links.map((link, index) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={index}
                to={link.href}
                className={isActive ? 'active-link' : ''}
              >
                {link.name}
              </Link>
            );
          })}
      </div>
      <div className="navbar-right">
        <LogoutLink />
      </div>
    </div>
  </nav>
  );
};

export default Navbar;