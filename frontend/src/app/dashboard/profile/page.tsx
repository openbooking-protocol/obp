"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Provider } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const CATEGORIES = [
  { value: "health", label: "Health" },
  { value: "beauty", label: "Beauty" },
  { value: "sport", label: "Sport" },
  { value: "education", label: "Education" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" },
];

export default function ProfilePage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "other",
    address: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    website: "",
    logo_url: "",
    timezone: "",
  });

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }

    obpApi.providers.list({ limit: 1 })
      .then((res) => {
        const p = res.data[0];
        if (p) {
          setProvider(p);
          setForm({
            name: p.name,
            description: p.description,
            category: p.category,
            address: p.location.address,
            city: p.location.city,
            country: p.location.country,
            email: p.contact.email ?? "",
            phone: p.contact.phone ?? "",
            website: p.contact.website ?? "",
            logo_url: p.logo_url ?? "",
            timezone: p.timezone,
          });
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!provider) return;
    const apiKey = getApiKey();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await obpApi.providers.update(
        provider.id,
        {
          name: form.name,
          description: form.description,
          category: form.category as Provider["category"],
          location: { address: form.address, city: form.city, country: form.country },
          timezone: form.timezone,
          contact: {
            email: form.email || undefined,
            phone: form.phone || undefined,
            website: form.website || undefined,
          },
          logo_url: form.logo_url || undefined,
        },
        apiKey
      );
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Provider profile</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>Profile saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES}
            />
            <Input
              label="Logo URL"
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <Input
              label="Timezone"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="Europe/Belgrade"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            />
          </CardContent>
        </Card>

        <Button onClick={handleSave} isLoading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
