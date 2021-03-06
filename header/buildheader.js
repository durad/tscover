
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var UglifyJS = require("uglify-js");
var less = require('less');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var ts = require('typescript');

var debug = process.argv.indexOf('--debug') !== -1;

var outDir = path.join(__dirname, './../build/');
var outDirIndex = process.argv.indexOf('--outDir');
if (outDirIndex !== -1 && process.argv.length >= outDirIndex + 1) {
	outDir = path.resolve(process.argv[outDirIndex + 1]);
}

var header = fs.readFileSync(path.join(__dirname, 'header.ts'), 'utf8');

var headercodePath = path.join(__dirname, 'headercode.ts');
var headercodeStr = fs.readFileSync(headercodePath, 'utf8');
var result = ts.transpileModule(headercodeStr, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
var headercodeCompiled = result.outputText;

var reportJs = fs.readFileSync(path.join(__dirname, 'reportscript.js'), 'utf8');

if (!debug) {
	header = header.split('\n')
		.map(function(l) { return l.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\/\/.*/, ''); })
		.join('');

	reportJs = UglifyJS.minify(reportJs, {
		compress: {
			properties: false,
			pure_getters: false
		},
		mangle: {
			toplevel: false
		}
	}).code;

	headercodeCompiled = UglifyJS.minify(headercodeCompiled, {
		compress: {
			properties: false,
			pure_getters: false
		},
		mangle: {
			toplevel: false
		}
	}).code;
}

var reportStyle = fs.readFileSync(path.join(__dirname, 'reportstyle.less'), 'utf8');

var plugins = [];
if (process.argv.indexOf('--debug') === -1) {
	plugins.push(new LessPluginCleanCSS({ advanced: true }));
}

less.render(reportStyle, { plugins: plugins })
	.then(function(result){
		var reportCss = result.css;
		reportCss = reportCss.split('\n').map(function(l) { return JSON.stringify(l + (debug ? '\n' : '')); }).join(' +\n');
		reportJs = reportJs.split('\n').map(function(l) { return JSON.stringify(l + (debug ? '\n' : '')); }).join(' +\n');

		headercodeCompiled = headercodeCompiled.replace('__REPORTJS__', reportJs)
		headercodeCompiled = headercodeCompiled.replace('__REPORTCSS__', reportCss);
		headercodeCompiled = headercodeCompiled.replace(/\\/g, '\\\\');
		headercodeCompiled = headercodeCompiled.replace(/\`/g, "\\`");
		headercodeCompiled = headercodeCompiled.replace(/\$/g, '\\$');

		header = header.replace('__headerCode__', headercodeCompiled);

		fs.writeFileSync(path.join(outDir, 'header.tmpl'), header, 'utf8');

		if (process.argv.indexOf('--debug') !== -1) {
			console.log('Compiled ' + path.join(outDir, 'header.tmpl'));
		}
	})
	.catch(function(err) {
		console.error('Error while processing style.less:');
		console.error(err);
		process.exit(1);
	});
