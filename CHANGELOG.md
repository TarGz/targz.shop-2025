# Changelog

## [1.3.0] - 2025-12-31

### Added
- Cart page with two-column layout
- Cart component (Preact) with localStorage persistence
- Reassurance blocks sidebar: packaging, shipping, secure payment, authenticity, contact
- Unique pieces: items can only be added once (no quantity controls)

### Changed
- Add-to-cart shows "Already in cart" if item exists
- Header cart count shows number of items (not quantities)

## [1.2.0] - 2025-12-30

### Added
- Category pages now use ImageWithText header component
- Dark overlay on homepage banner

### Changed
- Navigation renamed: "On Bristol" and "On Canvas"
- Header increased height (9rem) and logo size (55px) for more breathing room
- Page-width padding increased to 4rem on desktop
- Homepage banner height increased to 500px
- Homepage buttons: "Explore Bristols" and "Explore Canvas" (hidden)
- Category headers: "Pen Plotted On Bristol/Canvas" with larger text
- Product grid now 3 columns instead of 4
- Product page main image displays at full height

## [1.1.2] - 2025-12-30

### Changed
- Header logo: replaced text with image (targz-art-pen-plotter-logo.jpg)
- Homepage hero: new banner with hero image
- Button text: "Explore Editions" changed to "Explore Originals"
- ImageWithText component: improved padding (25% on both sides) for better alignment

## [1.1.1] - 2025-12-30

### Changed
- Product page right section redesigned to match Shopify reference
- Typography: Domine serif for title, Open Sans for body text
- Proper spacing between text blocks
- Product type label above title
- Price section with sold out badge
- Shipping text with link
- Button styles: 5px radius, 47px height, proper disabled state

## [1.1.0] - 2025-12-30

### Added
- ImageWithText component for collection headers
- Lightbox zoom on product images (click to view full width)
- Vertical gallery layout on product pages (2-1-2 pattern)

### Changed
- Homepage layout: 2-column product grid instead of 4
- Collection headers replaced with image+text blocks
- Product image background changed to white
- Cursor changed to crosshair on zoomable images

## [1.0.1] - 2024-12-29

### Changed
- Updated colors: white background, light gray nav

## [1.0.0] - 2024-12-29

### Added
- Initial Astro frontend with Directus CMS