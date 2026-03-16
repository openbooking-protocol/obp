import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { obpApi } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { BookingFlow } from "@/components/booking/booking-flow";
import { formatDuration, formatPrice } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string; serviceId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { serviceId } = await params;
  try {
    const service = await obpApi.services.get(serviceId);
    return { title: `Book ${service.name}` };
  } catch {
    return { title: "Book service" };
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id: providerId, serviceId } = await params;

  let provider, service;
  try {
    [provider, service] = await Promise.all([
      obpApi.providers.get(providerId),
      obpApi.services.get(serviceId),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-foreground">Search</Link>
        <span>/</span>
        <Link href={`/providers/${providerId}`} className="hover:text-foreground">{provider.name}</Link>
        <span>/</span>
        <span className="text-foreground">{service.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Service info */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <h1 className="mb-2 text-2xl font-bold">{service.name}</h1>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">by</span>
              <Link href={`/providers/${providerId}`} className="text-sm font-medium hover:underline">
                {provider.name}
              </Link>
            </div>

            <p className="mb-4 text-muted-foreground">{service.description}</p>

            <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(service.duration_minutes)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-medium">
                  {service.price
                    ? formatPrice(service.price.amount, service.price.currency)
                    : "Free"}
                </p>
              </div>
              {service.max_participants > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground">Group size</p>
                  <p className="font-medium">Up to {service.max_participants}</p>
                </div>
              )}
            </div>

            {service.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            {service.cancellation_policy && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Cancellation policy</p>
                <p className="mt-1 text-muted-foreground">
                  Free cancellation up to {service.cancellation_policy.deadline_hours} hours before the appointment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Booking flow */}
        <div className="lg:col-span-2">
          <BookingFlow service={service} provider={provider} />
        </div>
      </div>
    </div>
  );
}
