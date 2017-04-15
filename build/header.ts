let __statements__ = null;
let __branches__ = null;
let __sourceCode__ = null;
// ---split---
let __fileHash__: any = (Function('return this'))();

{
	let global = __fileHash__;
	global.__tscover__ = global.__tscover__ || { hash: '__projectHash__', data: {} };
	let projectHash = '__projectHash__';
	let tscover = global.__tscover__;
	let coverageData = tscover.data;
	coverageData['__filename__'] = coverageData['__filename__'] || {
		s: __statements__,
		b: __branches__,
		hash: '__fileHash__',
		sourceCode: __sourceCode__
	};

	let r = eval('require');
	let fs = (typeof r === 'function') ? r('fs') : null;
	let path = (typeof r === 'function') ? r('path') : null;

	let process = global.process || null;
	if (process && process.argv && process.argv.indexOf('--autosavecover') >= 0 && !tscover.scheduleLcovSave) {
		tscover.scheduleLcovSave = true;
		let argIndex = process.argv.indexOf('--autosavecover');
		process.argv.splice(argIndex, 1);

		for (let e of ['beforeExit', 'exit', 'SIGINT', 'SIGTERM']) {
			process.on(e, () => {
				if (!tscover.lcovOnExitSaved) {
					tscover.lcovOnExitSaved = true;
					tscover.saveCoverage();
					tscover.saveLcov();
					tscover.saveReport();
				}
			});
		}
	}

	if (!tscover.generateCoverage) tscover.generateCoverage = function() {
		let result = {
			hash: projectHash,
			totalLineCount: 0,
			totalLineCovered: 0,
			totalLineCoverage: 0,
			totalStatCount: 0,
			totalStatCovered: 0,
			totalStatCoverage: 0,
			totalBranchCount: 0,
			totalBranchCovered: 0,
			totalBranchCoverage: 0,
			files: []
		};

		for (let filePath in coverageData) {
			let fileData = coverageData[filePath];

			// statements
			let fileStatCount = 0;
			let fileStatCovered = 0;
			let fileStatCoverage = 0;
			let linesMap = {};
			let lines = [];

			for (let statement of fileData.s) {
				fileStatCount++;
				if (statement.c > 0) fileStatCovered++;

				if (!linesMap[statement.l]) {
					linesMap[statement.l] = { l: statement.l, c: 0 };
					lines.push(linesMap[statement.l]);
				}

				linesMap[statement.l].c += statement.c;
			}

			if (fileStatCount !== 0) fileStatCoverage = fileStatCovered / fileStatCount;

			// lines
			let fileLineCovered = 0;
			let fileLineCoverage = 0;

			lines.sort(function(a, b) { return a.l - b.l });

			for (let line of lines) {
				if (line.c) fileLineCovered++;
			}

			if (lines.length !== 0) fileLineCoverage = fileLineCovered / lines.length;

			// branches
			let fileBranchCovered = 0;
			let fileBranchCoverage = 0;

			for (let branch of fileData.b) {
				if (branch.c[0] > 0 && branch.c[1] > 0) fileBranchCovered++;
			}

			if (fileData.b.length !== 0) fileBranchCoverage = fileBranchCovered / fileData.b.length;

			result.files.push({
				hash: fileData.hash,
				filePath: filePath,
				statementsCount: fileStatCount,
				statementsCovered: fileStatCovered,
				statementsCoverage: fileStatCoverage,
				lineCount: lines.length,
				lineCovered: fileLineCovered,
				lineCoverage: fileLineCoverage,
				branchCount: fileData.b.length,
				branchCovered: fileBranchCovered,
				branchCoverage: fileBranchCoverage,
				lines: lines,
				statements: fileData.s,
				branches: fileData.b
			});

			result.totalStatCount += fileStatCount;
			result.totalStatCovered += fileStatCovered;
			result.totalLineCount += lines.length;
			result.totalLineCovered += fileLineCovered;
			result.totalBranchCount += fileData.b.length;
			result.totalBranchCovered += fileBranchCovered;
		}

		result.files.sort(function(a, b) { return (a.filePath == b.filePath) ? 0 : (a.filePath > b.filePath ? 1 : -1); })

		if (result.totalStatCount !== 0) result.totalStatCoverage = result.totalStatCovered / result.totalStatCount;
		if (result.totalBranchCount !== 0) result.totalBranchCoverage = result.totalBranchCovered / result.totalBranchCount;
		if (result.totalLineCount !== 0) result.totalLineCoverage = result.totalLineCovered / result.totalLineCount;

		return result;
	}

	if (!tscover.generateLcov) tscover.generateLcov = function(pathRemap) {
		let p = [];
		let coverage = tscover.generateCoverage();

		for (let file of coverage.files) {
			let outPath = file.filePath;
			if (pathRemap) outPath = outPath.replace(pathRemap.from, pathRemap.to);

			p.push('TN:');
			p.push(`SF:${outPath}`);
			p.push('FNF:0');
			p.push('FNH:0');

			for (let line of file.lines) {
				p.push(`DA:${line.l + 1},${line.c}`);
			}

			p.push(`LF:${file.statementsCount}`);
			p.push(`LH:${file.statementsCovered}`);

			for (let bi = 0; bi < file.branches.length; bi++) {
				p.push(`BRDA:${file.branches[bi].l + 1},${bi + 1},0,${file.branches[bi].c[0]}`);
				p.push(`BRDA:${file.branches[bi].l + 1},${bi + 1},1,${file.branches[bi].c[1]}`);
			}

			p.push(`BRF:${file.branchCount}`);
			p.push(`BRH:${file.branchCovered}`);
			p.push('end_of_record');
		}

		return p.join('\n');
	}

	if (!tscover.generateLcovOld) tscover.generateLcovOld = function(pathRemap) {
		let p = [];
		for (let f in coverageData) {
			if (pathRemap) f = f.replace(pathRemap.from, pathRemap.to);

			p.push('TN:');
			p.push('SF:' + f);
			p.push('FNF:0');
			p.push('FNH:0');

			let q = coverageData[f];
			let h = 0;
			let m: any = {};

			for (let li = 0; li < q.s.length; li++) {
				m[q.s[li].l] = m[q.s[li].l] || 0
				m[q.s[li].l] += q.s[li].c;
			}

			for (let k in m) {
				p.push('DA:' + (parseInt(k) + 1) + ',' + m[k]);
				if (m[k] > 0) h++;
			}

			p.push('LF:' + q.s.length);
			p.push('LH:' + h);

			h = 0;
			q.b.sort(function(a, b) { return a.l - b.l; });

			for (let bi = 0; bi < q.b.length; bi++) {
				p.push('BRDA:' + (q.b[bi].l + 1) + ',' + (bi + 1) + ',0,' + q.b[bi].c[0]);
				p.push('BRDA:' + (q.b[bi].l + 1) + ',' + (bi + 1) + ',1,' + q.b[bi].c[1]);
				if (q.b[bi].c[0] > 0 || q.b[bi].c[1] > 0) h++
			}

			p.push('BRF:' + q.b.length);
			p.push('BRH:' + h);
			p.push('end_of_record');
		}

		return p.join('\n');
	}

	if (!tscover.saveLcov) tscover.saveLcov = function(lcovPath = '.', pathRemap: any) {
		lcovPath = path.join(lcovPath, 'coverage');
		if (!fs.existsSync(lcovPath)) fs.mkdirSync(lcovPath);

		let lcov = tscover.generateLcov(pathRemap);
		fs.writeFileSync(path.join(lcovPath, 'lcov.info'), lcov, 'utf8');
	}

	if (!tscover.generateReport) tscover.generateReport = function(reportPath = '.', pathRemap: any) {
		let report = [];
		report.push('<html>');
		report.push('<head>');
		report.push('<style>');

		report.push(`
			.viewer${projectHash} {
				position: absolute;
				left: 0px;
				top: 0px;
				bottom: 0px;
				right: 0px;
			}

			.filenames${projectHash} {
				position: absolute;
				left: 0px;
				top: 0px;
				bottom: 0px;
				width: 200px;
				background-color: #eee;
				border-right: 1px solid #ccc;
				box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
				overflow: hidden;
				z-index: 10;
			}

			.filename${projectHash} {
				padding: 10px 0px;
				font-familly: Verdana;
			}

			.line${projectHash} {
				display: inline-block;
				width: 100%;
			}

			.line${projectHash}.covered${projectHash} {
				background-color: #dfd;
			}

			.line${projectHash}.noncovered${projectHash} {
				background-color: #fdd;
			}

			.filecontents${projectHash} {
			}

			.filecontent${projectHash} {
				display: none;
				position: absolute;
				left: 200px;
				top: 0px;
				bottom: 0px;
				right: 0px;
				font-family: 'Consolas', 'Courier New', monospace;
				font-size: 14px;
			}

			.filecontent${projectHash}.active {
				display: block;
			}

			.linenumbers${projectHash} {
				position: absolute;
				left: 0px;
				top: 0px;
				bottom: 0px;
				width: 40px;
				margin: 0px;
				background-color: #fff;
				border-right: 2px solid #adf;
				box-sizing: border-box;
				margin: 0px;
			}

			.linenumber${projectHash} {
				text-align: right;
				padding-right: 3px;
			}

			.source${projectHash} {
				position: absolute;
				left: 40px;
				top: 0px;
				right: 0px;
				bottom: 0px;
				margin: 0px;
			}

			.source${projectHash} span {
				padding-left: 4px;
				box-sizing: border-box;
			}
		`);

		report.push('</style>');
		report.push('</head>');
		report.push('<body>');

		report.push(`<div class="viewer${projectHash}">`);
		report.push(`<div class="filenames${projectHash}">`);
		for (let f in coverageData) {
			report.push(`<div class="filename${projectHash}" hash="${coverageData[f].hash}">${f}</div>`);
		}
		report.push('</div>');

		report.push(`<div class="filecontents${projectHash}">`);
		let fileIndex = 0;
		for (let f in coverageData) {
			let q = coverageData[f];
			let h = 0;
			let m: any = {};

			for (let li = 0; li < q.s.length; li++) {
				m[q.s[li].l] = m[q.s[li].l] || 0
				m[q.s[li].l] += q.s[li].c;
			}

			let source = coverageData[f].sourceCode.replace(/\r/g, '');
			let sourceLines = source.split('\n');
			let formattedSource = [];
			let lineNumbers = [];
			for (let li = 0; li < sourceLines.length; li++) {
				lineNumbers.push(`<div class="linenumber${projectHash}">${li + 1}</div>`);

				if (m[li] === 0) {
					formattedSource.push(`<span class="line${projectHash} noncovered${projectHash}">${sourceLines[li]}</span>`);
				} else if (m[li] > 0) {
					formattedSource.push(`<span class="line${projectHash} covered${projectHash}">${sourceLines[li]}</span>`);
				} else {
					formattedSource.push(`<span class="line${projectHash}">${sourceLines[li]}</span>`);
				}
			}

			report.push(`<div class="filecontent${projectHash} ${fileIndex === 0 ? 'active' : ''}" hash="${coverageData[f].hash}">`);
			report.push(`<div class="linenumbers${projectHash}">${lineNumbers.join('\n')}</div>`);
			report.push(`<pre class="source${projectHash}">${formattedSource.join('\n')}</pre>`);
			report.push(`</div>`);

			fileIndex++;
		}
		report.push('</div>');

		report.push('</div>');

		report.push('</body>');
		report.push('</html>');

		return report.join('\n');
	}

	if (!tscover.saveReport) tscover.saveReport = function(reportPath = '.', pathRemap: any) {
		reportPath = path.join(reportPath, 'coverage');
		if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);

		let report = tscover.generateReport();
		fs.writeFileSync(path.join(reportPath, 'coverage.html'), report, 'utf8');
	}

	if (!tscover.saveCoverage) tscover.saveCoverage = function(coveragePath = '.') {
		coveragePath = path.join(coveragePath, 'coverage');
		if (!fs.existsSync(coveragePath)) fs.mkdirSync(coveragePath);

		let coverage = tscover.generateCoverage();
		fs.writeFileSync(path.join(coveragePath, 'coverage.json'), JSON.stringify(coverage, null, 2), 'utf8');
	}
}

__fileHash__ = __fileHash__.__tscover__.data['__filename__'];
