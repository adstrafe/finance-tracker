export const getEnvVar = (name: string) => {
	const env = process.env[name]
	if (!env) {
		throw new Error(`No env named: "${name}" found.`)
	}

	return env
}
