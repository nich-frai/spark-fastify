import { performance } from 'node:perf_hooks'
const startedAt = performance.now()

// Vendor libs
import { config as configEnv } from 'dotenv'
configEnv()

import fastify from "fastify"
import kleur from 'kleur'

// Fastify plugins
import autoload from '@fastify/autoload'
import fastifyHelmet from "@fastify/helmet"

import { SparkConfig } from './config'
import { container } from './dependency_container'
import fastifyCookie from '@fastify/cookie'

const config = SparkConfig
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

// launch server
app.listen(config.server)
	.catch(listeningError => {
		console.error(listeningError)
		app.log.fatal("Failed to bind the server to the specified address + port!", listeningError)
		process.exit(1)
	})
	.then(at => {
		console.log(`🔥 ${kleur.bold(` Spark `)} ${kleur.gray('(fastify)')}`)
		console.log(`- ${kleur.green('listening at:')} ${kleur.bold(at ?? 'http://127.0.0.1:4000')}`)
		console.log(`- ${kleur.blue('took:')} ${kleur.bold(
			(performance.now() - startedAt).toFixed(2)
		)}ms`)
		process.stdout.write(`- ${kleur.magenta('routes:')}\n`)

	})
	.finally(() => {
		process.stdout.write(app.printRoutes())
	})