"use client";

type ToastArgs = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  // Minimal placeholder supaya build lolos.
  // Nanti bisa Anda upgrade ke sistem toast proper (shadcn).
  const toast = (args: ToastArgs) => {
    // eslint-disable-next-line no-console
    console.log("toast:", args);
  };

  return { toast };
}
