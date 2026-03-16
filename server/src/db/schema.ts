import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  numeric,
  smallint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const providerStatusEnum = pgEnum('provider_status', [
  'active',
  'inactive',
  'suspended',
  'pending',
]);

export const serviceStatusEnum = pgEnum('service_status', ['active', 'inactive', 'draft']);

export const slotStatusEnum = pgEnum('slot_status', [
  'available',
  'held',
  'booked',
  'blocked',
  'cancelled',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);

export const webhookStatusEnum = pgEnum('webhook_status', ['active', 'inactive']);

export const apiKeyScopeEnum = pgEnum('api_key_scope', [
  'read',
  'write',
  'admin',
  'provider',
  'webhook',
]);

export const federationPeerStatusEnum = pgEnum('federation_peer_status', [
  'active',
  'inactive',
  'blocked',
  'pending',
]);

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

// ─── Providers ───────────────────────────────────────────────────────────────

export const providers = pgTable(
  'providers',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    website: varchar('website', { length: 2048 }),
    logoUrl: varchar('logo_url', { length: 2048 }),
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
    locale: varchar('locale', { length: 10 }).notNull().default('en'),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    address: jsonb('address'),
    categories: jsonb('categories').$type<string[]>().notNull().default([]),
    status: providerStatusEnum('status').notNull().default('active'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('providers_slug_idx').on(t.slug),
    statusIdx: index('providers_status_idx').on(t.status),
    emailIdx: index('providers_email_idx').on(t.email),
  }),
);

// ─── Services ─────────────────────────────────────────────────────────────────

export const services = pgTable(
  'services',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    bufferBeforeMinutes: integer('buffer_before_minutes').notNull().default(0),
    bufferAfterMinutes: integer('buffer_after_minutes').notNull().default(0),
    price: numeric('price', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }),
    maxCapacity: integer('max_capacity').notNull().default(1),
    requiresConfirmation: boolean('requires_confirmation').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    status: serviceStatusEnum('status').notNull().default('active'),
    imageUrl: varchar('image_url', { length: 2048 }),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    metadata: jsonb('metadata'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index('services_provider_idx').on(t.providerId),
    categoryIdx: index('services_category_idx').on(t.category),
    statusIdx: index('services_status_idx').on(t.status),
    providerStatusIdx: index('services_provider_status_idx').on(t.providerId, t.status),
  }),
);

// ─── Resources ────────────────────────────────────────────────────────────────

export const resources = pgTable(
  'resources',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 100 }).notNull(),
    capacity: integer('capacity').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index('resources_provider_idx').on(t.providerId),
  }),
);

// Resource ↔ Service many-to-many
export const resourceServices = pgTable(
  'resource_services',
  {
    resourceId: varchar('resource_id', { length: 26 })
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: uniqueIndex('resource_services_pk').on(t.resourceId, t.serviceId),
  }),
);

// ─── Schedules ────────────────────────────────────────────────────────────────

export const schedules = pgTable(
  'schedules',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    serviceId: varchar('service_id', { length: 26 }).references(() => services.id, {
      onDelete: 'cascade',
    }),
    resourceId: varchar('resource_id', { length: 26 }).references(() => resources.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 255 }).notNull().default('Default'),
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
    // Weekly recurring rules stored as JSON array of day rules
    weeklyRules: jsonb('weekly_rules')
      .$type<WeeklyRule[]>()
      .notNull()
      .default([]),
    // Date-specific exceptions
    exceptions: jsonb('exceptions').$type<ScheduleException[]>().notNull().default([]),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index('schedules_provider_idx').on(t.providerId),
    serviceIdx: index('schedules_service_idx').on(t.serviceId),
  }),
);

export interface WeeklyRule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: boolean;
  slots: Array<{ start: string; end: string }>; // "HH:mm" format
}

