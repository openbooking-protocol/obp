/**
 * Seed script — populates the database with sample data for development
 * Run: npm run db:seed
 */
import { getDb, schema } from './index.js';
import { generateId } from '../lib/id.js';
import { hashApiKey } from '../lib/hash.js';
import { generateApiKey } from '../lib/id.js';

async function seed() {
  const db = getDb();
  console.log('Seeding database...');

  // ── Providers ────────────────────────────────────────────────────────────────

  const providerId = generateId();
  await db.insert(schema.providers).values({
    id: providerId,
    name: 'Frizerski salon Nikola',
    slug: 'frizerski-salon-nikola',
    description: 'Profesionalni frizerski salon u centru grada',
    email: 'info@frizernikola.rs',
    phone: '+381 11 123 4567',
    timezone: 'Europe/Belgrade',
    locale: 'sr',
    currency: 'RSD',
    categories: ['hair_salon', 'beauty'],
    address: {
      street: 'Knez Mihailova 10',
      city: 'Beograd',
      country: 'RS',
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // ── Services ──────────────────────────────────────────────────────────────────

  const services = [
    {
      id: generateId(),
      providerId,
      name: 'Muško šišanje',
      category: 'hair_salon',
      durationMinutes: 30,
      price: '1500.00',
      currency: 'RSD',
    },
    {
      id: generateId(),
      providerId,
      name: 'Žensko šišanje',
      category: 'hair_salon',
      durationMinutes: 60,
      price: '2500.00',
      currency: 'RSD',
    },
    {
      id: generateId(),
      providerId,
      name: 'Farbanje',
      category: 'hair_salon',
      durationMinutes: 120,
      price: '5000.00',
      currency: 'RSD',
      requiresConfirmation: true,
    },
  ];

  for (const svc of services) {
    await db.insert(schema.services).values({
      ...svc,
      bufferAfterMinutes: 10,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }

  // ── Schedule ──────────────────────────────────────────────────────────────────

  await db.insert(schema.schedules).values({
    id: generateId(),
    providerId,
    name: 'Radno vreme',
    timezone: 'Europe/Belgrade',
    weeklyRules: [
      { day: 'monday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'tuesday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'wednesday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'thursday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'friday', open: true, slots: [{ start: '09:00', end: '17:00' }] },
      { day: 'saturday', open: true, slots: [{ start: '10:00', end: '14:00' }] },
      { day: 'sunday', open: false, slots: [] },
    ],
    exceptions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // ── API Key ────────────────────────────────────────────────────────────────────

  const { key, prefix } = generateApiKey();
  const keyHash = hashApiKey(key);

  await db.insert(schema.apiKeys).values({
    id: generateId(),
    providerId,
    name: 'Dev API Key',
    keyHash,
    keyPrefix: prefix,
    scopes: ['read', 'write', 'provider', 'webhook', 'admin'],
    isActive: true,
    createdAt: new Date(),
  }).onConflictDoNothing();

  console.log('✓ Seed complete');
  console.log(`  Provider ID: ${providerId}`);
  console.log(`  API Key: ${key}`);
  console.log('  Save the API key — it will not be shown again!');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
