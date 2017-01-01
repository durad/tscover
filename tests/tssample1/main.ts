
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
    q = q +  1;
    q++;
    q = new Lib(234);
    q = null;
    q = undefined;
    q += 2;
});

b(() => { console.log(222); });

b(() => console.log(222));

b(() =>
    console.log(333)
);

let x = 123; let k = 323; let h = 535;

if (x % 3 == 0) {
    console.log('Fizz');
    console.log('Fizz again...');
} else console.log('Buzz');

if (1 > 0) {
    console.log('555');
} else {
    console.log('666');
    console.log('777');
}

let obj = {
    a: 'asd',
    x: 123
};

let gl = (Function('return this'))();
gl.__coverage__.saveLcov('/home/dusan/tscover/coverage/lcov.info', [['/home/dusan/', 'y:/']]);
// console.log(JSON.stringify(gl.__coverage__, null, 2));

