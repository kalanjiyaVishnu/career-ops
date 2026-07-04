# Story Bank — Master STAR+R Stories

This file accumulates your best interview stories over time. Each evaluation (Block F) adds new stories here. Instead of memorizing 100 answers, maintain 5-10 deep stories that you can bend to answer almost any behavioral question.

## How it works

1. Every time `/career-ops offer` generates Block F (Interview Plan), new STAR+R stories get appended here
2. Before your next interview, review this file — your stories are already organized by theme
3. The "Big Three" questions can be answered with stories from this bank:
   - "Tell me about yourself" → combine 2-3 stories into a narrative
   - "Tell me about your most impactful project" → pick your highest-impact story
   - "Tell me about a conflict you resolved" → find a story with a Reflection

## Stories

<!-- Stories will be added here as you evaluate offers -->
<!-- Format:
### [Theme] Story Title
**Source:** Report #NNN — Company — Role
**S (Situation):** ...
**T (Task):** ...
**A (Action):** ...
**R (Result):** ...
**Reflection:** What I learned / what I'd do differently
**Best for questions about:** [list of question types this story answers]
-->

---

### [Data Pipelines] Kafka Event-Streaming Ingestion Pipeline
**Source:** Reports #092/#095/#098 — Hevo Data — SDE-I/II/III
**S (Situation):** Casa Retail AI needed a unified high-throughput event ingestion layer that could pull from diverse sources — Kafka topics, flat files, and databases — without data loss or latency spikes.
**T (Task):** Design and build a pipeline processing millions of events per day at sub-second latency, with schema transformation, batched ingestion, and backfill support.
**A (Action):** Built a batched ingestion engine in Node.js reading from Kafka consumers, file watchers, and DB change-data-capture feeds. Added schema transformation layer, dead-letter queue for malformed records, and backfill jobs for historical data catch-up. Tuned batch sizes and poll intervals to absorb burst traffic without consumer lag.
**R (Result):** Millions of events processed daily at sub-second latency. Zero data loss on backfill runs. Consumer lag stayed <5s under peak load.
**Reflection:** Batching threshold tuning matters more than raw concurrency. Monitor consumer lag first — it's the leading indicator of a bottleneck, not throughput metrics. Always size your design for the backfill case, not just steady state.
**Best for questions about:** "Tell me about a scalable system you built", "Describe a performance problem you solved", "How do you handle high-throughput data?", "Tell me about your Kafka experience"

---

### [SaaS Connectors] Shopify to CRM Data Connector
**Source:** Reports #092/#095/#098 — Hevo Data — SDE-I/II/III
**S (Situation):** The CRM needed real-time customer, catalog, and order data from Shopify merchants to give CRM teams e-commerce conversion visibility.
**T (Task):** Design and build a bidirectional sync connector with proper authentication, rate-limit handling, and idempotent writes.
**A (Action):** Built a Remix/TypeScript app integrating with Shopify GraphQL Admin API. Implemented OAuth OIDC plugin-based login via Keycloak. Set up webhook listeners for real-time updates with idempotency keys to prevent duplicate records. Added exponential backoff with jitter for Shopify rate limit compliance.
**R (Result):** Real-time sync of customer, catalog, and order data into the CRM. CRM teams gained immediate e-commerce conversion visibility. Zero duplicate records post-launch.
**Reflection:** Idempotent writes are the hardest part of connector design — two concurrent webhooks for the same record are the norm, not the exception. Design for it upfront, not as an afterthought. Shopify rate limits need exponential backoff with jitter, not just retry.
**Best for questions about:** "Describe an integration you built", "How do you handle API rate limits?", "Tell me about idempotency in practice", "Describe a SaaS connector you built"

---

### [REST APIs] Multi-tenant Loyalty Engine Under Concurrent Load
**Source:** Reports #095/#098 — Hevo Data — SDE-II/III
**S (Situation):** The loyalty and promotions engine served 100+ concurrent tenants with bill processing, point earn/redeem, cohorts, and campaign execution — and was hitting latency spikes under peak load.
**T (Task):** Design and deliver REST API services that scale reliably under concurrent multi-tenant workloads without per-tenant bottlenecks.
**A (Action):** Implemented Redis-based hot-tenant caching for frequently accessed tenant state. Used ClickHouse for analytics fan-out (append-only, high-throughput). Kept PostgreSQL for transactional writes with row-level tenant isolation. Applied backpressure and connection pooling at the API layer.
**R (Result):** P95 latency <200ms across 100+ concurrent tenants. System stable under load testing. Analytics queries decoupled from transactional path.
**Reflection:** Shared-nothing tenancy at the DB row level breaks down at scale — schema-per-tenant or DB-per-tenant is worth the upfront complexity. Learned to profile before optimizing: the bottleneck was the analytics fan-out, not the transactional path.
**Best for questions about:** "Describe a scalability challenge", "How have you designed multi-tenant systems?", "Tell me about your caching strategy", "Describe a performance optimization"

