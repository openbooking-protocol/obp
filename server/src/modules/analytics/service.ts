import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';

export interface AnalyticsSummary {
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    pending: number;
    noShow: number;
    conversionRate: number;
  };
  slots: {
    total: number;
    available: number;
    booked: number;
    utilization: number;
  };
  topServices: Array<{ serviceId: string; serviceName: string; bookingCount: number }>;
  revenueEstimate: number;
}

export async function getProviderAnalytics(
  providerId: string,
  from?: Date,
  to?: Date,
): Promise<AnalyticsSummary> {
  const db = getDb();
  const now = to ?? new Date();
  const rangeStart = from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const bookingConditions = [
    eq(schema.bookings.providerId, providerId),
    gte(schema.bookings.createdAt, rangeStart),
    lte(schema.bookings.createdAt, now),
  ];

  // Booking counts by status
  const bookingCounts = await db
    .select({
      status: schema.bookings.status,
      count: count(),
    })
    .from(schema.bookings)
    .where(and(...bookingConditions))
    .groupBy(schema.bookings.status);

  const bookingMap: Record<string, number> = {};
  let totalBookings = 0;
  for (const row of bookingCounts) {
    bookingMap[row.status] = row.count;
    totalBookings += row.count;
  }

  const confirmed = bookingMap['confirmed'] ?? 0;
  const cancelled = bookingMap['cancelled'] ?? 0;
  const completed = bookingMap['completed'] ?? 0;
  const pending = bookingMap['pending'] ?? 0;
  const noShow = bookingMap['no_show'] ?? 0;
  const conversionRate = totalBookings > 0
    ? Math.round(((confirmed + completed) / totalBookings) * 100) / 100
    : 0;

  // Slot utilization
  const slotCounts = await db
    .select({
      status: schema.slots.status,
      count: count(),
    })
    .from(schema.slots)
    .where(
      and(
        eq(schema.slots.providerId, providerId),
        gte(schema.slots.startTime, rangeStart),
        lte(schema.slots.startTime, now),
      ),
    )
    .groupBy(schema.slots.status);

  const slotMap: Record<string, number> = {};
  let totalSlots = 0;
  for (const row of slotCounts) {
    slotMap[row.status] = row.count;
    totalSlots += row.count;
  }

  const bookedSlots = slotMap['booked'] ?? 0;
  const utilization = totalSlots > 0
    ? Math.round((bookedSlots / totalSlots) * 100) / 100
    : 0;

  // Top services
  const topServicesRows = await db
    .select({
      serviceId: schema.bookings.serviceId,
      serviceName: schema.services.name,
      bookingCount: count(),
    })
    .from(schema.bookings)
    .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
    .where(and(...bookingConditions))
    .groupBy(schema.bookings.serviceId, schema.services.name)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  // Revenue estimate (sum of service prices × confirmed+completed bookings)
  const revenueRows = await db
    .select({
      price: schema.services.price,
      bookingCount: count(),
    })
    .from(schema.bookings)
    .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
    .where(
      and(
        ...bookingConditions,
        sql`${schema.bookings.status} IN ('confirmed', 'completed')`,
      ),
    )
    .groupBy(schema.services.price);

  let revenueEstimate = 0;
  for (const row of revenueRows) {
    if (row.price) {
      revenueEstimate += parseFloat(row.price) * row.bookingCount;
    }
  }

  return {
    bookings: {
      total: totalBookings,
      confirmed,
      cancelled,
      completed,
      pending,
      noShow,
      conversionRate,
    },
    slots: {
      total: totalSlots,
      available: slotMap['available'] ?? 0,
      booked: bookedSlots,
      utilization,
    },
    topServices: topServicesRows.map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName ?? r.serviceId,
      bookingCount: r.bookingCount,
    })),
    revenueEstimate: Math.round(revenueEstimate * 100) / 100,
  };
}

export async function getServerStats() {
  const db = getDb();

  const [
    providerCount,
    serviceCount,
    bookingCount,
    slotCount,
    federationPeerCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(schema.providers),
    db.select({ count: count() }).from(schema.services),
    db.select({ count: count() }).from(schema.bookings),
    db.select({ count: count() }).from(schema.slots),
    db.select({ count: count() }).from(schema.federationPeers),
  ]);

  const activeBookings = await db
    .select({ count: count() })
    .from(schema.bookings)
    .where(sql`${schema.bookings.status} IN ('pending', 'confirmed')`);

  return {
    providers: providerCount[0]?.count ?? 0,
    services: serviceCount[0]?.count ?? 0,
    bookings: {
      total: bookingCount[0]?.count ?? 0,
      active: activeBookings[0]?.count ?? 0,
    },
    slots: slotCount[0]?.count ?? 0,
    federationPeers: federationPeerCount[0]?.count ?? 0,
    uptime: process.uptime(),
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  };
}
