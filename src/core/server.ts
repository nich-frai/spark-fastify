import fastify, { FastifyInstance } from "fastify"

// Fastify plugins
import autoload from '@fastify/autoload'
import fastifyHelmet from "@fastify/helmet"
import fastifyCookie from '@fastify/cookie'

import { container } from './dependency_container'
import type { ISparkConfig } from './create_config'


export function startServer(app: FastifyInstance, config: ISparkConfig) {
	// launch server
	return app.listen(config.server)
		.catch(listeningError => {
			console.error(listeningError)
			app.log.fatal("Failed to bind the server to the specified address + port!", listeningError)
			process.exit(1)
		})
}

export async function createServer(config: ISparkConfig) {

	const app = fastify(config.app)

	app.register(fastifyHelmet)
	app.register(fastifyCookie, {})

	container.register(config.injector.register ?? {})

	container.loadModules(
		config.injector.autoload,
		config.injector.autoloadOptions
	)

	app.register(
		autoload,
		config.routes
	)

	await app.ready()

	return app
}