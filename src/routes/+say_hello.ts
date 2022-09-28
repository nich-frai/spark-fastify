import { createRoute } from "#core/create_route"
import { t } from "#core/schema"
import type SayHelloService from "#lib/+say_hello.service"

export default createRoute(
	{
		url : 'hello/:name',
		
		schema : {
			params : t.Object({
				'name' : t.Optional(t.String())
			}),
		},
		
		handler(req, _res, sayHelloService : SayHelloService) {
			return sayHelloService.say(req.params.name)
		},

	}
)