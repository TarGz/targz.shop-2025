# Brief: Shopify to Self-Hosted E-commerce Migration

## Project Overview

Migrate existing Shopify store (`shop.targz.fr`, 42 unique artworks) to a serverless, maintenance-free solution on `targz.shop`. Preserve all SEO with proper 301 redirects. Eliminate monthly Shopify costs while maintaining full control and maximum durability.

---

## Current State

- **Current shop**: `shop.targz.fr` (Shopify)
- **Products**: 42 unique artworks (pen plotter art) - each is one-of-a-kind
- **Portfolio**: `targz.fr` (Jekyll, GitHub Pages) - remains independent
- **Server**: Contabo VPS available (not needed for this architecture)

---

## New Architecture (Serverless)

### Design Principles

1. **Zero server maintenance** - No VPS, Docker, or database to manage
2. **GitHub as source of truth** - Product data versioned and durable
3. **Stripe handles inventory** - Prevents double-selling unique pieces
4. **Static site** - Works even if any service is temporarily down
5. **Minimal ongoing costs** - ~€12/year (domain only)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Repo                       │
│  - Artwork markdown files (source of truth)         │
│  - Astro frontend code                              │
│  - Images in /public                                │
└─────────────────────┬───────────────────────────────┘
                      │ push triggers build
                      ▼
