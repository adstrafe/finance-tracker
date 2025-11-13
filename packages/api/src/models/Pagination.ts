import { z } from 'zod';

export const PaginationModel = z.object({
	page: z.number().min(1).optional().default(1), // current page (1-indexed)
	pageSize: z.number().min(1).max(100).optional().default(25)
});

export type Pagination = z.infer<typeof PaginationModel>;
