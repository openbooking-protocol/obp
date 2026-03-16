"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { obpApi, setAuthToken } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

// ── Inner component that reads search params ───────────────────────────────

function OAuth2CallbackInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Authorization denied: ${errorParam}`);
      setStatus("error");
      return;
    }

    if (!code) {
      setError("No authorization code received. Please try logging in again.");
      setStatus("error");
      return;
    }

    // Retrieve the code_verifier stored before the redirect
    const codeVerifier = sessionStorage.getItem("obp_pkce_verifier");
    if (!codeVerifier) {
      setError("PKCE verifier not found. Please try logging in again.");
      setStatus("error");
      return;
    }

    // Optionally validate state
    const savedState = sessionStorage.getItem("obp_oauth_state");
    if (savedState && state !== savedState) {
      setError("OAuth state mismatch. Possible CSRF attack. Please try logging in again.");
      setStatus("error");
      return;
    }

    const redirectUri = `${window.location.origin}/dashboard/oauth2/callback`;

    obpApi.auth
      .exchangeCode({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        client_id: "frontend",
      })
      .then((tokenResponse) => {
        // Store the token for API calls
        sessionStorage.setItem("obp_access_token", tokenResponse.access_token);
        setAuthToken(tokenResponse.access_token);

        // Clean up PKCE and state from sessionStorage
        sessionStorage.removeItem("obp_pkce_verifier");
        sessionStorage.removeItem("obp_oauth_state");

        setStatus("success");
        // Redirect to dashboard
        window.location.href = "/dashboard/overview";
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to exchange authorization code for token.";
        setError(msg);
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-md text-center">
      {status === "processing" && (
        <div className="space-y-4">
          <Spinner className="mx-auto h-10 w-10" />
          <p className="text-muted-foreground">Completing sign in, please wait...</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900">
            ✅
          </div>
          <p className="font-semibold text-green-700 dark:text-green-400">
            Signed in successfully! Redirecting...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link
            href="/dashboard/login"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ← Back to login
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────

export default function OAuth2CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <OAuth2CallbackInner />
      </Suspense>
    </div>
  );
}
