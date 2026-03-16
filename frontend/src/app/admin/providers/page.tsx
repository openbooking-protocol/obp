"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import type { Provider } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
};

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetch = async () => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }
    try {
      const res = await obpApi.providers.list({ limit: 100 });
      setProviders(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action: "approve" | "suspend" | "delete", id: string) => {
    if (action === "delete" && !confirm("Delete this provider?")) return;
    const apiKey = getApiKey();
    if (!apiKey) return;
    setActionLoading(`${action}-${id}`);
    try {
      if (action === "approve") await obpApi.providers.approve(id, apiKey);
      else if (action === "suspend") await obpApi.providers.suspend(id, apiKey);
      else await obpApi.providers.delete(id, apiKey);
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Provider management</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {providers.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No providers.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.contact.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{p.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.location.city}, {p.location.country}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[p.status] ?? "secondary"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {p.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleAction("approve", p.id)}
                              isLoading={actionLoading === `approve-${p.id}`}
                            >
                              Approve
                            </Button>
                          )}
                          {p.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction("suspend", p.id)}
                              isLoading={actionLoading === `suspend-${p.id}`}
                            >
                              Suspend
                            </Button>
                          )}
                          {p.status === "suspended" && (
                            <Button
                              size="sm"
                              onClick={() => handleAction("approve", p.id)}
                              isLoading={actionLoading === `approve-${p.id}`}
                            >
                              Reinstate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction("delete", p.id)}
                            isLoading={actionLoading === `delete-${p.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
