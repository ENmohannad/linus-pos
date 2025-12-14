import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div 
      className="relative flex items-center justify-center bg-primary-500 rounded-xl shadow-lg shadow-primary-500/30 transition-all duration-500 hover:scale-105 group cursor-pointer overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 opacity-100" />
      
      {/* The L Shape */}
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="relative z-10 transform transition-transform duration-500 group-hover:translate-x-1"
      >
        <path d="M4 4v16h16" className="animate-pulse-slow" />
      </svg>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    </div>
  );
};