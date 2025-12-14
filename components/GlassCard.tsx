import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass rounded-2xl p-4 transition-all duration-300 dark:text-slate-100
        ${hoverEffect ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80' : 'shadow-sm'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};