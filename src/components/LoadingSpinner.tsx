import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--primary)]`}
        aria-hidden="true"
      />
      {text && <p className="text-sm text-[var(--text-secondary)]">{text}</p>}
      <span className="sr-only">{text ?? 'Chargement'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  const baseClasses = 'animate-pulse glass-light rounded-[var(--radius-sm)]';
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-20',
    circular: 'h-12 w-12 rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};
