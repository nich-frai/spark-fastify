import { createRoute } from "#core/create_route";
import { t } from "#core/schema";
import type Service1 from "#lib/+service1";

export default createRoute(
	{
		
		url : '',
		method : 'post',

		schema: {
			body: t.Object({
				name: t.String({ minLength : 4 })
			}),
		},
		
		handler(req, res, service1 : Service1) {
			
		},

	}
);