┌─────────────────────────────────────────────────────┐
│                     Netlify                          │
│  - Static site hosting (free tier)                  │
│  - Serverless functions (webhook handler)           │
│  - Domain: targz.shop                               │
│  - SSL: automatic                                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                     Stripe                           │
│  - Products & Prices (inventory tracking)           │
│  - Checkout Sessions (hosted)                       │
│  - Apple Pay / Google Pay (automatic)               │
│  - Webhooks → Netlify function                      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Transactional Email                     │
│  - Resend (3,000/month free)                        │
│  - Order confirmation to customer                   │
│  - New order notification to admin                  │
└─────────────────────────────────────────────────────┘
```

### Stack Summary

| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | Astro + Tailwind CSS | Free |
| Hosting | Netlify (static + functions) | Free |
| CMS | Markdown files in GitHub | Free |
| Database | None needed | Free |
| Payments | Stripe Checkout | 1.5% + €0.25/tx |
| Email | Resend | Free (3k/month) |
| Domain | targz.shop | ~€12/year |

---

## Cost Analysis

### Fixed Costs

| Period | Cost |
|--------|------|
| Monthly | **€0** |
| Yearly | **~€12** (domain only) |

### Transaction Fees (Stripe)

| Card Type | Fee |
|-----------|-----|
| EU cards | 1.5% + €0.25 |
| UK cards | 2.5% + €0.25 |
| International | 3.25% + €0.25 |

**Example:**

| Artwork Price | EU Fee | You Receive |
|---------------|--------|-------------|
| €50 | €1.00 | €49.00 |
| €150 | €2.50 | €147.50 |
| €300 | €4.75 | €295.25 |
| €500 | €7.75 | €492.25 |

### Comparison vs Shopify

| | Shopify | New Architecture |
|--|---------|------------------|
| Monthly fee | ~€29 | €0 |
| Yearly fixed | ~€348 | ~€12 |
| Transaction fee | ~2-3% | 1.5% |
| Server maintenance | None | None |
| **Annual savings** | - | **~€336+** |

---

## Unique Artwork Stock Management

Since each artwork is unique, preventing double-sales is critical.

### Solution: Stripe as Inventory Manager

1. Each artwork exists as a Stripe Product with `active: true/false`
2. When customer clicks "Buy", Stripe checks product is active
3. On successful payment, webhook marks product `active: false`
4. Webhook commits `status: sold` to GitHub
5. Netlify rebuilds site (1-2 minutes)
6. Artwork shows as "Sold" on site

**Why this works:**
- Stripe is atomic - only one checkout can succeed
- If two people try to buy simultaneously, second payment fails
- No race conditions possible
- No real-time backend needed

### Stripe Product Setup

```javascript
// Each artwork in Stripe
{
  id: "prod_artwork001",
  name: "Generative Flow #42",
  active: true,  // false when sold
  metadata: {
    slug: "generative-flow-42",
    github_path: "content/artworks/generative-flow-42.md"
  },
  default_price: "price_xxx"  // €150.00
}
```

---

## Payment Methods

### Stripe Checkout (Hosted)

Stripe Checkout automatically shows available payment options based on customer device:

| Device | Options Shown |
|--------|---------------|
| iPhone/Safari | Apple Pay, Cards |
| Android/Chrome | Google Pay, Cards |
| Desktop Safari | Apple Pay (if configured), Cards |
| Other browsers | Cards |

### Setup Required

1. **Stripe Dashboard** → Settings → Payment Methods
   - Apple Pay: enabled by default
   - Google Pay: enabled by default

2. **Apple Pay Domain Verification**
   - Download file from Stripe Dashboard
   - Place at: `public/.well-known/apple-developer-merchantid-domain-association`
   - Netlify serves it automatically

### Additional Payment Methods (Optional)

Enable in Stripe Dashboard for EU customers:

| Method | Market | Fee |
|--------|--------|-----|
| Bancontact | Belgium | 1.4% + €0.25 |
| iDEAL | Netherlands | €0.29 flat |
| SEPA Debit | EU | 0.8% (max €5) |
| Klarna | EU | 3.29% + €0.35 |

---

## GitHub as Product Database

### Repository Structure

```
targz.shop-2025/
├── content/
│   └── artworks/
│       ├── synapses-grand-palais/
│       │   ├── index.md          # Artwork metadata & description
│       │   ├── 01.png            # Main image
│       │   ├── 02.png            # Detail/alternate views
│       │   └── ...
│       ├── plasma-convection/
│       │   ├── index.md
│       │   ├── 01.jpg
│       │   └── ...
│       └── ... (30 artwork folders)
├── public/
│   └── .well-known/
│       └── apple-developer-merchantid-domain-association
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── shop.astro
│   │   ├── artwork/
│   │   │   └── [slug].astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── success.astro
│   │   └── legal.astro
│   ├── components/
│   │   ├── ArtworkCard.astro
│   │   ├── Gallery.astro
│   │   ├── BuyButton.astro
│   │   └── Header.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── lib/
│       ├── artworks.js
│       └── stripe.js
├── netlify/
│   └── functions/
│       ├── create-checkout.js
│       └── stripe-webhook.js
├── import/                        # Migration files (not deployed)
│   ├── products_export_1.csv
│   └── migrate.js
├── netlify.toml
└── package.json
```

### Artwork Folder Structure

Each artwork is self-contained in its own folder:

```
content/artworks/synapses-grand-palais/
├── index.md      # Metadata + description
├── 01.png        # Main image (first in gallery)
├── 02.png        # Additional images
├── 03.png
└── ...
```

**Benefits:**
- Self-contained: one folder = one complete artwork
- Easy to backup, move, or delete
- Images referenced relatively: `./01.png`
- Git-friendly: all changes to one artwork in one commit

### Artwork Markdown Format

```yaml
# content/artworks/synapses-grand-palais/index.md
---
title: "Synapses - Grand Palais"
slug: synapses-grand-palais
price: 1250
status: available  # available | sold | reserved
stripe_product_id: "prod_xxx"
stripe_price_id: "price_xxx"
dimensions: "81 x 60 cm"
technique: "Pen plotter on canvas"
materials: "Archival ink on canvas"
year: 2024
featured: true
shopify_handle: "synapses-grand-palais"  # For redirect mapping
images:
  - ./01.png
  - ./02.png
  - ./03.png
tags:
  - canvas
  - brush-pen
  - large-format
---

