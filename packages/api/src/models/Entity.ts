import { z } from 'zod';

/**
 * Universal model for operations that need an entity ID (get, delete, etc.)
 * Can be used across any entity type (transactions, users, categories, etc.)
 */
export const EntityIdModel = z.object({
	_id: z.string()
});

export type EntityId = z.infer<typeof EntityIdModel>;

