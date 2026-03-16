"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { formatDuration, formatPrice } from "@/lib/utils/format";
import type { Service, CreateServiceInput } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

function getProviderId() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_provider_id") ?? "";
}

const EMPTY_FORM: CreateServiceInput = {
  name: "",
  description: "",
  duration_minutes: 60,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  price: { amount: 0, currency: "EUR" },
  max_participants: 1,
  requires_confirmation: false,
  tags: [],
  active: true,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState<CreateServiceInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState("");

  const fetchServices = async () => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }
    try {
      // Get provider ID if not already stored
      let pid = getProviderId();
      if (!pid) {
        const pRes = await obpApi.providers.list({ limit: 1 });
        pid = pRes.data[0]?.id ?? "";
        if (pid) sessionStorage.setItem("obp_provider_id", pid);
      }
      setProviderId(pid);
      if (pid) {
        const res = await obpApi.services.list({ provider_id: pid });
        setServices(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (service: Service) => {
    setEditService(service);
    setForm({
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      buffer_before_minutes: service.buffer_before_minutes,
      buffer_after_minutes: service.buffer_after_minutes,
      price: service.price,
      max_participants: service.max_participants,
      requires_confirmation: service.requires_confirmation,
      tags: service.tags,
      active: service.active,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditService(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleSave = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return;
    setSaving(true);
    setError("");
    try {
      if (editService) {
        await obpApi.services.update(editService.id, form, apiKey);
      } else {
        await obpApi.services.create(providerId, form, apiKey);
      }
      setShowForm(false);
      fetchServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const apiKey = getApiKey();
    if (!apiKey) return;
    try {
      await obpApi.services.delete(id, apiKey);
      fetchServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleToggleActive = async (service: Service) => {
    const apiKey = getApiKey();
    if (!apiKey) return;
    try {
      await obpApi.services.update(service.id, { active: !service.active }, apiKey);
      fetchServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={openCreate}>+ Add service</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">No services yet.</p>
            <Button onClick={openCreate}>Add your first service</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{service.name}</h3>
                    <Badge variant={service.active ? "success" : "secondary"}>
                      {service.active ? "Active" : "Inactive"}
                    </Badge>
                    {service.requires_confirmation && (
                      <Badge variant="warning">Needs confirmation</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {service.description}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{formatDuration(service.duration_minutes)}</span>
                    {service.price && (
                      <span>{formatPrice(service.price.amount, service.price.currency)}</span>
                    )}
                    <span>Max {service.max_participants} participant(s)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleToggleActive(service)}>
                    {service.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(service)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editService ? "Edit service" : "Add service"}
        className="max-w-xl"
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          <Input
            label="Service name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
            />
            <Input
              label="Max participants"
              type="number"
              min={1}
              value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Buffer before (min)"
              type="number"
              min={0}
              value={form.buffer_before_minutes}
              onChange={(e) => setForm({ ...form, buffer_before_minutes: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Buffer after (min)"
              type="number"
              min={0}
              value={form.buffer_after_minutes}
              onChange={(e) => setForm({ ...form, buffer_after_minutes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (cents)"
              type="number"
              min={0}
              value={form.price?.amount ?? 0}
              onChange={(e) => setForm({ ...form, price: { amount: parseInt(e.target.value) || 0, currency: form.price?.currency ?? "EUR" } })}
            />
            <Input
              label="Currency"
              value={form.price?.currency ?? "EUR"}
              onChange={(e) => setForm({ ...form, price: { amount: form.price?.amount ?? 0, currency: e.target.value } })}
              placeholder="EUR"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="requires_confirmation"
              type="checkbox"
              checked={form.requires_confirmation ?? false}
              onChange={(e) => setForm({ ...form, requires_confirmation: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="requires_confirmation" className="text-sm">
              Requires manual confirmation
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="active" className="text-sm">
              Active (visible to customers)
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editService ? "Save changes" : "Create service"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
