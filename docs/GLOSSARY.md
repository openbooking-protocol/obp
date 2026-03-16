# Glossary — OpenBooking Protocol

Alphabetical reference of terms used across the OBP specification, codebase, and documentation.

---

## A

**API Key**
A secret token used to authenticate provider management requests. Scoped to specific operations (read, write, admin). Distinct from OAuth2 bearer tokens used for end-user flows.

**Availability window**
The date/time range within which slots are generated for a service, based on the provider's schedule.

## B

**Booking**
A confirmed reservation by a customer for a specific slot. Has a lifecycle: `pending → confirmed → completed | cancelled | no_show`.

**Booking flow**
The sequence: discover service → list slots → hold slot → create booking → confirm booking.

## C

**CalDAV**
A protocol (RFC 4791) for calendar data over HTTP. OBP can export/import iCal feeds for CalDAV compatibility.

**Cancellation policy**
Rules defined by a provider governing whether and when a booking can be cancelled, and any associated penalties.

**Customer**
An end user who books a service. In the OBP data model, stored as embedded fields on a Booking (name, email, phone), not as a first-class entity in v1.

## D

**Discovery**
The process by which an OBP client or peer server locates an OBP server and its capabilities. Uses `.well-known/obp` and optionally WebFinger.

**Drizzle ORM**
The query builder and ORM used in the reference server implementation for type-safe PostgreSQL queries.

## F

**Federation**
The ability of two independent OBP servers to discover each other, search each other's catalogs, and create bookings on behalf of their respective users — without a shared central authority.

**Federated booking**
A booking created on Server B by a user whose home server is Server A. Server A acts as a proxy, signing the request with its private key.

## H

**Hold**
A temporary reservation of a slot, backed by a Redis key with a TTL (default: 10 minutes). Prevents double-booking while a customer completes the booking form. Automatically expires if no booking is created.

**HTTP Signature**
A request signing mechanism (RFC 9421) used for server-to-server federation. Each OBP server holds an Ed25519 key pair and signs all outbound federation requests.

## I

**iCal / iCalendar**
A standard format (RFC 5545) for calendar data. OBP can export bookings as `.ics` files and import external calendars for conflict detection.

**Inbox/Outbox**
An ActivityPub-inspired pattern used in OBP federation. Each server maintains an outbox of activities sent to peers, and an inbox of received activities, enabling async processing and retry.

## J

**JSON-LD**
A JSON-based format for Linked Data. OBP federation messages use JSON-LD context for semantic interoperability.

**JWT (JSON Web Token)**
Used for OAuth2 access tokens issued by the OBP authorization server.

## N

**No-show**
A booking outcome where the customer did not appear. Transition: `confirmed → no_show`. Providers can record this for analytics and future policy enforcement.

## O

**OBP**
OpenBooking Protocol. The name of this project and its specification.

**Optimistic locking**
A concurrency control technique used during booking creation. The booking is created only if the slot's version has not changed since it was read, preventing race conditions.

## P

**Peer**
Another OBP server registered as a federation partner. Peers exchange public keys and can route bookings to each other.

**PKCE (Proof Key for Code Exchange)**
An OAuth2 extension (RFC 7636) that prevents authorization code interception attacks. Required for all OBP OAuth2 flows.

**Provider**
A business or individual that offers bookable services (e.g., a hair salon, a medical clinic, a sports facility). Providers register with an OBP server and manage their services, schedules, and bookings.

## R

**RBAC (Role-Based Access Control)**
Access control model used in the reference server. Roles: `admin`, `provider`, `staff`.

**Resource**
A physical or virtual entity required to deliver a service (e.g., a treatment room, a staff member, a tennis court). A service can require one or more resources, and a slot is generated only when all required resources are available.

**RFC 7807**
"Problem Details for HTTP APIs" — the error format used by OBP. All error responses include `type`, `title`, `status`, `detail`, and optionally `instance`.

## S

**Schedule**
A set of recurring rules and exceptions that define when a provider (or a specific resource) is available. Used to generate slots automatically.

**Seed**
A script (`npm run db:seed`) that populates the database with example data for development and testing.

**Service**
A specific offering by a provider (e.g., "30-min haircut", "1-hour tennis court"). Has a duration, price, category, and a list of required resources.

**Slot**
A specific available time window for a service. Generated from the provider's schedule. Can be `available`, `held`, or `booked`.

**Standalone output**
Next.js build mode that produces a self-contained Node.js server, used for the production Docker image.

## W

**WebFinger**
A protocol (RFC 7033) for discovering information about resources (e.g., servers) using well-known URIs. Used optionally in OBP federation discovery.

**Webhook**
An HTTP callback registered by a provider or third-party client to receive real-time event notifications (e.g., `booking.created`, `booking.cancelled`). Payloads are signed with HMAC-SHA256.

**Well-known**
`/.well-known/obp` — the discovery endpoint for an OBP server. Returns the server's capabilities, public key, and federation endpoints.
