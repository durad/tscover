# TSCover: Code coverage for TypeScript

TSCover is a drop-in replacement for tsc compiler that produces instrumented javascript used to collect code coverage information. Code coverage is saved in the form of LCOV files, json data or as an HTML report.

## Usage

TSCover requires `typescript` library so first step is to make sure that typescript is installed globally:

	npm install -g typescript

After that install `tscover` as the global library:

	npm install -g tscover

You can run `tscover` the same way that you would run `tsc`, all tsc options will work as expected:

	tscover helloworld.ts

Additionally you can use tsconfig.json to specify compiler options:

	tscover -p myproject/tsconfig.json

