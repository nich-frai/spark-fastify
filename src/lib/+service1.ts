import { InjectableName } from "#core/inject"

export default class Service1 {
	static [InjectableName] = 'service1'

	do() {
		return 'Hey, its service 1'
	}
}