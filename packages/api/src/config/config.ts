import { z } from 'zod';
import { getEnvVar } from '~/utils/getEnvVar';

// Zod schema for the configuration
const AppConfigSchema = z.object({
	server: z.object({
		host: z.string().min(1, 'Server host must not be empty'),
		port: z.string().regex(/^\d+$/, 'Port must be a valid number string'),
	}),
	auth: z.object({
		jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
	}),
	mongo: z.object({
		uri: z.string().min(1, 'MongoDB URI must not be empty'),
		dbName: z.string().min(1, 'Database name must not be empty'),
	}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * Loads and validates all required environment variables at startup.
 * This should only be called once during application initialization.
 *
 * @throws {Error} If any required environment variable is missing or invalid
 * @returns {AppConfig} Validated configuration object
 */
export const loadConfig = (): AppConfig => {
	const rawConfig = {
		server: {
			host: getEnvVar('HOST'),
			port: getEnvVar('PORT'),
		},
		auth: {
			jwtSecret: getEnvVar('JWT_SECRET'),
		},
		mongo: {
			uri: getEnvVar('MONGO_URI'),
			dbName: getEnvVar('MONGO_DB_NAME'),
		},
	};

	// Validate the config structure with Zod
	const result = AppConfigSchema.safeParse(rawConfig);

	if (!result.success) {
		const errors = result.error.issues
			.map((err) => `${err.path.join('.')}: ${err.message}`)
			.join('\n');
		throw new Error(`Configuration validation failed:\n${errors}`);
	}

	return result.data;
};

// Global config instance - initialized once at startup
let config: AppConfig | null = null;

/**
 * Initializes the global configuration.
 * Must be called once at application startup before any other code runs.
 */
export const initConfig = (): AppConfig => {
	if (config) {
		throw new Error('Config already initialized');
	}
	config = loadConfig();
	return config;
};

/**
 * Gets the global configuration instance.
 * @throws {Error} If config hasn't been initialized yet
 */
export const getConfig = (): AppConfig => {
	if (!config) {
		throw new Error('Config not initialized. Call initConfig() first.');
	}
	return config;
};

