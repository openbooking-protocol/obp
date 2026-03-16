import type { Metadata } from "next";
import Link from "next/link";
import { obpApi } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Provider } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "OpenBooking Protocol — Book services, openly",
};

const CATEGORIES = [
  { key: "health", label: "Health", emoji: "🏥" },
  { key: "beauty", label: "Beauty", emoji: "💅" },
  { key: "sport", label: "Sport", emoji: "⚽" },
  { key: "education", label: "Education", emoji: "📚" },
  { key: "professional", label: "Professional", emoji: "💼" },
  { key: "other", label: "Other", emoji: "✨" },
];

async function getFeaturedProviders(): Promise<Provider[]> {
  try {
    const result = await obpApi.providers.list({ limit: 6, status: "active" });
    return result.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const providers = await getFeaturedProviders();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-obp-50 to-background py-20 dark:from-obp-950">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Book services,{" "}
              <span className="text-primary">openly</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Discover and book services from independent providers across the federated
              OpenBooking network. No lock-in, no middleman.
            </p>
            <SearchBar />
            <p className="mt-4 text-sm text-muted-foreground">
              No account required to book.{" "}
              <Link href="/search" className="text-primary hover:underline">
                Browse all services →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container px-4">
          <h2 className="mb-6 text-2xl font-semibold">Browse by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={`/search?category=${cat.key}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="text-2xl" role="img" aria-label={cat.label}>
                  {cat.emoji}
                </span>
                <span className="text-sm font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured providers */}
      {providers.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Featured providers</h2>
              <Link href="/search" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Find a service",
                desc: "Search across all providers on this server and the wider OBP network.",
                icon: "🔍",
              },
              {
                step: "2",
                title: "Pick a time",
                desc: "Choose an available slot that works for you.",
                icon: "📅",
              },
              {
                step: "3",
                title: "Book instantly",
                desc: "Confirm your booking in seconds. No account required.",
                icon: "✅",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mb-4 flex justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {item.icon}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for providers */}
      <section className="border-t border-border bg-muted/30 py-12">
        <div className="container px-4 text-center">
          <h2 className="mb-3 text-2xl font-semibold">Are you a service provider?</h2>
          <p className="mb-6 text-muted-foreground">
            Join the open booking network. Set up your profile and start accepting bookings for free.
          </p>
          <Link
            href="/dashboard/register"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Register as provider
          </Link>
        </div>
      </section>
    </>
  );
}

function SearchBar() {
  return (
    <form action="/search" className="flex gap-2">
      <input
        name="q"
        type="search"
        placeholder="Search for a service, category, or provider..."
        className="flex h-11 flex-1 rounded-md border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Search services"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Search
      </button>
    </form>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.logo_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
                width={40}
                height={40}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                {provider.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold leading-tight">{provider.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{provider.category}</p>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            {provider.category}
          </Badge>
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {provider.location.city}, {provider.location.country}
          </span>
          <Link
            href={`/providers/${provider.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View services →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
