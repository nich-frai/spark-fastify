import { performance } from 'node:perf_hooks'
const startedAt = performance.now()

import { config as configEnv } from 'dotenv'
import { createServer, startServer } from '#core/server'
import { SparkConfig } from './config'

import kleur from 'kleur'
configEnv()

createServer(SparkConfig)
	.then(
		async app => {
			
			const at = await startServer(app, SparkConfig)

			console.log(`🔥 ${kleur.bold(` Spark `)} ${kleur.gray('(fastify)')}`)
			console.log(`- ${kleur.green('listening at:')} ${kleur.bold(at ?? 'http://127.0.0.1:4000')}`)
			console.log(`- ${kleur.blue('took:')} ${kleur.bold(
				(performance.now() - startedAt).toFixed(2)
			)}ms`)
			process.stdout.write(`- ${kleur.magenta('routes:')}\n`)
			process.stdout.write(app.printRoutes())
		})


