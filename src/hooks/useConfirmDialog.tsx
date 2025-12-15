import React, { useCallback, useRef, useState } from 'react';
import ConfirmDialog, { ConfirmVariant } from '../components/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    setState((s) => (s ? { ...s, open: false } : s));
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        variant: 'default',
        ...options,
      });
    });
  }, []);

  const dialog = (
    <ConfirmDialog
      open={!!state?.open}
      title={state?.title ?? ''}
      description={state?.description}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      variant={state?.variant}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}


