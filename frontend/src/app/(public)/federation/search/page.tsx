import type { Metadata } from "next";
import Link from "next/link";
import { obpApi } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FederatedProviderResult } from "@/lib/api/types";

export const metadata: Metadata = { title: "Federated search" };

interface FederationSearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "health", label: "Health" },
  { key: "beauty", label: "Beauty" },
  { key: "sport", label: "Sport" },
  { key: "education", label: "Education" },
  { key: "professional", label: "Professional" },
  { key: "other", label: "Other" },
];

export default async function FederationSearchPage({ searchParams }: FederationSearchPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";

  let results: FederatedProviderResult[] = [];
  let error = "";

  try {
    const res = await obpApi.federation.search({
      q: q || undefined,
      category: category || undefined,
      limit: 48,
    });
    results = res.data;
  } catch {
    error = "Failed to load federated results. Please try again.";
  }

  // Group results by serverUrl
  const grouped = results.reduce<Record<string, FederatedProviderResult[]>>((acc, provider) => {
    const key = provider.serverUrl;
    if (!acc[key]) acc[key] = [];
    acc[key].push(provider);
    return acc;
  }, {});

  const serverUrls = Object.keys(grouped);

  const localBase = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";

  // Sort: local server first, then alphabetically
  serverUrls.sort((a, b) => {
    if (a === localBase) return -1;
    if (b === localBase) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="container px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to local search
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Federated search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Results from all connected OBP servers
        </p>
      </div>

      {/* Search form */}
      <div className="mb-6">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Search across all servers..."
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/federation/search?${q ? `q=${encodeURIComponent(q)}&` : ""}${cat.key ? `category=${cat.key}` : ""}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
              category === cat.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary hover:text-primary"
            }`}
            aria-current={category === cat.key ? "true" : undefined}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Results */}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No providers found across the federation.</p>
          <p className="mt-1 text-sm">
            Try a different search term or{" "}
            <Link href="/federation/search" className="text-primary hover:underline">
              browse all federated providers
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <p className="text-sm text-muted-foreground">
            {results.length} provider{results.length !== 1 ? "s" : ""} found across{" "}
            {serverUrls.length} server{serverUrls.length !== 1 ? "s" : ""}
            {q && ` for "${q}"`}
            {category && ` in ${category}`}
          </p>

          {serverUrls.map((serverUrl) => {
            const isLocal = serverUrl === localBase;
            let hostname = serverUrl;
            try {
              hostname = new URL(serverUrl).hostname;
            } catch {
              // keep as-is
            }
            const serverProviders = grouped[serverUrl];

            return (
              <section key={serverUrl} aria-labelledby={`server-${hostname}`}>
                {/* Server section header */}
                <div
                  className={`mb-4 flex items-center gap-3 rounded-lg px-4 py-3 ${
                    isLocal
                      ? "bg-green-50 dark:bg-green-950"
                      : "bg-blue-50 dark:bg-blue-950"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isLocal
                        ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                        : "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {isLocal ? "L" : "E"}
                  </div>
                  <div>
                    <h2
                      id={`server-${hostname}`}
                      className={`font-semibold ${
                        isLocal
                          ? "text-green-800 dark:text-green-200"
                          : "text-blue-800 dark:text-blue-200"
                      }`}
                    >
                      {hostname}
                    </h2>
                    <p
                      className={`text-xs ${
                        isLocal
                          ? "text-green-600 dark:text-green-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isLocal ? "This server" : serverUrl} &mdash;{" "}
                      {serverProviders.length} provider{serverProviders.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ServerBadge isLocal={isLocal} hostname={hostname} className="ml-auto" />
                </div>

                {/* Provider cards for this server */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serverProviders.map((provider) => (
                    <FederatedProviderCard
                      key={`${serverUrl}-${provider.id}`}
                      provider={provider}
                      isLocal={isLocal}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Server badge ───────────────────────────────────────────────────────────

function ServerBadge({
  isLocal,
  hostname,
  className,
}: {
  isLocal: boolean;
  hostname: string;
  className?: string;
}) {
  if (isLocal) {
    return (
      <Badge variant="success" className={className}>
        Local
      </Badge>
    );
  }
  return (
    <Badge variant="info" className={`max-w-[160px] truncate ${className ?? ""}`} title={hostname}>
      {hostname}
    </Badge>
  );
}

// ── Federated provider card ────────────────────────────────────────────────

function FederatedProviderCard({
  provider,
  isLocal,
}: {
  provider: FederatedProviderResult;
  isLocal: boolean;
}) {
  let hostname = provider.serverUrl;
  try {
    hostname = new URL(provider.serverUrl).hostname;
  } catch {
    // keep as-is
  }

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {provider.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logo_url}
                alt=""
                className="h-9 w-9 rounded-md object-cover"
                width={36}
                height={36}
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                {provider.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{provider.name}</h3>
              <p className="text-xs capitalize text-muted-foreground">{provider.category}</p>
            </div>
          </div>
          <ServerBadge isLocal={isLocal} hostname={hostname} />
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {provider.category}
          </Badge>
          {provider.location?.city && (
            <Badge variant="outline">
              {provider.location.city}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{provider.location?.city}, {provider.location?.country}</span>
        </div>

        {isLocal ? (
          <Link
            href={`/providers/${provider.id}`}
            className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View services
          </Link>
        ) : (
          <a
            href={`${provider.serverUrl}/providers/${provider.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            View on {hostname} →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
