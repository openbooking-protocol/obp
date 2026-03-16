# ADR-0005: License under AGPL-3.0

**Date:** 2026-03-16
**Status:** Accepted

---

## Context

OBP aims to be a public good. The license choice determines whether commercial actors can build proprietary forks without contributing back.

## Decision

License all OBP code (server, frontend, SDK, tools) under **GNU Affero General Public License v3.0 (AGPL-3.0)**.

The protocol specification itself is additionally licensed under **CC BY 4.0** to allow implementations in any language without copyleft restriction on the implementer's codebase.

## Rationale

- AGPL requires that anyone who runs a modified version of OBP as a network service must publish their changes — closing the "SaaS loophole" of GPL
- Prevents a large platform from taking OBP, improving it, and not contributing back
- Compatible with NLnet funding requirements (open source)
- The spec under CC BY 4.0 allows third-party implementations without forcing AGPL on their entire codebase

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| MIT / Apache 2.0 | Allows proprietary forks with no obligation to share improvements |
| GPL-3.0 | SaaS loophole — network services can use modified GPL code without releasing changes |
| BSL (Business Source License) | Not OSI-approved; complicates NLnet grant eligibility |
| EUPL-1.2 | Less known; fewer compatible projects in the ecosystem |

## Consequences

### Positive
- Strong copyleft protection for a federated, public-good protocol
- Deters extractive commercial behavior

### Negative / trade-offs
- Some companies avoid AGPL due to legal department conservatism
- SDK under AGPL may reduce adoption; mitigated by the CC BY spec license allowing independent implementations
