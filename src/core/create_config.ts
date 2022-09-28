import type { AutoloadPluginOptions } from "@fastify/autoload";
import type { FastifyCookieOptions } from "@fastify/cookie";
import { type GlobWithOptions, Lifetime, Resolver } from "awilix";
import type { LoadModulesOptions } from "awilix/lib/load-modules";
import type { FastifyHttpsOptions, FastifyListenOptions, FastifyServerOptions } from "fastify";
import { randomUUID } from "node:crypto";
import type { Server } from "node:https";
import path from "node:path";
import { container } from "./dependency_container";
import { InjectableName } from "./inject";
import type { PartialDeep } from 'type-fest'

const isDev = ['dev', 'development'].includes(process.env.NODE_ENV?.toLocaleLowerCase() ?? 'production')

export function createConfig(options?: PartialDeep<ISparkConfig>): ISparkConfig {
	return {
		app: {
			...DefaultConfig.app,
			...options?.app
		},

		injector: {
			autoload: options?.injector?.autoload ?? DefaultConfig.injector.autoload,
			autoloadOptions: options?.injector?.autoloadOptions ?? DefaultConfig.injector.autoloadOptions,
			register : options?.injector?.register ?? DefaultConfig.injector.register,
		},

		routes: {
			...DefaultConfig.routes,
			...options?.routes,
			options : {
				...options?.routes?.options,
				// make sure the dependency container is avaliable at all times and cannot be overriden!
				container : container,
			}
		},

		server: {
			...DefaultConfig.server,
			...options?.server
		},

		cookies : {
			...DefaultConfig.cookies,
			...options?.cookies
		},

	} as unknown as ISparkConfig
}

export const DefaultConfig: ISparkConfig = {

	app: {
		logger: isDev, //,
		genReqId: () => randomUUID(),
		ignoreTrailingSlash : true,
		caseSensitive : true,
	},

	injector: {

		autoload: [
			// transient autoloading
			'./lib/~*.js',
			'./lib/~*.ts',
			// singleton autoloading
			['./lib/+*.js', Lifetime.SINGLETON],
			['./lib/+*.ts', Lifetime.SINGLETON],
		],

		autoloadOptions: {
			cwd: path.resolve(__dirname, '..',),
			formatName: (name, desc) => {
				const loadedModule = desc.value as any
				if (loadedModule != null && loadedModule[InjectableName] != null) {
					return loadedModule[InjectableName];
				}
				return name.replace(/^(\+|\~)/, '')
			}
		},

		register : {}

	},

	routes: {

		dir: path.join(__dirname, '..', 'routes'),

		options: { container },

		// ignore everything that does not follow "+name.(t|j)s" pattern
		// TODO: Ignore ".map.js" and ".d.ts" files!
		ignorePattern: /^(?:(?!(.+)?\+.+\.(t|j)s$))(.+)\.(t|j)s/,
		
		cascadeHooks: true,
		routeParams: true,
	},

	server: {
		host: process.env.SERVER_HOST_ADDR ?? '127.0.0.1',
		port: Number(process.env.SERVER_HOST_PORT ?? 4000),
	},

	cookies : {}
}

export interface ISparkConfig {
	app: FastifyHttpsOptions<Server> | FastifyServerOptions<Server>

	injector: {
		autoload: (string | GlobWithOptions)[]
		autoloadOptions: LoadModulesOptions
		register? : Record<string, Resolver<any>>
	}

	routes: AutoloadPluginOptions

	server: FastifyListenOptions

	cookies: FastifyCookieOptions
}