export interface ScheduleException {
  date: string; // "YYYY-MM-DD"
  open: boolean;
  slots?: Array<{ start: string; end: string }>;
  reason?: string;
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export const slots = pgTable(
  'slots',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    resourceId: varchar('resource_id', { length: 26 }).references(() => resources.id, {
      onDelete: 'set null',
    }),
    scheduleId: varchar('schedule_id', { length: 26 }).references(() => schedules.id, {
      onDelete: 'set null',
    }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: slotStatusEnum('status').notNull().default('available'),
    capacity: integer('capacity').notNull().default(1),
    bookedCount: integer('booked_count').notNull().default(0),
    heldUntil: timestamp('held_until', { withTimezone: true }),
    heldBy: varchar('held_by', { length: 255 }),
    bookingId: varchar('booking_id', { length: 26 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerTimeIdx: index('slots_provider_time_idx').on(t.providerId, t.startTime),
    serviceTimeIdx: index('slots_service_time_idx').on(t.serviceId, t.startTime),
    statusIdx: index('slots_status_idx').on(t.status),
    startTimeIdx: index('slots_start_time_idx').on(t.startTime),
    availabilityIdx: index('slots_availability_idx').on(t.serviceId, t.status, t.startTime),
  }),
);

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = pgTable(
  'bookings',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id),
    serviceId: varchar('service_id', { length: 26 })
      .notNull()
      .references(() => services.id),
    slotId: varchar('slot_id', { length: 26 })
      .notNull()
      .references(() => slots.id),
    resourceId: varchar('resource_id', { length: 26 }).references(() => resources.id),
    // Customer info
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }),
    // Booking state
    status: bookingStatusEnum('status').notNull().default('pending'),
    // Optimistic locking
    version: integer('version').notNull().default(1),
    // Federation
    federatedFrom: varchar('federated_from', { length: 2048 }),
    federatedBookingId: varchar('federated_booking_id', { length: 26 }),
    // Timestamps
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index('bookings_provider_idx').on(t.providerId),
    serviceIdx: index('bookings_service_idx').on(t.serviceId),
    slotIdx: index('bookings_slot_idx').on(t.slotId),
    statusIdx: index('bookings_status_idx').on(t.status),
    customerEmailIdx: index('bookings_customer_email_idx').on(t.customerEmail),
    createdAtIdx: index('bookings_created_at_idx').on(t.createdAt),
  }),
);

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export const webhooks = pgTable(
  'webhooks',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 })
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 2048 }).notNull(),
    secret: varchar('secret', { length: 255 }).notNull(),
    events: jsonb('events').$type<string[]>().notNull().default([]),
    status: webhookStatusEnum('status').notNull().default('active'),
    description: text('description'),
    failureCount: integer('failure_count').notNull().default(0),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index('webhooks_provider_idx').on(t.providerId),
    statusIdx: index('webhooks_status_idx').on(t.status),
  }),
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    webhookId: varchar('webhook_id', { length: 26 })
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    event: varchar('event', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    responseStatus: smallint('response_status'),
    responseBody: text('response_body'),
    attempt: integer('attempt').notNull().default(1),
    success: boolean('success').notNull().default(false),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    webhookIdx: index('webhook_deliveries_webhook_idx').on(t.webhookId),
    createdAtIdx: index('webhook_deliveries_created_at_idx').on(t.createdAt),
  }),
);

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  'api_keys',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 }).references(() => providers.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    keyHash: varchar('key_hash', { length: 255 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyHashIdx: uniqueIndex('api_keys_hash_idx').on(t.keyHash),
    providerIdx: index('api_keys_provider_idx').on(t.providerId),
    prefixIdx: index('api_keys_prefix_idx').on(t.keyPrefix),
  }),
);

// ─── OAuth2 ───────────────────────────────────────────────────────────────────

export const oauth2Clients = pgTable(
  'oauth2_clients',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    providerId: varchar('provider_id', { length: 26 }).references(() => providers.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    clientId: varchar('client_id', { length: 100 }).notNull(),
    clientSecretHash: varchar('client_secret_hash', { length: 255 }),
    redirectUris: jsonb('redirect_uris').$type<string[]>().notNull().default([]),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    clientIdIdx: uniqueIndex('oauth2_clients_client_id_idx').on(t.clientId),
  }),
);

export const oauth2AuthCodes = pgTable(
  'oauth2_auth_codes',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    clientId: varchar('client_id', { length: 26 })
      .notNull()
      .references(() => oauth2Clients.id, { onDelete: 'cascade' }),
    providerId: varchar('provider_id', { length: 26 }).references(() => providers.id, {
      onDelete: 'cascade',
    }),
    code: varchar('code', { length: 255 }).notNull(),
    codeChallenge: varchar('code_challenge', { length: 255 }),
    codeChallengeMethod: varchar('code_challenge_method', { length: 10 }),
    redirectUri: varchar('redirect_uri', { length: 2048 }),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    used: boolean('used').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('oauth2_auth_codes_code_idx').on(t.code),
  }),
);

