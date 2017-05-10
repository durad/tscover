
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var UglifyJS = require("uglify-js");
var less = require('less');
var LessPluginCleanCSS = require('less-plugin-clean-css');

var headercodePath = path.join(__dirname, 'headercode.ts');
console.log(headercodePath);
var headercodeCmd = 'tsc ' + headercodePath + ' --outFile /dev/stdout';
// var c = child_process.execSync(headercodeCmd, { stdio: 'pipe' }).toString();
// console.log(c);

var proc = child_process.exec(headercodeCmd, { stdio: 0 });
proc.stdout.on('data', function(chunk) {
	console.log(chunk);
});

return;

var debug = process.argv.indexOf('--debug') !== -1;

var outDir = path.join(__dirname, './../build/');
var outDirIndex = process.argv.indexOf('--outDir');
if (outDirIndex !== -1 && process.argv.length >= outDirIndex + 1) {
	outDir = path.resolve(process.argv[outDirIndex + 1]);
}

var header = fs.readFileSync(path.join(__dirname, 'header.ts'), 'utf8');
header = header.split('// ---split---')[1];

var reportJs = fs.readFileSync(path.join(__dirname, 'reportscript.js'), 'utf8');

if (!debug) {
	header = header.split('\n')
		.map(function(l) { return l.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\/\/.*/, ''); })
		.join('');

	reportJs = UglifyJS.minify(reportJs, {
		fromString: true,
		compress: {
			properties: false,
			pure_getters: false
		},
		mangle: {
			toplevel: true
		}
	}).code;
}

header = header.replace('__REPORTJS__', reportJs)

var reportStyle = fs.readFileSync(path.join(__dirname, 'reportstyle.less'), 'utf8');

var plugins = [];
if (process.argv.indexOf('--debug') === -1) {
	plugins.push(new LessPluginCleanCSS({ advanced: true }));
}

less.render(reportStyle, { plugins: plugins })
	.then(function(result){
		var css = result.css;
		css = css.replace(/__projectHash__/g, '${projectHash}');
		header = header.replace('__REPORTCSS__', css);
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
