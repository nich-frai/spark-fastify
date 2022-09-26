import { createConfig } from "#core/create_config";
import { asValue } from "awilix";

export const SparkConfig = createConfig({ 
	injector : {
		register : {
			'meaningOfLife' : asValue(42)
		}
	}
})