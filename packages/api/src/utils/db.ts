import { MongoClient, Document, ServerApiVersion } from 'mongodb';
import type { AppConfig } from '~/config/config';

let client: MongoClient | null = null;

/**
 * Establishes a connection to MongoDB using the provided configuration.
 * Returns the existing client if already connected.
 * @param {AppConfig} config - Application configuration containing MongoDB URI
 * @returns {Promise<MongoClient>} The connected MongoDB client instance
 * @throws {Error} If the connection fails
 */
export const connectDb = async (config: AppConfig) => {
	if (client) {
		return client;
	}

	client = new MongoClient(config.mongo.uri, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		}
	});
	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		return client;
	} catch (error) {
		console.error('❌ MongoDB connection failed:', { error });
		client = null;
		throw error;
	}
}

/**
 * Gets a MongoDB database instance. Must call connectDb() first.
 * @param {string} [dbName] - Optional database name. If not provided, uses the default database from connection string
 * @returns {Db} MongoDB database instance with 1000ms timeout
 * @throws {Error} If not connected to MongoDB
 */
export const getDb = (dbName?: string) => {
	if (!client) {
		throw new Error('You must be connected to a db first.');
	}

	return client.db(dbName, { timeoutMS: 1000 });
}

/**
 * Gets a typed MongoDB collection instance. Must call connectDb() first.
 * @template T - The document type for the collection
 * @param {string} collection - Name of the collection to retrieve
 * @param {string} [dbName] - Optional database name. If not provided, uses the default database
 * @returns {Collection<T>} Typed MongoDB collection with 1000ms timeout
 * @throws {Error} If not connected to MongoDB
 */
export const getCollection = <T extends Document>(collection: string, dbName?: string) => {
	const db = getDb(dbName);
	return db.collection<T>(collection, { timeoutMS: 1000 });
}

/**
 * Closes the MongoDB connection and cleans up resources.
 * Safe to call even if not connected.
 * @returns {Promise<void>}
 */
export const disconnectDb = async () => {
	if (client) {
		await client.close();
		console.log('🔌 MongoDB connection closed');
		return;
	}

	console.error('No client connected.');
}
