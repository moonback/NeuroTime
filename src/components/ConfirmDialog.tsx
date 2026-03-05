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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm glass-card rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-white/[0.06] bg-white/[0.03]">
          <div className="flex items-start gap-2.5">
            <div
              className={[
                'shrink-0 p-1.5 rounded-lg border',
                isDanger
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
              ].join(' ')}
              aria-hidden="true"
            >
              <AlertTriangle size={16} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-100 leading-snug">
                {title}
              </h3>
              {description && (
                <p className="mt-0.5 text-[11px] text-gray-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/[0.06] transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex items-center justify-end gap-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="glass-button px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:border-indigo-500/30"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'px-3 py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all active:scale-[0.97]',
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-indigo-500 hover:bg-indigo-600',
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
