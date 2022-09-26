import  { createRoute } from "#core/create_route";
import { t } from "#core/schema";

export default createRoute({
	schema: {
		params : t.Object({
			name : t.String({ minLength : 3 })
		})
	},
	handler(req, res) {
		return "Hello! " + req.params.name
	}
})