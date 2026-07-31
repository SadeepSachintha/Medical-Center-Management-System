import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'none';
  hoverEffect?: boolean;
}

export function Card({ children, className, glowColor = 'none', hoverEffect = true, ...props }: CardProps) {
  const glowStyles = {
    none: '',
    cyan: 'shadow-[0_0_15px_rgba(14,165,233,0.1)] border-medical-500/30',
    emerald: 'shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-500/30',
    rose: 'shadow-[0_0_15px_rgba(244,63,94,0.1)] border-rose-500/30',
    amber: 'shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-500/30',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5',
          hoverEffect && 'hover:border-slate-700/65 hover:bg-slate-900/70 transition-all duration-300',
          glowStyles[glowColor],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
