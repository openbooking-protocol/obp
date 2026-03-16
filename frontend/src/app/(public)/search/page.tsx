import type { Metadata } from "next";
import Link from "next/link";
import { obpApi } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPrice } from "@/lib/utils/format";
import type { Service } from "@/lib/api/types";

export const metadata: Metadata = { title: "Search services" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; limit?: string }>;
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

  let services: Service[] = [];
  let error = "";

  try {
    const result = await obpApi.services.list({
      search: q || undefined,
      category: category || undefined,
      active: true,
      limit: 24,
    });
    services = result.data;
  } catch {
    error = "Failed to load services. Please try again.";
  }

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
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/search?${q ? `q=${encodeURIComponent(q)}&` : ""}${cat.key ? `category=${cat.key}` : ""}`}
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
      ) : services.length === 0 ? (
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
            {services.length} service{services.length !== 1 ? "s" : ""} found
            {q && ` for "${q}"`}
            {category && ` in ${category}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
