import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artworks = defineCollection({
	loader: glob({ pattern: '*/index.md', base: './content/artworks' }),
	schema: z.object({
		thumbnail: z.string(),
		title: z.string(),
		slug: z.string(),
		price: z.number(),
		status: z.enum(['available', 'sold']),
		stripe_product_id: z.string().optional(),
		stripe_price_id: z.string().optional(),
		dimensions: z.string().optional(),
		technique: z.string().optional(),
		materials: z.string().optional(),
		year: z.number().optional(),
		reference: z.string().optional(),
		featured: z.boolean().default(false),
		shopify_handle: z.string().optional(),
		images: z.array(z.string()),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = { artworks };
