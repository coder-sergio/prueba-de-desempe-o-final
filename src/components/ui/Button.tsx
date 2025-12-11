'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}

export const Button = ({ variant = 'primary', size = 'md', className, children, ...props }: Props) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium shadow',
        variant === 'primary' && 'px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
        variant === 'outline' && 'px-4 py-2 bg-transparent border border-white/10 text-white',
        variant === 'danger' && 'px-4 py-2 bg-red-600 text-white hover:bg-red-700',
        size === 'sm' && 'px-3 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
