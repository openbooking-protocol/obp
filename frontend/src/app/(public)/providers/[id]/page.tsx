import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obpApi } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatPrice } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const provider = await obpApi.providers.get(id);
    return { title: provider.name };
  } catch {
    return { title: "Provider" };
  }
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;

  let provider, services;
  try {
    [provider, services] = await Promise.all([
      obpApi.providers.get(id),
      obpApi.services.list({ provider_id: id, active: true }),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="container px-4 py-8">
      {/* Provider header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        {provider.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={provider.logo_url}
            alt=""
            className="h-20 w-20 rounded-xl object-cover"
            width={80}
            height={80}
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary">
            {provider.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{provider.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {provider.category}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">{provider.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>📍 {provider.location.city}, {provider.location.country}</span>
            {provider.contact.phone && <span>📞 {provider.contact.phone}</span>}
            {provider.contact.email && (
              <a href={`mailto:${provider.contact.email}`} className="hover:text-foreground">
                ✉️ {provider.contact.email}
              </a>
            )}
            {provider.contact.website && (
              <a
                href={provider.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                🌐 Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Services */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Services</h2>
        {services.data.length === 0 ? (
          <p className="text-muted-foreground">No services available at the moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.data.map((service) => (
              <Card key={service.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.price && (
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {formatPrice(service.price.amount, service.price.currency)}
                      </span>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatDuration(service.duration_minutes)}</Badge>
                    {service.max_participants > 1 && (
                      <Badge variant="outline">Up to {service.max_participants} people</Badge>
                    )}
                    {service.requires_confirmation && (
                      <Badge variant="warning">Needs confirmation</Badge>
                    )}
                  </div>
                  <Link
                    href={`/providers/${provider.id}/services/${service.id}`}
                    className="inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Book now
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
