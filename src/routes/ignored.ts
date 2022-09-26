import  { createRoute } from "#core/create_route";
import { t } from "#core/schema";

export default createRoute({
	url : '/shouldNot',
	schema: {
		params : t.Object({
			name : t.String()
		})
	},
	handler(req, res) {
		return "Hello! " + req.params.name
	}
})