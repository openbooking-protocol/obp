"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            OBP
          </Link>
          <CardTitle>Provider sign in</CardTitle>
          <CardDescription>Sign in with your OBP API key</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
