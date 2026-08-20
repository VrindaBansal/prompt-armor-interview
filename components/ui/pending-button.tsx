"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./button";

export interface PendingButtonProps extends ButtonProps {
  pendingLabel: string;
}

export function PendingButton({ children, disabled, pendingLabel, ...props }: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button aria-busy={pending || undefined} disabled={disabled || pending} loading={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
