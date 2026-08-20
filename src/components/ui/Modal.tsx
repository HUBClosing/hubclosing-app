'use client';

import { Fragment, useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={clsx(
          'relative w-full bg-white rounded-2xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_24px_64px_rgba(0,0,0,0.08)]',
          'animate-[slideUp_200ms_ease-out]',
          sizeMap[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-brand-dark">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={clsx('px-6 pb-6', !title && 'pt-6')}>
          {children}
        </div>
      </div>
    </div>
  );
}
