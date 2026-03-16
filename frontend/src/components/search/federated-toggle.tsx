"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface FederatedToggleProps {
  federated: boolean;
}

export function FederatedToggle({ federated }: FederatedToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (federated) {
      params.delete("federated");
    } else {
      params.set("federated", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [federated, pathname, router, searchParams]);

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={federated}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        federated
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full border-2 transition-colors ${
          federated ? "border-primary-foreground bg-primary-foreground" : "border-muted-foreground"
        }`}
        aria-hidden="true"
      />
      {federated ? "All servers" : "This server only"}
    </button>
  );
}
