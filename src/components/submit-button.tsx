"use client";

import { useFormStatus } from "react-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function SubmitButton({ children, className = "button button-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending && <ArrowPathIcon className="icon spin" aria-hidden="true" />}
      {pending ? "Memproses..." : children}
    </button>
  );
}