The piece will be featured during Art Capital - Comparaison 2025 at the Grand Palais...
```

### Benefits of Git-Based CMS

- **Version controlled** - Full history of all changes
- **Durable** - GitHub is highly reliable, easy to backup
- **No database** - Nothing to maintain or migrate
- **Offline editing** - Edit locally with any text editor
- **Pull request workflow** - Review changes before publishing
- **Easy rollback** - Revert any change instantly

---

## Technical Implementation

### Frontend (Astro)

**Features:**
- SSG (Static Site Generation) - all pages pre-built
- Image optimization via Astro Image
- SEO meta tags per page
- Responsive design (mobile-first)
- Fast page loads (<2s)
- Works offline (static files)

**Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Homepage with featured artworks |
| `/shop` | Gallery grid of all artworks |
| `/artwork/[slug]` | Individual artwork page with Buy button |
| `/about` | About the artist |
| `/contact` | Contact form |
| `/legal` | Legal notices, CGV |
| `/success` | Post-purchase confirmation |

### Netlify Functions

#### 1. Create Checkout Session

```javascript
// netlify/functions/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { priceId, slug, title } = JSON.parse(event.body);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    mode: 'payment',
    success_url: `https://targz.shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://targz.shop/artwork/${slug}`,
    shipping_address_collection: {
      allowed_countries: ['FR', 'DE', 'BE', 'NL', 'ES', 'IT', 'GB', 'US', 'CA']
    },
    metadata: {
      artwork_slug: slug,
      artwork_title: title
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  };
};
```

#### 2. Stripe Webhook Handler

```javascript
// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Octokit } = require('@octokit/rest');
const { Resend } = require('resend');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { artwork_slug, artwork_title } = session.metadata;

    // 1. Mark Stripe product as inactive
    await stripe.products.update(session.metadata.product_id, {
      active: false
    });

    // 2. Update GitHub markdown file
    await updateGitHubFile(artwork_slug);

    // 3. Send email notifications
    await sendOrderEmails(session, artwork_title);
  }

  return { statusCode: 200, body: 'OK' };
};

async function updateGitHubFile(slug) {
  const path = `content/artworks/${slug}.md`;

  // Get current file
  const { data: file } = await octokit.repos.getContent({
    owner: 'your-username',
    repo: 'targz.shop-2025',
    path
  });

  // Update status to sold
  let content = Buffer.from(file.content, 'base64').toString();
  content = content.replace('status: available', 'status: sold');

  // Commit change
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-username',
    repo: 'targz.shop-2025',
    path,
    message: `Mark ${slug} as sold`,
    content: Buffer.from(content).toString('base64'),
    sha: file.sha
  });
}

async function sendOrderEmails(session, artworkTitle) {
  const customerEmail = session.customer_details.email;
  const customerName = session.customer_details.name;
  const shippingAddress = session.shipping_details.address;

  // Email to customer
  await resend.emails.send({
    from: 'Targz Shop <order@targz.shop>',
    to: customerEmail,
    subject: `Order Confirmation - ${artworkTitle}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Dear ${customerName},</p>
      <p>Your purchase of <strong>${artworkTitle}</strong> has been confirmed.</p>
      <p>We will ship your artwork within 3-5 business days and send you tracking information.</p>
      <p>Shipping to:<br>
      ${shippingAddress.line1}<br>
      ${shippingAddress.line2 || ''}<br>
      ${shippingAddress.postal_code} ${shippingAddress.city}<br>
      ${shippingAddress.country}</p>
      <p>Thank you for supporting independent art!</p>
      <p>- Targz</p>
    `
  });

  // Email to admin
  await resend.emails.send({
    from: 'Targz Shop <order@targz.shop>',
    to: 'your-email@example.com',
    subject: `New Sale: ${artworkTitle}`,
    html: `
      <h1>New Order Received!</h1>
      <p><strong>Artwork:</strong> ${artworkTitle}</p>
      <p><strong>Amount:</strong> €${session.amount_total / 100}</p>
      <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
      <p><strong>Ship to:</strong><br>
      ${shippingAddress.line1}<br>
      ${shippingAddress.line2 || ''}<br>
      ${shippingAddress.postal_code} ${shippingAddress.city}<br>
      ${shippingAddress.country}</p>
      <p><a href="https://dashboard.stripe.com/payments/${session.payment_intent}">View in Stripe</a></p>
    `
  });
}
```

### Netlify Configuration

```toml
# netlify.toml

