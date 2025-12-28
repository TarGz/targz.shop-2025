# Implementation Worklist

Based on architecture.md - Phase 1 (MVP)

---

## 1. Project Setup

- [X] Initialize Astro project
- [X] Install and configure Tailwind CSS
- [X] Set up project folder structure
- [ ] Configure Netlify deployment

---

## 2. Content Structure

- [X] Define markdown schema for artworks (title, price, status, images, description)
- [X] Create sample artwork markdown files (29 artworks migrated from Shopify)
- [X] Set up content collections in Astro

---

## 3. Frontend Pages

- [X] Home page with artwork grid (header, hero, grid with images)
- [X] Individual artwork detail page
- [ ] Checkout success page
- [ ] Checkout cancel page
- [ ] About/contact page will be a link out to this page https://targz.fr/about/

---

## 4. Decap CMS

- [X] Install and configure Decap CMS
- [X] Create admin panel at `/admin`
- [X] Define collection schema for artworks
- [X] Set up Netlify Identity for authentication

---

## 5. Stripe Integration

- [ ] Create Netlify serverless function for checkout session
- [ ] Pass product data (title, price, image) at checkout time
- [ ] Configure shipping address collection
- [ ] Handle success/cancel redirects

---

## 6. Webhook & Inventory

- [ ] Create webhook endpoint for Stripe events
- [ ] On successful payment: commit `status: sold` to GitHub
- [ ] Verify webhook signatures for security
- [ ] Trigger Netlify rebuild

---

## 7. Email Notifications

- [ ] Set up Resend integration
- [ ] Send order confirmation to customer
- [ ] Send notification to seller

---

## 8. Final Setup

- [ ] Configure environment variables (Stripe keys, Resend API key)
- [ ] Set up custom domain
- [ ] Test full purchase flow
- [ ] Go live

---

## Deferred to Phase 2

- Shopping cart functionality
- Bilingual support (FR/EN)
- Print/edition support
- Advanced shipping calculations