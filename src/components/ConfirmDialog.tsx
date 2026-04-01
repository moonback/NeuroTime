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

    // Slight delay so focus doesn't fire before the animation settles
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={[
          // Base: glass card, full-width on mobile (bottom sheet), constrained on desktop
          'w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-in-up',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.5)] sm:shadow-2xl',
          // Glass surface
          'bg-[rgba(13,16,28,0.95)] backdrop-blur-xl',
          // Border — danger gets a gradient left-accent, default stays subtle
          isDanger
            ? 'border border-red-500/20 sm:border-red-500/25'
            : 'border border-white/[0.08]',
        ].join(' ')}
      >
        {/* Danger accent bar at top */}
        {isDanger && (
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
        )}
        {/* Default accent bar at top */}
        {!isDanger && (
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            {/* Icon badge */}
            <div
              className={[
                'shrink-0 mt-0.5 p-2 rounded-xl border',
                isDanger
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
              ].join(' ')}
              aria-hidden="true"
            >
              {isDanger
                ? <AlertTriangle size={15} strokeWidth={2.5} />
                : <Info size={15} strokeWidth={2.5} />
              }
            </div>

            <div className="min-w-0 pt-0.5">
              <h3
                id="confirm-dialog-title"
                className="text-sm font-bold text-gray-100 leading-snug"
              >
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 h-px bg-white/[0.05]" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="glass-button px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-[0.96]',
              isDanger
                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20',
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
