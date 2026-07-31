import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-medical-500/50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 text-white shadow-md shadow-medical-500/10 active:scale-[0.98]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-md shadow-rose-500/10 active:scale-[0.98]',
    ghost: 'hover:bg-slate-850 text-slate-300 hover:text-white',
    glass: 'bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:text-white active:scale-[0.98]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      disabled={disabled || loading}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
