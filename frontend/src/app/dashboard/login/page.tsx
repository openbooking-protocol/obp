"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ── PKCE helpers ──────────────────────────────────────────────────────────

function generateRandomBase64Url(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  // base64url encode (no padding, replace + with -, / with _)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Component ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // ── API key login ──────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Please enter your API key.");
      return;
    }
    setLoading(true);
    setError("");

    // Store API key in sessionStorage and redirect to dashboard
    sessionStorage.setItem("obp_api_key", apiKey.trim());

    // Verify the key works by fetching providers
    try {
      const res = await fetch(
        `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000"}/obp/v1/providers`,
        { headers: { "X-Api-Key": apiKey.trim() } }
      );
      if (!res.ok) {
        throw new Error("Invalid API key");
      }
      window.location.href = "/dashboard/overview";
    } catch {
      setError("Invalid API key. Please check your credentials.");
      sessionStorage.removeItem("obp_api_key");
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth2 / PKCE login ────────────────────────────────────────────────

  const handleOAuthLogin = async () => {
    setOauthLoading(true);
    setError("");

    try {
      // Generate PKCE code_verifier (32 random bytes → base64url)
      const codeVerifier = generateRandomBase64Url(32);

      // code_challenge = BASE64URL(SHA-256(code_verifier))
      const codeChallenge = await sha256Base64Url(codeVerifier);

      // Generate a random state value for CSRF protection
      const state = generateRandomBase64Url(16);

      // Persist verifier and state before navigating away
      sessionStorage.setItem("obp_pkce_verifier", codeVerifier);
      sessionStorage.setItem("obp_oauth_state", state);

      const apiBase = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
      const redirectUri = `${window.location.origin}/dashboard/oauth2/callback`;

      const authUrl = new URL(`${apiBase}/obp/v1/auth/authorize`);
      authUrl.searchParams.set("client_id", "frontend");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "read write provider");
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("state", state);

      window.location.href = authUrl.toString();
    } catch {
      setError("Failed to initiate OAuth2 login. Please try again.");
      setOauthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            OBP
          </Link>
          <CardTitle>Provider sign in</CardTitle>
          <CardDescription>Sign in to your provider account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* API key login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="obpk_..."
              required
              autoComplete="current-password"
              hint="Your provider API key from the OBP server"
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* OAuth2 login */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-1 text-sm font-medium">Login with OAuth2</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Use OAuth2 authorization flow
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOAuthLogin}
              isLoading={oauthLoading}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              Login with OAuth2
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/dashboard/register" className="text-primary hover:underline">
              Register as provider
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
