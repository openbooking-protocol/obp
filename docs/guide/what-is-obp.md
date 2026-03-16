# What is OpenBooking Protocol?

OpenBooking Protocol (OBP) is an open, federated protocol for scheduling and booking services across the web.

## The Problem

Today, booking systems are fragmented and centralized. Every platform — Booking.com, Calendly, Fresha — runs its own silo. Service providers are locked in, customers can't discover services across platforms, and developers have to integrate with dozens of proprietary APIs.

## The Solution

OBP defines a standard HTTP API that any server can implement. Servers can:

- **Advertise** their services and availability
- **Accept bookings** from any OBP-compatible client
- **Federate** with other OBP servers to enable cross-server discovery and booking

Think of it like email or ActivityPub: anyone can run a server, and all servers can talk to each other.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Provider** | A business or individual offering bookable services |
| **Service** | A specific offering (e.g., "30-min haircut", "Tennis court 1h") |
| **Resource** | A physical or virtual resource tied to a service (e.g., a room, a staff member) |
| **Slot** | A specific available time window for a service |
| **Booking** | A confirmed reservation of a slot by a customer |
| **Schedule** | Rules defining when a provider is available (recurring + exceptions) |

## Federation

OBP servers discover each other via `.well-known/obp` and WebFinger. Once discovered, servers can:

- Search each other's services
- Query each other's availability
- Create and cancel bookings on behalf of their users

All cross-server requests are authenticated with HTTP Signatures.
