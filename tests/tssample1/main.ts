
import { Lib } from './lib'

let l = new Lib(346);

// call some function
l.someFunction();
l.someFunction();

function a() {};
function b(cb: () => any) {};

a();
l.someFunction();
b(() => {
    a();
    l.someFunction();

    let q: any;
    let y: number = 22, u: number = 44;
    q = 123;
    q = q + 1;
    q++;
    q = new Lib(234);
    q = null;
    q = undefined;
    q += 2;
});

let x = 123;

if (x % 3 == 0) {
    console.log('Fizz');
} else console.log('Buzz');

