
// let
let ok = true; // true
// while
while (ok) {
	ok = false; // false
}

// do
ok = false;
do {
	ok = true;
} while (!ok)

// var
var v = 123;

// const
const c = 'I am constant';

// typeof
let t = typeof v;

// null
let n = null;

if (1 > 2) {

	let o = {
		a: 1,
		b: 'b',
		d: 'deleteme'
	};

	// delete
	delete o.d;

	// enum
	enum e {
		cats,
		dogs,
		cows
	}

	let animal: e = e.cats;


	// in
	for (let k in o) {
		console.log(typeof (<any>o)[k], k, (<any>o)[k]);
	}

}

// for
for (let i = 0; i < 3; i++) {
	// switch
	switch (i) {
		// case
		case 0:
			console.log('zero');
			// break
			break;
		case 1:
			console.log('one');
			break;
		// default
		default:
			console.log('default');
	}
}

// try
try {
	// throw
	throw new Error('omg!');
// catch
} catch (err) {
	console.log('caught');
} finally {
	console.log('finally');
}

for (let i = 0; i < 2; i++) {
	if (i === 0) {
		// continue;
		continue;
	// else
	} else {
		// break
		break;
	}
}

function sum(a: number, b: number) {
	return a + b;
}

console.log(sum(1, 2));

// interface
interface ShapeInterface {
	name: string;
	getSurface(): number;
}

// class
// implements
abstract class AbstractShape implements ShapeInterface {
	// public
	public name: string;

	// constructor
	constructor(name: string) {
		// this
		this.name = name;
	}

	// abstract
	abstract getSurface(): number;
}

// extends
class Shape extends AbstractShape {
	protected surface: number;

	constructor(name: string, surface?: number) {
		// super
		super(name);

		this.surface = surface || 0;
	}

	getSurface(): number {
		return this.surface;
	}
}

class Square extends Shape {
	// private
	private length: number;

	constructor(name: string, length: number) {
		super(name, length * length);
		this.length = length;
	}

	// void
	scale(factor: number): void {
		this.length *= factor;
		this.surface = Square.calcSurface(this.length);
	}

	// static
	static calcSurface(length: number): number {
		return length * length;
	}
}

let shape = new Shape('A', 10);
console.log(shape.getSurface());

let square = new Square('B', 1);
square.scale(3);
console.log(square.getSurface());

function* id() {
	// yield
	yield 1;
	yield 2;
	yield 3;
}

let gen = id();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());

async function d(n: number) {
	return new Promise(resolve => {
		setTimeout(resolve, n);
	});
}

(async () => {
	console.log('before');
	await d(10);
	console.log('after');
	throw 'omg!';
})().catch(e => console.log('Error:' + e));

	// BreakKeyword,
	// CaseKeyword,
	// CatchKeyword,
	// ClassKeyword,
	// ConstKeyword,
	// ContinueKeyword,
// DebuggerKeyword,
	// DefaultKeyword,
	// DeleteKeyword,
	// DoKeyword,
	// ElseKeyword,
	// EnumKeyword,
// ExportKeyword,
	// ExtendsKeyword,
	// FalseKeyword,
	// FinallyKeyword,
	// ForKeyword,
	// FunctionKeyword,
	// IfKeyword,
// ImportKeyword,
	// InKeyword,
	// InstanceOfKeyword,
	// NewKeyword,
	// NullKeyword,
	// ReturnKeyword,
	// SuperKeyword,
	// SwitchKeyword,
	// ThisKeyword,
	// ThrowKeyword,
	// TrueKeyword,
	// TryKeyword,
	// TypeOfKeyword,
	// VarKeyword,
	// VoidKeyword,
	// WhileKeyword,
// WithKeyword,

// // Strict mode reserved words
	// ImplementsKeyword,
	// InterfaceKeyword,
	// LetKeyword,
// PackageKeyword,
	// PrivateKeyword,
	// ProtectedKeyword,
	// PublicKeyword,
	// StaticKeyword,
	// YieldKeyword,

// // Contextual keywords
	// AbstractKeyword,
// AsKeyword,
// AnyKeyword,
	// AsyncKeyword,
	// AwaitKeyword,
// BooleanKeyword,
	// ConstructorKeyword,
// DeclareKeyword,
// GetKeyword,
// IsKeyword,
// KeyOfKeyword,
// ModuleKeyword,
// NamespaceKeyword,
// NeverKeyword,
// ReadonlyKeyword,
// RequireKeyword,
// NumberKeyword,
// ObjectKeyword,
// SetKeyword,
// StringKeyword,
// SymbolKeyword,
// TypeKeyword,
// UndefinedKeyword,
// FromKeyword,
// GlobalKeyword,
// OfKeyword, // LastKeyword and LastToken
