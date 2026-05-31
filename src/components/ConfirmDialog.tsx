import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

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
    const t = setTimeout(() => cancelBtnRef.current?.focus(), 50);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/72 p-3 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)] animate-scale-in sm:max-w-md">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-5">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 shrink-0 rounded-xl border p-2.5 ${isDanger
                ? 'border-red-500/20 bg-red-500/10 text-[var(--danger)]'
                : 'border-[var(--border-subtle)] bg-white/[0.035] text-[var(--accent)]'
                }`}
              aria-hidden="true"
            >
              {isDanger ? <AlertTriangle size={17} strokeWidth={2.4} /> : <Info size={17} strokeWidth={2.4} />}
            </div>

            <div className="min-w-0 pt-0.5">
              <h3 id="confirm-dialog-title" className="text-base font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
                {title}
              </h3>
              {description && (
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost inline-flex h-9 min-h-0 w-9 shrink-0 items-center justify-center p-0"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="btn-secondary px-4 text-sm font-semibold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${isDanger ? 'btn-danger' : 'btn-primary'} px-4 text-sm font-semibold`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