---

### [Debugging/Reliability] Webhook Deduplication and Ordering Fix
**Source:** Reports #092/#095 — Hevo Data — SDE-I/II
**S (Situation):** The Meta Ads lead ingestion webhook was producing duplicate leads in the CRM due to out-of-order event delivery and retries.
**T (Task):** Fix the duplication bug without downtime and improve overall webhook reliability.
**A (Action):** Added idempotency key handling using the lead ID as the deduplication key. Implemented Redis SET NX with TTL to reject duplicate events within a time window. Added structured logging of raw payloads before any transformation to enable retroactive debugging.
**R (Result):** Zero duplicate leads post-fix. Webhook delivery reliability improved to 99.9%. Logging enabled root-cause diagnosis of three subsequent webhook incidents.
**Reflection:** Always log the raw incoming payload before any transformation — it's the only way to debug retroactively. Idempotency key design should be done before the first line of code, not added later.
**Best for questions about:** "Describe a production bug you fixed", "How do you ensure reliability in event-driven systems?", "Tell me about idempotency", "Describe a debugging challenge"

---

### [Ramp Speed] Onboarding Platform — New Technology Cold Start
**Source:** Report #100 — Neural Earth — Full Stack Engineer (Contract)
**S (Situation):** Casa Retail AI needed a distributed multi-tenant onboarding platform to eliminate manual, engineering-heavy steps for each new merchant. There was no prior Flowable BPM experience on the team.
**T (Task):** Design and build the platform using Flowable BPM (new technology), integrated with Node.js and React, and ship it to production without significant hand-holding.
**A (Action):** Ramped into Flowable BPM independently, asked targeted clarifying questions in week one to surface ambiguities early, designed distributed multi-tenant flows, integrated with the React front-end, and documented every service for async team use.
**R (Result):** 90% reduction in onboarding effort. Platform live and handling new tenants autonomously. Documentation still referenced by the team.
**Reflection:** Ask the right clarifying questions in week one — ambiguity at the start is the most expensive kind of technical debt. Document as you go, not after you ship.
**Best for questions about:** "How quickly do you ramp into new technologies?", "Tell me about a project where you had to learn on the job", "Describe a time you delivered with tight constraints"

---

### [Collaboration] Async-First Engineering — Design-to-Code Handoff
**Source:** Report #100 — Neural Earth — Full Stack Engineer (Contract)
**S (Situation):** Invoice builder required close collaboration between product design and backend schema owners in an async remote environment, with no dedicated design engineer or project manager.
**T (Task):** Translate product design mockups into a functional, schema-validated React application without losing design intent or creating backend mismatches.
**A (Action):** Established a schema contract upfront using Zod between front-end form validation and back-end persistence. Documented design decisions and constraint tradeoffs in shared async channels before building, not after. Surfaced conflicts at the spec stage, not at code review.
**R (Result):** Zero design-to-code rework cycles. Backend and frontend shipped compatible schemas on first integration. Product team cited "no ambiguity lost" as a key outcome.
**Reflection:** Async clarity requires over-documentation of decisions — write the decision AND the reason. The cost of a clarifying async message is far less than a rework cycle.
**Best for questions about:** "How do you work in a remote-first team?", "Tell me about working with designers", "Describe a successful cross-functional collaboration"

---

### [Ownership] Invoice Builder — End-to-End Feature Ownership
**Source:** Reports #095/#098 — Hevo Data — SDE-II/III
**S (Situation):** The business needed a self-serve invoice configuration tool to replace a manual, engineering-dependent process that was slowing down merchant onboarding.
**T (Task):** Own the invoice/e-bill builder from spec to deployment — solo delivery of a React drag-and-drop builder with schema-based validation and a reusable component library.
**A (Action):** Designed the data schema first using Zod for type-safe validation at the form boundary. Built drag-and-drop React builder with react-hook-form. Extracted 30+ reusable components into a Storybook-documented library, bundled with Rollup.
**R (Result):** Cut invoice-configuration effort by 70%. Raised frontend development velocity 40%. Component reuse increased 60% across the product.
**Reflection:** Zod schema-first design saves debugging time at every later stage — define the shape before the UI. Component extraction pays off when you build the library WITH the feature, not after.
**Best for questions about:** "Tell me about end-to-end ownership", "Describe a project you owned solo", "How do you build reusable components?", "Tell me about your frontend architecture decisions"

---

