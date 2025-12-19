import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);

    // Lock scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus a safe target
    cancelBtnRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md glass-card rounded-2xl border border-gray-500/10 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-500/10 bg-gray-500/5">
          <div className="flex items-start gap-3">
            <div
              className={[
                'shrink-0 p-2 rounded-xl border',
                isDanger
                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                  : 'bg-primary-500/15 border-primary-500/30 text-primary-300',
              ].join(' ')}
              aria-hidden="true"
            >
              <AlertTriangle size={18} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-black text-gray-100 leading-snug">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-xs md:text-sm text-gray-400 font-medium leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-500/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="glass-button px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:border-primary-500/40"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all',
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600',
            ].join(' ')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


