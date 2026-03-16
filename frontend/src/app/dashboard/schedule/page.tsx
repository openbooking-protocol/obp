"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecurringRule, ScheduleException } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [providerId, setProviderId] = useState("");
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }

    obpApi.providers.list({ limit: 1 })
      .then(async (pRes) => {
        const p = pRes.data[0];
        if (!p) return;
        setProviderId(p.id);
        setTimezone(p.timezone);
        try {
          const schedule = await obpApi.schedule.get(p.id, apiKey);
          setRules(schedule.recurring_rules);
          setExceptions(schedule.exceptions);
          if (schedule.timezone) setTimezone(schedule.timezone);
        } catch {
          // No schedule yet
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addRule = () => {
    setRules([...rules, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }]);
  };

  const updateRule = (i: number, key: keyof RecurringRule, value: string | number) => {
    const next = [...rules];
    if (key === "day_of_week") next[i] = { ...next[i]!, [key]: parseInt(value as string) };
    else next[i] = { ...next[i]!, [key]: value };
    setRules(next);
  };

  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));

  const addException = () => {
    const today = new Date().toISOString().split("T")[0]!;
    setExceptions([...exceptions, { date: today, available: false }]);
  };

  const updateException = (i: number, key: keyof ScheduleException, value: string | boolean) => {
    const next = [...exceptions];
    next[i] = { ...next[i]!, [key]: value };
    setExceptions(next);
  };

  const removeException = (i: number) => setExceptions(exceptions.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const apiKey = getApiKey();
    if (!apiKey || !providerId) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await obpApi.schedule.upsert(
        { provider_id: providerId, timezone, recurring_rules: rules, exceptions },
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
      <h1 className="mb-6 text-2xl font-bold">Schedule</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>Schedule saved!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Europe/Belgrade"
              />
            </div>
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <select
                    value={rule.day_of_week}
                    onChange={(e) => updateRule(i, "day_of_week", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {DAYS.map((day, d) => (
                      <option key={d} value={d}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) => updateRule(i, "start_time", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) => updateRule(i, "end_time", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeRule(i)}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addRule} className="mt-3">
              + Add hours
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exceptions (holidays, special days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exceptions.map((exc, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={exc.date}
                    onChange={(e) => updateException(i, "date", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exc.available}
                      onChange={(e) => updateException(i, "available", e.target.checked)}
                    />
                    Available (custom hours)
                  </label>
                  {exc.available && (
                    <>
                      <input
                        type="time"
                        value={exc.start_time ?? "09:00"}
                        onChange={(e) => updateException(i, "start_time", e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={exc.end_time ?? "17:00"}
                        onChange={(e) => updateException(i, "end_time", e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeException(i)}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addException} className="mt-3">
              + Add exception
            </Button>
          </CardContent>
        </Card>

        <Button onClick={handleSave} isLoading={saving}>
          Save schedule
        </Button>
      </div>
    </div>
  );
}
