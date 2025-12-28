# Architecture: targz.shop

High-level architecture and design decisions for the self-hosted art shop.

---

## Overview

A serverless e-commerce site for selling unique pen plotter artworks. Static frontend with Stripe Checkout for payments, no database, no server maintenance.

```
                    ┌─────────────────────┐
                    │   Decap CMS Admin   │
                    │  (targz.shop/admin) │
                    └──────────┬──────────┘
                               │ commits
                               ▼
                    ┌─────────────────────┐
                    │   GitHub (content)  │
                    └──────────┬──────────┘
                               │ triggers build
                               ▼
                    ┌─────────────────────┐
                    │      Netlify        │
                    │  (hosting + funcs)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │     Stripe      │──────────────│     Resend      │
    │   (payments)    │   webhook    │    (emails)     │
    └─────────────────┘              └─────────────────┘
```

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Astro + Tailwind CSS | Static site generator with markdown support, image optimization |
| Hosting | Netlify | Free static hosting + serverless functions |
| Payments | Stripe Checkout | Hosted payment page, Apple/Google Pay, no PCI compliance |
| CMS | Decap CMS + Git | Visual editor at `/admin`, commits to GitHub, no external service |
| Email | Resend | Transactional emails, free tier sufficient |

---

## Key Decisions

### 1. Content Management: Decap CMS + Git

**Decision:** Use Decap CMS (formerly Netlify CMS) as visual editor, storing content as markdown files in Git.

**How it works:**
- Admin panel at `targz.shop/admin`
- Visual form editor (no markdown knowledge needed)
- Saves = commits to GitHub
- Netlify Identity for authentication (just you)

**Rationale:**
- No external CMS service to pay for or maintain
- User-friendly interface for adding/editing artworks
- Full version history via Git
- Can still edit markdown directly if preferred

### 2. Stripe Integration: On-the-fly Product Data

**Decision:** Send product details (title, price, image) to Stripe at checkout time, rather than pre-creating products in Stripe Dashboard.

**Rationale:**
- Adding new artwork = just add markdown file, no Stripe setup
- Price changes = edit markdown only, single source of truth
- No synchronization needed between Stripe and content files

**Trade-off:** Cannot use Stripe's built-in inventory management. Sold status tracked in markdown instead.

### 3. Inventory Management: Markdown Status Field

**Decision:** Track sold/available status in markdown files, updated by webhook after successful payment.

**Flow:**
1. Customer pays → Stripe webhook fires
2. Webhook commits `status: sold` to GitHub
3. Netlify rebuilds site (~1-2 min)
4. Artwork displays as sold

**Trade-off:** Small race condition window for simultaneous purchases. Acceptable for low-traffic art shop.

### 4. Cart: Client-side (Phase 2)

**Decision:** If cart is needed, implement in browser localStorage.

**Phase 1 (MVP):** Single item "Buy Now" checkout only.

**Phase 2:** Add to cart functionality for prints/editions.

**Rationale:** No backend needed, simple implementation, sufficient for unique artworks.

### 5. Payment Flow: Stripe Hosted Checkout

**Decision:** Redirect to Stripe's hosted checkout page rather than embedded or custom forms.

**Rationale:**
- Apple Pay / Google Pay automatic
- No PCI compliance burden
- Stripe handles all sensitive data
- Shipping address collection built-in

---

## Cost Structure

| Item | Cost |
|------|------|
| Domain | ~€12/year |
| Hosting (Netlify) | Free |
| Functions (Netlify) | Free |
| Emails (Resend) | Free |
| Stripe fees | 1.5% + €0.25 per EU transaction |
| **Total fixed** | **~€12/year** |

---

## What This Architecture Does NOT Include

- Database (not needed)
- Server/VPS (serverless only)
- Pre-created Stripe products (on-the-fly instead)
- External CMS service (Git-based instead)
- Real-time inventory locking (acceptable trade-off)
- Shopping cart (Phase 1 is single-item only)

---

## Open Questions

- [ ] Bilingual support (FR/EN) - defer to Phase 2?
- [ ] Shipping cost calculation - flat rate vs. weight-based?
- [ ] Print/edition support - same system or separate?

---

## Next Steps

1. Validate this architecture
2. Create implementation plan
3. Initialize Astro project
4. Build MVP