[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

# Redirects for old Shopify URLs
[[redirects]]
  from = "/products/*"
  to = "/artwork/:splat"
  status = 301

[[redirects]]
  from = "/collections/*"
  to = "/shop"
  status = 301

[[redirects]]
  from = "/pages/about"
  to = "/about"
  status = 301

[[redirects]]
  from = "/pages/contact"
  to = "/contact"
  status = 301

[[redirects]]
  from = "/cart"
  to = "/"
  status = 301

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Transactional Emails

### Email Service: Resend

**Why Resend:**
- 3,000 emails/month free (more than enough)
- Simple API
- Good deliverability
- React email templates (optional)
- Easy setup

### Required Emails

| Email | Trigger | Recipient |
|-------|---------|-----------|
| Order Confirmation | checkout.session.completed | Customer |
| New Order Alert | checkout.session.completed | Admin (you) |
| Shipping Notification | Manual trigger | Customer |

### DNS Setup for Email

Add to your domain DNS:

```
# SPF Record
TXT  @  "v=spf1 include:resend.com ~all"

# DKIM (provided by Resend)
TXT  resend._domainkey  "v=DKIM1; k=rsa; p=..."
```

---

## Shopify Export & Migration

### Data to Export

1. **Products** (CSV from Shopify Admin > Products > Export)
   - Title, Description, Handle (slug)
   - Price, SKU
   - Images (URLs to download)
   - Tags
   - Inventory status

2. **URL Structure** (for redirect mapping)
   - Product URLs: `/products/[handle]`
   - Collection URLs: `/collections/[handle]`
   - Pages: `/pages/[handle]`

### Migration Script

```javascript
// scripts/migrate-shopify.js
const fs = require('fs');
const csv = require('csv-parser');
const https = require('https');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function migrateProducts() {
  const products = [];

  // Read Shopify CSV
  fs.createReadStream('shopify-products.csv')
    .pipe(csv())
    .on('data', (row) => products.push(row))
    .on('end', async () => {
      for (const product of products) {
        // 1. Create Stripe product
        const stripeProduct = await stripe.products.create({
          name: product['Title'],
          metadata: { slug: product['Handle'] }
        });

        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(parseFloat(product['Variant Price']) * 100),
          currency: 'eur'
        });

        // 2. Create markdown file
        const markdown = `---
title: "${product['Title']}"
slug: ${product['Handle']}
price: ${product['Variant Price']}
status: ${product['Variant Inventory Qty'] > 0 ? 'available' : 'sold'}
stripe_product_id: "${stripeProduct.id}"
stripe_price_id: "${stripePrice.id}"
dimensions: ""
technique: "Pen plotter on paper"
materials: ""
year: 2024
featured: false
shopify_handle: "${product['Handle']}"
images: []
tags: []
---

${product['Body (HTML)'] || ''}
`;

        fs.writeFileSync(
          `content/artworks/${product['Handle']}.md`,
          markdown
        );

        // 3. Download images
        const imageUrl = product['Image Src'];
        if (imageUrl) {
          await downloadImage(imageUrl, `public/images/artworks/${product['Handle']}-1.jpg`);
        }

        console.log(`Migrated: ${product['Title']}`);
      }
    });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

migrateProducts();
```

---

## 301 Redirect Strategy

### Phase 1: Shopify Redirects (Keep Shopify active 3-6 months)

In Shopify Admin > Online Store > Navigation > URL Redirects:

```
/products/artwork-001 → https://targz.shop/artwork/artwork-001
/products/artwork-002 → https://targz.shop/artwork/artwork-002
... (all 42 products)
/collections/all → https://targz.shop/shop
/pages/about → https://targz.shop/about
```

### Phase 2: DNS Transfer (After 3-6 months)

1. Point `shop.targz.fr` DNS to Netlify
2. Add domain in Netlify settings
3. Netlify handles redirects via `netlify.toml`
4. Cancel Shopify subscription

---

## Migration Workflow

### Pre-Migration

- [x] Export Shopify products (CSV)
- [x] Download all product images
- [x] Document current URL structure
- [x] Create GitHub repository
- [x] Setup dual license (MIT for code, All Rights Reserved for artwork)
- [ ] Create Stripe account (test mode)
- [ ] Create Resend account

### Data Migration (COMPLETED)

- [x] Create migration script (`import/migrate.js`)
- [x] Filter out Edition prints (13 excluded)
- [x] Import 29 original pen plot artworks
- [x] Download 111 images from Shopify CDN
- [x] Generate markdown files with metadata
- [x] Organize in self-contained folders (`content/artworks/{slug}/`)
- [x] Initial git commit

**Migration Results:**
- 29 artwork folders created
- 111 images downloaded (76 MB total)
- Each artwork has `index.md` + numbered images (`01.jpg`, `02.jpg`, etc.)

### Development Phase

- [ ] Initialize Astro project
- [ ] Create Stripe products (sync with markdown files)
- [ ] Build frontend pages
- [ ] Implement Netlify functions (checkout + webhook)
- [ ] Setup Apple Pay domain verification
- [ ] Test complete purchase flow (test mode)
- [ ] Test email notifications

### Deployment Phase

- [ ] Deploy to Netlify
- [ ] Configure DNS for `targz.shop`
- [ ] Verify SSL certificate
- [ ] Setup Stripe webhook endpoint
- [ ] Switch Stripe to live mode
- [ ] Final production testing

### Redirect Setup

- [ ] Create redirect list (29 products)
- [ ] Add redirects in Shopify Admin
- [ ] Test each redirect
- [ ] Submit sitemap to Google Search Console

### Go-Live

- [ ] Update link on `targz.fr` portfolio
- [ ] Update social media links
- [ ] Monitor for errors

### Post-Migration (3-6 months)

- [ ] Monitor Google Search Console for 404s
- [ ] Verify redirect traffic
- [ ] Transfer `shop.targz.fr` to Netlify
- [ ] Cancel Shopify subscription

---

## Maintenance & Durability

### What Requires No Maintenance

| Component | Why |
|-----------|-----|
| Frontend | Static files, Netlify handles everything |
| Database | None exists |
| SSL | Auto-renewed by Netlify |
| Backups | GitHub has full history |
| Server | None exists |

### Minimal Ongoing Tasks

| Task | Frequency |
|------|-----------|
| Ship sold artworks | Per order |
| Add new artworks | As created |
| Dependency updates | Quarterly (optional) |

### Adding New Artwork

1. Create markdown file in `content/artworks/new-piece.md`
2. Add images to `public/images/artworks/`
3. Create Stripe product (dashboard or script)
4. Commit and push to GitHub
5. Netlify auto-deploys in ~1 minute

### Disaster Recovery

| Scenario | Recovery |
|----------|----------|
| Netlify down | Site unavailable, but GitHub has all data |
| GitHub down | Local copy exists, push when back |
| Stripe down | Checkout unavailable, site still displays |
| Resend down | Orders still process, emails delayed |

All services are independent - single point of failure only affects that feature.

---

## Deliverables

### 1. GitHub Repository

- Astro source code
- Content markdown files (42 artworks)
- Netlify functions
- Migration scripts
- README with setup instructions

### 2. Stripe Configuration

- 42 products with prices
- Webhook endpoint configured
- Apple Pay domain verified

### 3. Netlify Setup

- Site deployed
- Custom domain configured
- Environment variables set
- Functions deployed

### 4. Resend Configuration

- Domain verified
- API key configured

### 5. Migration Documentation

- Redirect mapping spreadsheet
- Go-live checklist
- Admin guide (adding artworks, processing orders)

---

## Success Criteria

### Functional

- [ ] All 42 products migrated
- [ ] Purchase flow works end-to-end
- [ ] Apple Pay / Google Pay working
- [ ] Email notifications sent
- [ ] Sold items marked automatically

### SEO

- [ ] All product URLs redirect with 301
- [ ] No 404 errors in Search Console
- [ ] Sitemap submitted
- [ ] Meta tags on all pages

### Performance

- [ ] Lighthouse score > 90
- [ ] Homepage load < 2s
- [ ] Mobile responsive

### Cost

- [ ] Monthly cost: €0
- [ ] Yearly cost: ~€12 (domain)
- [ ] Transaction fees: 1.5%

---

## Environment Variables

```bash
# Netlify Environment Variables

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# GitHub (for webhook to update files)
GITHUB_TOKEN=ghp_xxx

# Resend
RESEND_API_KEY=re_xxx
```

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Server maintenance? | None - fully serverless |
| Double-selling unique pieces? | Stripe manages inventory atomically |
| Product data durability? | GitHub with full version history |
| Payment methods? | Cards + Apple Pay + Google Pay |
| Transactional emails? | Resend (free tier) |
| Monthly cost? | €0 |

---

## Additional Notes

- Portfolio site `targz.fr` remains unchanged (Jekyll on GitHub Pages)
- Add link to `targz.shop` in `targz.fr` navigation
- Bilingual support (FR/EN) can be added via Astro i18n
- Focus on simplicity and long-term maintainability
- Full data ownership (GitHub + Stripe dashboard)
