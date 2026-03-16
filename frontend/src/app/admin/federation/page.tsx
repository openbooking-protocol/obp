"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { formatRelative } from "@/lib/utils/format";
import type { FederationPeer } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  blocked: "destructive",
};

export default function FederationPage() {
  const [peers, setPeers] = useState<FederationPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetch = async () => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }
    try {
      const res = await obpApi.admin.federationPeers(apiKey);
      setPeers(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    const apiKey = getApiKey();
    if (!apiKey || !newUrl) return;
    setAdding(true);
    try {
      await obpApi.admin.addFederationPeer({ server_url: newUrl, name: newName || undefined }, apiKey);
      setShowAdd(false);
      setNewUrl("");
      setNewName("");
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add peer");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this federation peer?")) return;
    const apiKey = getApiKey();
    if (!apiKey) return;
    try {
      await obpApi.admin.removeFederationPeer(id, apiKey);
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Federation peers</h1>
        <Button onClick={() => setShowAdd(true)}>+ Add peer</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {peers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No federation peers.</p>
              <p className="mt-1 text-sm">Add a peer OBP server to enable cross-server booking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Server</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {peers.map((peer) => (
                    <tr key={peer.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{peer.name ?? peer.server_url}</p>
                        {peer.name && (
                          <p className="text-xs text-muted-foreground">{peer.server_url}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[peer.status] ?? "secondary"}>
                          {peer.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRelative(peer.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(peer.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add federation peer"
        description="Add another OBP server to the federation network."
      >
        <div className="space-y-4">
          <Input
            label="Server URL"
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://obp.example.com"
          />
          <Input
            label="Name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Example OBP Server"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} isLoading={adding}>
              Add peer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
