"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { obpApi } from "@/lib/api/client";

const CATEGORIES = [
  { value: "health", label: "Health" },
  { value: "beauty", label: "Beauty" },
  { value: "sport", label: "Sport" },
  { value: "education", label: "Education" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "other",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    country: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await obpApi.providers.create(
        {
          name: form.name,
          description: form.description,
          category: form.category as "health" | "beauty" | "sport" | "education" | "professional" | "other",
          location: {
            address: form.address,
            city: form.city,
            country: form.country,
          },
          timezone: form.timezone,
          contact: {
            email: form.email || undefined,
            phone: form.phone || undefined,
            website: form.website || undefined,
          },
        },
        // For self-registration, no API key needed (depends on server config)
        ""
      );
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <div className="mb-4 text-4xl">✅</div>
            <h2 className="mb-2 text-xl font-semibold">Registration submitted</h2>
            <p className="mb-6 text-muted-foreground">
              Your provider profile has been created. An admin will review and approve it shortly.
              You&apos;ll receive your API key once approved.
            </p>
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Return to home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-12">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            OBP
          </Link>
          <CardTitle>Register as provider</CardTitle>
          <CardDescription>Create your provider profile on this OBP server</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Business name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Salon"
            />
            <Textarea
              label="Description"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your business and services..."
              rows={3}
            />
            <Select
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES}
            />

            <div className="border-t border-border pt-2">
              <p className="mb-3 text-sm font-medium">Location</p>
              <div className="space-y-3">
                <Input
                  label="Address"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  <Input
                    label="Country"
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="RS"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-2">
              <p className="mb-3 text-sm font-medium">Contact</p>
              <div className="space-y-3">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Register
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/dashboard/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
