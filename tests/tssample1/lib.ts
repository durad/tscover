
export class Lib {
	x: number;

	constructor(x: number) {
		this.x = x;
	}

	someFunction() {
		console.log('Hello from some function ' + this.x);
	}
}

