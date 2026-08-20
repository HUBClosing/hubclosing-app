'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'border-emerald-200 bg-white text-emerald-800',
  error: 'border-red-200 bg-white text-red-800',
  info: 'border-blue-200 bg-white text-blue-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Entry animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = icons[type];

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-[60] flex items-center gap-3',
        'max-w-sm px-4 py-3 rounded-xl border',
        'shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.06)]',
        'transition-all duration-200 ease-out',
        styles[type],
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3',
      )}
    >
      <Icon className={clsx('h-5 w-5 flex-shrink-0', iconStyles[type])} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(onClose, 200);
        }}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
