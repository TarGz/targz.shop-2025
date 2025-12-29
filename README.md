# TARGZ Shop

E-commerce website for **TARGZ** pen plotter art.

## About the Artist

**Targz** creates pen plotter art and generative art that bridges digital and physical worlds. Using custom code (JavaScript, Processing) alongside a self-made pen plotter, Targz transfers digital creations into unique analog artworks.

The artistic journey stems from a childhood passion for Lego, an affinity for geometric forms, and professional experience in creative programming. The work draws heavy inspiration from Op Art pioneers Vera Molnar and Bridget Riley.

Since 2019, Targz has documented creative processes through immersive videos on TikTok and Instagram.

- Website: [targz.fr](https://targz.fr)
- Shop: [targz.shop](https://targz.shop)

## Tech Stack

- **Frontend**: Astro 5 + Preact
- **CMS**: Directus (headless)
- **Hosting**: GitHub Pages (static)
- **Payments**: Stripe Checkout

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

---

## Changelog

### v1.0.0 (2025-12-29)

- Initial release
- Homepage with Paper and Canvas sections
- Product detail pages
- Directus CMS integration
- Product filtering by medium (paper/canvas)
- Sold badge on sold artworks
- Responsive design matching Shopify theme
- Image imports from targz.fr

---

## TODO

- [ ] Cart functionality (localStorage + Preact island)
- [ ] Stripe Checkout integration
- [ ] Success/Cancel pages after payment
- [ ] Product gallery component (multiple images)
- [ ] GitHub Actions auto-deploy
- [ ] Directus webhook to trigger rebuild on product change
- [ ] Stripe webhook to create orders in Directus
- [ ] Search functionality
- [ ] About page content
