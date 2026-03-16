# Specification Peer Review

**Status:** Open for review
**Opened:** 2026-03-16
**Target:** 2026-04-15

---

## How to review

1. Read the spec documents in order:
   - `protocol.md` — protocol overview, versioning, errors, pagination
   - `entities.md` — entity schemas and behavioral rules
   - `api.md` — endpoint reference
   - `federation.md` — federation protocol
   - `security.md` — security model
   - `extensions.md` — extension mechanism

2. Open a GitHub Discussion with label `RFC` or `spec-review` for questions and feedback

3. For factual errors or ambiguities, open a GitHub Issue with label `spec`

4. For breaking change proposals, open a Discussion first before an Issue

---

## Review checklist

### Protocol
- [ ] Versioning strategy is clear and backward-compatible
- [ ] Error format is unambiguous (RFC 7807 compliance)
- [ ] Pagination is correctly specified
- [ ] Rate limiting headers are consistent with de facto standards

### Entities
- [ ] All entity fields have clear types and constraints
- [ ] Slot generation algorithm is deterministic and implementable
- [ ] Hold mechanism is safe under concurrent load
- [ ] Booking state machine covers all edge cases
- [ ] Timezone handling rules are unambiguous

### API
- [ ] All endpoints have clear authentication requirements
- [ ] All required vs optional parameters are correctly marked
- [ ] Response shapes are consistent across endpoints
- [ ] Error codes map correctly to error conditions

### Federation
- [ ] Discovery flow is implementable without circular dependencies
- [ ] HTTP Signature verification algorithm is correct (RFC 9421 compliance)
- [ ] JSON-LD context is sufficient for interoperability
- [ ] Sync mechanism handles edge cases (first sync, large catalogs, deletions)
- [ ] Trust model protects against abuse

### Security
- [ ] PKCE implementation is correct (RFC 7636 compliance)
- [ ] API key scopes are sufficient for all use cases
- [ ] Webhook HMAC signature verification is correct
- [ ] Data minimization rules are adequate (GDPR alignment)

---

## Known open questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should split-shift schedules (2 windows per day) be supported in v1? | Open |
| 2 | Should federated bookings require a hold first, or can they be created directly? | Open |
| 3 | What is the expected behavior when a provider changes their schedule and existing bookings are affected? | Open |
| 4 | Should the sync endpoint support WebSub (push) in addition to pull? | Deferred to extension |
| 5 | Cancellation policies (deadline, fee) — define in v1 or defer to `obp-pay`? | Open |

---

## Reviewers

| Name | Organization | Status |
|------|-------------|--------|
| (open) | — | Invited |
