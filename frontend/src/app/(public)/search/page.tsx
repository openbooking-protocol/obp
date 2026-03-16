import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { obpApi } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPrice } from "@/lib/utils/format";
import { FederatedToggle } from "@/components/search/federated-toggle";
import type { Service } from "@/lib/api/types";
import type { FederatedProviderResult } from "@/lib/api/types";

export const metadata: Metadata = { title: "Search services" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; limit?: string; federated?: string }>;
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";
  const federated = params.federated === "1";

  let services: Service[] = [];
  let federatedResults: FederatedProviderResult[] = [];
  let error = "";

  try {
    if (federated) {
      const result = await obpApi.federation.search({
        q: q || undefined,
        category: category || undefined,
        limit: 24,
      });
      federatedResults = result.data;
    } else {
      const result = await obpApi.services.list({
        search: q || undefined,
        category: category || undefined,
        active: true,
        limit: 24,
      });
      services = result.data;
    }
  } catch {
    error = "Failed to load services. Please try again.";
  }

  const totalCount = federated ? federatedResults.length : services.length;

  return (
    <div className="container px-4 py-8">
      {/* Search header */}
      <div className="mb-6">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Search services..."
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {federated && <input type="hidden" name="federated" value="1" />}
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category filter + federated toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/search?${q ? `q=${encodeURIComponent(q)}&` : ""}${cat.key ? `category=${cat.key}&` : ""}${federated ? "federated=1" : ""}`}
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

        <div className="ml-auto">
          <Suspense>
            <FederatedToggle federated={federated} />
          </Suspense>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : totalCount === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">No services found.</p>
          <p className="mt-1 text-sm">
            Try a different search term or{" "}
            <Link href="/search" className="text-primary hover:underline">
              browse all services
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {totalCount} {federated ? "provider" : "service"}{totalCount !== 1 ? "s" : ""} found
            {q && ` for "${q}"`}
            {category && ` in ${category}`}
            {federated && " across all servers"}
          </p>

          {federated ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {federatedResults.map((provider) => (
                <FederatedProviderCard key={`${provider.serverUrl}-${provider.id}`} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Server badge ───────────────────────────────────────────────────────────

function ServerBadge({ serverUrl }: { serverUrl?: string }) {
  const localBase = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";

  if (!serverUrl || serverUrl === localBase) {
    return (
      <Badge variant="success" className="text-xs">
        Local
      </Badge>
    );
  }

  let hostname = serverUrl;
  try {
    hostname = new URL(serverUrl).hostname;
  } catch {
    // keep as-is
  }

  return (
    <Badge variant="info" className="max-w-[120px] truncate text-xs" title={serverUrl}>
      {hostname}
    </Badge>
  );
}

// ── Local service card ─────────────────────────────────────────────────────

function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{service.name}</h3>
          {service.price && (
            <span className="shrink-0 text-sm font-semibold text-primary">
              {formatPrice(service.price.amount, service.price.currency)}
            </span>
          )}
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary">{formatDuration(service.duration_minutes)}</Badge>
          {service.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <Link
          href={`/providers/${service.provider_id}/services/${service.id}`}
          className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Book now
        </Link>
      </CardContent>
    </Card>
  );
}

// ── Federated provider card ────────────────────────────────────────────────

function FederatedProviderCard({ provider }: { provider: FederatedProviderResult }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {provider.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logo_url}
                alt=""
                className="h-8 w-8 rounded-md object-cover"
                width={32}
                height={32}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                {provider.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{provider.name}</h3>
              <p className="text-xs capitalize text-muted-foreground">{provider.category}</p>
            </div>
          </div>
          <ServerBadge serverUrl={provider.serverUrl} />
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {provider.category}
          </Badge>
        </div>
        <Link
          href={`/federation/search?q=${encodeURIComponent(provider.name)}`}
          className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View provider
        </Link>
      </CardContent>
    </Card>
  );
}
