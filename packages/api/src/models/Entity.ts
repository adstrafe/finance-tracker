import { z } from 'zod';

/**
 * Validates a MongoDB ObjectId string (24-character hexadecimal)
 */
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Zod schema for validating a single ObjectId string field
 * Use this when you need to validate an _id field
 */
export const ObjectIdField = z.string()
	.regex(objectIdRegex, 'Invalid ObjectId format: must be a 24 character hexadecimal string');

/**
 * Universal model for operations that need an entity ID (get, delete, etc.)
 * Can be used across any entity type (transactions, users, categories, etc.)
 */
export const EntityIdModel = z.object({
	_id: ObjectIdField
});

export type EntityId = z.infer<typeof EntityIdModel>;

