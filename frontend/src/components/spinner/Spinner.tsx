import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  text?: string;              // Text inside the spinner circle
  size?: 'small' | 'medium' | 'large';
}

const Spinner: React.FC<SpinnerProps> = ({ text = '', size = 'medium' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large',
  }[size];

  const textSizeClass = {
    small: 'home-spinner-text-small',
    medium: 'home-spinner-text-medium',
    large: 'home-spinner-text-large',
  }[size];

  return (
    <div className={`home-spinner-wrapper ${sizeClass}`}>
      <div className="home-spinner">
        {text && (
          <div className={`home-spinner-text ${textSizeClass}`}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Spinner;
