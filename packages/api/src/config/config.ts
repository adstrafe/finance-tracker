import { getEnvVar } from '~/utils/getEnvVar';

export interface AppConfig {
	readonly server: {
		readonly host: string;
		readonly port: string;
	};
	readonly auth: {
		readonly jwtSecret: string;
	};
	readonly mongo: {
		readonly uri: string;
		readonly dbName: string;
	};
}

/**
 * Loads and validates all required environment variables at startup.
 * This should only be called once during application initialization.
 *
 * @throws {Error} If any required environment variable is missing
 * @returns {AppConfig} Validated configuration object
 */
export const loadConfig = (): AppConfig => {
	return {
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