export const oauth2Tokens = pgTable(
  'oauth2_tokens',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    clientId: varchar('client_id', { length: 26 })
      .notNull()
      .references(() => oauth2Clients.id, { onDelete: 'cascade' }),
    providerId: varchar('provider_id', { length: 26 }).references(() => providers.id, {
      onDelete: 'cascade',
    }),
    accessToken: varchar('access_token', { length: 512 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 512 }),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }).notNull(),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    revoked: boolean('revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    accessTokenIdx: uniqueIndex('oauth2_tokens_access_idx').on(t.accessToken),
    refreshTokenIdx: index('oauth2_tokens_refresh_idx').on(t.refreshToken),
  }),
);

// ─── Federation peers ─────────────────────────────────────────────────────────

export const federationPeers = pgTable(
  'federation_peers',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    serverUrl: varchar('server_url', { length: 2048 }).notNull(),
    serverName: varchar('server_name', { length: 255 }),
    publicKey: text('public_key').notNull(),
    publicKeyId: varchar('public_key_id', { length: 2048 }).notNull(),
    status: federationPeerStatusEnum('status').notNull().default('pending'),
    trustLevel: smallint('trust_level').notNull().default(1),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    serverUrlIdx: uniqueIndex('federation_peers_url_idx').on(t.serverUrl),
    statusIdx: index('federation_peers_status_idx').on(t.status),
  }),
);

// ─── Federation activities (inbox/outbox) ─────────────────────────────────────

export const activityDirectionEnum = pgEnum('activity_direction', ['inbox', 'outbox']);
export const activityStatusEnum = pgEnum('activity_status', ['pending', 'processed', 'failed']);

export const federationActivities = pgTable(
  'federation_activities',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    direction: activityDirectionEnum('direction').notNull(),
    activityType: varchar('activity_type', { length: 100 }).notNull(),
    peerId: varchar('peer_id', { length: 26 }),
    actorUrl: varchar('actor_url', { length: 2048 }),
    objectId: varchar('object_id', { length: 2048 }),
    payload: jsonb('payload').notNull(),
    status: activityStatusEnum('status').notNull().default('pending'),
    error: text('error'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    directionIdx: index('federation_activities_direction_idx').on(t.direction),
    peerIdx: index('federation_activities_peer_idx').on(t.peerId),
    createdAtIdx: index('federation_activities_created_at_idx').on(t.createdAt),
    statusIdx: index('federation_activities_status_idx').on(t.status),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const providersRelations = relations(providers, ({ many }) => ({
  services: many(services),
  resources: many(resources),
  schedules: many(schedules),
  slots: many(slots),
  bookings: many(bookings),
  webhooks: many(webhooks),
  apiKeys: many(apiKeys),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  provider: one(providers, { fields: [services.providerId], references: [providers.id] }),
  slots: many(slots),
  bookings: many(bookings),
  resourceServices: many(resourceServices),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  provider: one(providers, { fields: [resources.providerId], references: [providers.id] }),
  resourceServices: many(resourceServices),
  slots: many(slots),
  bookings: many(bookings),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  provider: one(providers, { fields: [schedules.providerId], references: [providers.id] }),
  service: one(services, { fields: [schedules.serviceId], references: [services.id] }),
  resource: one(resources, { fields: [schedules.resourceId], references: [resources.id] }),
}));

export const slotsRelations = relations(slots, ({ one }) => ({
  provider: one(providers, { fields: [slots.providerId], references: [providers.id] }),
  service: one(services, { fields: [slots.serviceId], references: [services.id] }),
  resource: one(resources, { fields: [slots.resourceId], references: [resources.id] }),
  schedule: one(schedules, { fields: [slots.scheduleId], references: [schedules.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  provider: one(providers, { fields: [bookings.providerId], references: [providers.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  resource: one(resources, { fields: [bookings.resourceId], references: [resources.id] }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  provider: one(providers, { fields: [webhooks.providerId], references: [providers.id] }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, { fields: [webhookDeliveries.webhookId], references: [webhooks.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  provider: one(providers, { fields: [apiKeys.providerId], references: [providers.id] }),
}));

export const resourceServicesRelations = relations(resourceServices, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceServices.resourceId],
    references: [resources.id],
  }),
  service: one(services, {
    fields: [resourceServices.serviceId],
    references: [services.id],
  }),
}));