### [Workflow Automation] Flowable BPM Onboarding Platform
**Source:** Report #101 — ProNexus — Software Engineer
**S (Situation):** Casa Retail AI needed to onboard dozens of retail enterprise tenants with complex, multi-step configuration workflows. The manual process required engineering involvement at every step and was a major onboarding bottleneck.
**T (Task):** Design and build a configurable, automated workflow orchestration engine that could model branching business processes with human-task steps, making onboarding self-serve and auditable.
**A (Action):** Built a distributed multi-tenant onboarding platform using Flowable BPM for workflow orchestration, Node.js for execution logic, and React for the configuration UI. Modeled each tenant onboarding journey as a BPMN business process with conditional branches, timer-based escalations, and human-task assignment steps. Integrated with the existing PostgreSQL/Redis tenant data layer for process state persistence.
**R (Result):** Cut onboarding effort by 90%. Teams went from days-long manual setup to near-automated, auditable provisioning. The system handled conditional branching across 15+ workflow configurations without custom code per tenant.
**Reflection:** Flowable's BPMN model forces explicit design of failure paths — every human task needs a timeout and escalation route. That discipline paid off when a tenant's approval step stalled; the process recovered automatically via the configured escalation. Design for failure paths first, not last.
**Best for questions about:** "Tell me about a workflow automation system you built", "Describe your experience with BPM tools", "How have you implemented human-in-the-loop systems?", "Describe a process automation problem you solved", "Tell me about a project that reduced manual effort"

---

### [Code Quality] Full-Stack AI Code Review Simulation
**Source:** Report #103 — Mindrift — Full-Stack Web App Developer (Freelance)
**S (Situation):** When building the Shopify embedded app at Casa Retail AI, used Shopify's AI-generated code examples from their documentation as starting points for the GraphQL Admin API integration.
**T (Task):** Validate, adapt, and harden auto-generated code for production use with proper error handling, type safety, and rate-limit compliance.
**A (Action):** Reviewed generated code against the GraphQL Admin API schema, added TypeScript type guards, replaced implicit any, added exponential backoff with jitter for rate limits, and wrote Jest tests for edge cases including webhook retries and out-of-order delivery.
**R (Result):** Production-stable Shopify integration with zero post-launch API errors. Code passed code review on first pass with no rework cycles.
**Reflection:** AI-generated code is often syntactically correct but semantically brittle — it passes linting but fails on edge cases that require domain knowledge to anticipate. The gap between "runs in a demo" and "runs in production at 2am during a sale event" is exactly where human judgment adds irreplaceable value.
**Best for questions about:** "How do you evaluate AI-generated code?", "Describe a code review you led", "How do you ensure code quality?", "Tell me about hardening third-party or generated code"

---

### [Data Pipelines] Event Pipeline Schema Validation and Dead-Letter Queue
**Source:** Report #103 — Mindrift — Full-Stack Web App Developer (Freelance)
**S (Situation):** The Kafka event ingestion pipeline at Casa Retail AI received events from multiple upstream producers with inconsistent and sometimes malformed schemas — causing silent data corruption downstream.
**T (Task):** Build a schema validation and transformation layer that caught malformed events without blocking the pipeline or dropping data.
**A (Action):** Implemented a dead-letter queue pattern in Node.js: events failing schema validation were routed to a DLQ with full structured error context (event payload, schema version, failure reason, timestamp), allowing downstream consumers to process clean events while ops could investigate and replay failures asynchronously.
**R (Result):** Zero pipeline blocking on schema errors post-deployment. DLQ enabled retroactive root-cause diagnosis of three subsequent upstream schema regressions, all resolved without data loss.
**Reflection:** Defensive schema design — validate at ingestion, not at consumption — is the difference between a pipeline that fails loudly and one that silently corrupts data for days. The DLQ isn't just a safety net; it's a debugging instrument.
**Best for questions about:** "How do you handle bad data in pipelines?", "Describe a defensive coding pattern you used", "Tell me about error handling at scale", "How do you build reliable event-driven systems?"

---

### [Workflow Automation] Multi-tenant Onboarding Platform — 90% Effort Reduction
**Source:** Report #099 — Supermove — Software Engineer, Full-Stack
**S (Situation):** Onboarding each new tenant at Casa Retail AI required manual engineering work to configure the CRM instance — schemas, workflows, loyalty rules — taking days per customer and creating a bottleneck as the business scaled.
**T (Task):** Design and ship a self-serve distributed onboarding platform that could be operated by non-engineers, eliminating the engineering dependency on each new customer.
**A (Action):** Built a Node.js + Flowable BPM workflow orchestration layer with dynamic configuration forms in React. Each workflow step validated against a Zod schema and persisted tenant state to PostgreSQL with per-tenant row-level isolation. Added audit logging for every configuration change and real-time state dashboards for visibility.
**R (Result):** Reduced onboarding engineering effort by 90%. Non-engineers could onboard new tenants in hours instead of days. Removed a key scaling bottleneck as the business grew its customer base.
**Reflection:** BPM engines (Flowable, Camunda) add powerful workflow visualization but come with operational overhead. For simpler flows, a state machine table in PostgreSQL would have been lighter. Pick the tool to the workflow complexity, not to the most powerful option available.
**Best for questions about:** "Tell me about a system you built that scaled the business", "How do you approach workflow automation?", "Tell me about end-to-end feature ownership", "Tell me about a project with measurable business impact", "How do you build generalized systems?"
