import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:shadow-[0_0_20px_rgba(188,19,254,0.4)]',
      secondary: 'bg-secondary text-[#050508] hover:shadow-[0_0_20px_rgba(0,242,255,0.4)]',
      glass: 'glass-panel hover:bg-white/10',
      ghost: 'text-on-surface-variant hover:text-white transition-colors',
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-xs rounded-full',
      md: 'px-6 py-2 text-sm font-semibold rounded-full',
      lg: 'px-8 py-3 text-base font-bold rounded-xl md:rounded-full',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
