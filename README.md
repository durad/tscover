# TSCover: Code coverage for TypeScript

TSCover is a drop-in replacement for tsc compiler that produces instrumented javascript used to collect code coverage information. Code coverage is saved in the form of LCOV files. In the background it uses whatever version of typescript you have installed, however it intercepts compilation process and your source code so that when run it leaves trail in the `__coverage__` object.

# Usage

You can tun `tscover` the same way that you would normally run `tsc`. In order to produce LCOV files call the following statement to your typescript code:

    (Function('return this'))().__coverage__.saveLcov('/path/lcov.info');



