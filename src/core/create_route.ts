import fastifyMultipart from '@fastify/multipart';
import fastifyFormBody from "@fastify/formbody"
import { type TypeBoxTypeProvider, TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import type { AwilixContainer } from "awilix";
import type { ContextConfigDefault, FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest, FastifySchema, HTTPMethods, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerBase, RawServerDefault, RouteGenericInterface, RouteShorthandOptions } from "fastify";
import type { ResolveFastifyReplyReturnType } from "fastify/types/type-provider";
import kleur from 'kleur';

const isDev = ['dev', 'development'].includes(process.env.NODE_ENV?.toLocaleLowerCase() ?? 'production')

export const createRoute: ICreateRoute = (routeOptions) => {
	return (
		fastify: FastifyInstance,
		pluginOptions: Record<string, unknown> & { container: AwilixContainer },
		done: (err?: Error) => void
	) => {

		// should use TypeBox compiler (faster) ?
		if (routeOptions.useTypeBoxCompiler === true) {
			fastify.setValidatorCompiler(TypeBoxValidatorCompiler)
		}

		// get dependency names from handler
		const handlerDependencies = getParamNames(routeOptions.handler).slice(2);

		// add body parser according to schema
		if (routeOptions.schema?.body != null) {
			fastify.register(fastifyMultipart)
			fastify.register(fastifyFormBody)
		}

		// check for dependencies beforehand if dev
		if(isDev) {
			for(const depName of handlerDependencies) {
				if(!pluginOptions.container.hasRegistration(depName)) {
					console.warn(
						`${kleur.yellow().bold('WARN')}: missing dependency ${`"${kleur.bold(depName)}"`} ${kleur.gray(`@ ${routeOptions.method?.toLocaleUpperCase() ?? 'GET'}::${(pluginOptions.prefix ?? '')}${routeOptions.url ?? ''}`)}`
					)
					console.warn(
						kleur.gray("- Failed to find the dependency during route creation! If it's injected by a hook this message might be ignored and will not appear in production!\n")
					)
				}
			}
		}

		fastify.route({
			...routeOptions,
			// @ts-ignore Mostly TS complaining that it does not know the response type
			handler(req, res) {

				const scopedContainer = pluginOptions.container.createScope()

				// resolve dependencies
				const resolvedDependencies: unknown[] = [];
				for (let dependencyName of handlerDependencies) {
					try {

						const resolved = scopedContainer.resolve(dependencyName);
						resolvedDependencies.push(resolved)

					} catch (err) {
						console.error(`Failed to resolve dependency from route with name "${dependencyName}"`)
						//@ts-ignore complains that our "schema" does not define our error message
						res.status(500).send({ message: 'There was a problem loading necessary dependencies for this route to work!' })
						return
					}
				}

				//@ts-ignore complains that fastify instance do not match because we are using the default generic values
				return routeOptions.handler(req, res, ...resolvedDependencies)
			},
			method: routeOptions.method?.toLocaleUpperCase() as HTTPMethods ?? 'GET',
			url: routeOptions.url ?? '/'
		})

		done()
	}
}

interface ICreateRoute {
	<
		RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
		ContextConfig = ContextConfigDefault,
		SchemaCompiler extends FastifySchema = FastifySchema
	>(opts:
		RouteOptions<
			RawServerBase,
			RawRequestDefaultExpression<RawServerBase>,
			RawReplyDefaultExpression<RawServerBase>,
			RouteGeneric,
			ContextConfig,
			SchemaCompiler,
			TypeBoxTypeProvider
		>,
		...services: unknown[]
	): unknown;
}

type RouteHandlerMethod<
	RawServer extends RawServerBase = RawServerDefault,
	RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
	RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
	ContextConfig = ContextConfigDefault,
	SchemaCompiler extends FastifySchema = FastifySchema,
	TypeProvider extends TypeBoxTypeProvider = TypeBoxTypeProvider,
	Logger extends FastifyBaseLogger = FastifyBaseLogger
> = (
	this: FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>,
	request: FastifyRequest<
		RouteGeneric,
		RawServer,
		RawRequestDefaultExpression<RawServer>,
		SchemaCompiler,
		TypeBoxTypeProvider
	>,
	reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider>,
	...services: any[]
	// This return type used to be a generic type argument. Due to TypeScript's inference of return types, this rendered returns unchecked.
) => ResolveFastifyReplyReturnType<TypeProvider, SchemaCompiler, RouteGeneric>


interface RouteOptions<
	RawServer extends RawServerBase = RawServerDefault,
	RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
	RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
	RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
	ContextConfig = ContextConfigDefault,
	SchemaCompiler extends FastifySchema = FastifySchema,
	TypeProvider extends TypeBoxTypeProvider = TypeBoxTypeProvider,
	Logger extends FastifyBaseLogger = FastifyBaseLogger
> extends RouteShorthandOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider, Logger> {
	method?: HTTPMethods | Lowercase<HTTPMethods>;
	url?: string;
	handler: RouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider, Logger>;
	useTypeBoxCompiler?: boolean;
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
const ARGUMENT_NAMES = /([^\s,]+)/g

function getParamNames(func: Function) {
	var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if (result === null)
		result = [];
	return result;
}