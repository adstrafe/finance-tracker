import { t } from '~/trpc/trpc';
import { Collections, CollectionsMap } from '~/mongo/Collections';
import { getCollection } from '~/utils/db';

/**
 * Configured database name - set once at startup
 */
let configuredDbName: string | null = null;

/**
 * Configures MongoDB with the database name.
 * Must be called once at application startup.
 */
export const configureMongo = (dbName: string): void => {
	if (configuredDbName) {
		throw new Error('MongoDB already configured');
	}
	configuredDbName = dbName;
};

/**
 * Middleware that provides a MongoDB collection to the context.
 * The database name is configured once at startup, never exposed to handlers.
 */
export const mongoMiddleware = <C extends Collections>(collectionName: C) => {
	return t.middleware(({ ctx, next }) => {
		if (!configuredDbName) {
			throw new Error('MongoDB not configured. Call configureMongo() first.');
		}

		const collection = getCollection<CollectionsMap[C]>(collectionName, configuredDbName);

		return next({ ctx: {
			...ctx,
			collection
		}});
	});
};

