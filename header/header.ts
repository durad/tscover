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
	tscover.data['__filename__'] = tscover.data['__filename__'] || {
		s: __statements__,
		b: __branches__,
		hash: '__fileHash__',
		sourceCode: __sourceCode__
	};

	let r = eval('require');
	let fs = (typeof r === 'function') ? r('fs') : null;
	let path = (typeof r === 'function') ? r('path') : null;

	let process = global.process || null;
	let autosave = process && ((process.argv && process.argv.indexOf('--autosavecover') >= 0) || process.env.AUTOSAVECOVER);
	if (autosave && !tscover.scheduleLcovSave) {
		tscover.scheduleLcovSave = true;
		let argIndex = process.argv.indexOf('--autosavecover');
		if (argIndex >= 0) process.argv.splice(argIndex, 1);

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
			files: <any[]>[]
		};

		for (let filePath in tscover.data) {
			let fileData = tscover.data[filePath];

			// statements
			let fileStatCount = 0;
			let fileStatCovered = 0;
			let fileStatCoverage = 0;
			let linesMap: { [index: string]: { l: number, c: number } } = {};
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
				branches: fileData.b,
				sourceCode: fileData.sourceCode
			});

			result.totalStatCount += fileStatCount;
			result.totalStatCovered += fileStatCovered;
			result.totalLineCount += lines.length;
			result.totalLineCovered += fileLineCovered;
			result.totalBranchCount += fileData.b.length;
			result.totalBranchCovered += fileBranchCovered;
		}

		result.files.sort(function(a: { filePath: string }, b: { filePath: string }) { return (a.filePath == b.filePath) ? 0 : (a.filePath > b.filePath ? 1 : -1); });

		if (result.totalStatCount !== 0) result.totalStatCoverage = result.totalStatCovered / result.totalStatCount;
		if (result.totalBranchCount !== 0) result.totalBranchCoverage = result.totalBranchCovered / result.totalBranchCount;
		if (result.totalLineCount !== 0) result.totalLineCoverage = result.totalLineCovered / result.totalLineCount;

		return result;
	};

	if (!tscover.generateLcov) tscover.generateLcov = function(pathRemap: { from: string, to: string }) {
		let coverage = tscover.generateCoverage();
		let p = [];

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
	};

	if (!tscover.saveLcov) tscover.saveLcov = function(lcovPath = '.', pathRemap: { from: string, to: string }) {
		lcovPath = path.join(lcovPath, 'coverage');
		if (!fs.existsSync(lcovPath)) fs.mkdirSync(lcovPath);

		let lcov = tscover.generateLcov(pathRemap);
		fs.writeFileSync(path.join(lcovPath, 'lcov.info'), lcov, 'utf8');
	};

	if (!tscover.generateReport) tscover.generateReport = function(reportPath = '.', pathRemap: { from: string, to: string }) {
		let coverage = tscover.generateCoverage();
		let report: string[] = [];

		report.push('<html>');
		report.push('<head>');
		report.push('<style>');

		report.push(`__REPORTCSS__`);

		report.push('</style>');
		report.push('</head>');
		report.push('<body>');

		report.push(`<div class="viewer${projectHash}">`);
		report.push(`<div class="filelist${projectHash}">`);

		let root: any = { folders: {}, files: [] };

		for (let file of coverage.files) {
			let parts = file.filePath.split(/\/|\\/);
			file.name = parts[parts.length - 1];
			let folder: { [index: string]: any } = root;
			for (let part of parts.slice(0, -1)) {
				if (part === '') continue;
				folder.folders[part] = folder.folders[part] || { folders: {}, files: [], name: part };
				folder = folder.folders[part];
			}

			folder.files.push(file);
		}

		let keys = function(o: any) {
			let ks = [];
			for (let k in o) ks.push(k);
			return ks;
		}

		while (keys(root.folders).length === 1) {
			root = root.folders[keys(root.folders)[0]];
		}

		let createFolderElem = function(folder: any) {
			report.push(`<div class="foldername${projectHash}">${folder.name}</div>`);
			report.push(`<div class="foldercontent${projectHash}">`)

			for (let subfolder in folder.folders) {
				createFolderElem(folder.folders[subfolder]);
			}

			for (let file of folder.files) {
				report.push(`<div class="filecontainer${projectHash} filecontainer${file.hash} ${file === coverage.files[0] ? ('active' + projectHash) : ''}" onclick="selectFile('${file.hash}')">`);
				report.push(`<div class="filepath${projectHash}">${file.name}</div>`);
				let fileStat = `${Math.round(file.lineCoverage * 1000) / 10}%`;
				let fileStatClass = file.lineCoverage === 1 ? 'green' : 'red';
				report.push(`<div class="filestat${projectHash} ${fileStatClass}${projectHash}">${fileStat}</div>`);
				report.push(`</div>`);
			}

			report.push(`</div>`);
		}

		createFolderElem(root);

		for (let file of coverage.files) {
		}

		report.push('</div>');

		report.push(`<div class="filecontents${projectHash}">`);

		for (let file of coverage.files) {
			let wh = [];
			let white: string = null;
			let isWhitespace = false;
			let formattedSource: string[] = [];
			let lineNumbers: string[] = [];
			let lineCount = 0;
			let lastLine = '';
			let buffer = '';
			let pch: string = null;
			let ch: string;
			let letterOrDigit = /[a-z0-9]+/i;

			let linesMap: { [index: string]: number } = {};
			for (let line of file.lines) {
				linesMap[line.l] = line.c;
			}

			let keywords1 = ['abstract', 'class', 'const', 'constructor', 'debugger', 'declare', 'delete', 'enum', 'extends',
				'false', 'from', 'function', 'get', 'global', 'implements', 'in', 'instanceof', 'interface', 'is', 'keyof',
				'let', 'module', 'namespace', 'new', 'null', 'of', 'package', 'private', 'protected', 'public', 'readonly',
				'require', 'set', 'static', 'super', 'this', 'true', 'type', 'typeof', 'var', 'void'];

			let keywords2 = ['as', 'async', 'await', 'break', 'case', 'catch', 'continue', 'default', 'do', 'else', 'export',
				'finally', 'for', 'if', 'import', 'return', 'switch', 'throw', 'try', 'while', 'with', 'yield'];

			let keywords3 = ['any', 'boolean', 'never', 'number', 'object', 'string', 'Symbol', 'undefined'];

			let encodeCh = function() {
				return ch.replace(/&/g, '&amp;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#39;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/\`/g, '&#96;');
			};

			let createElem = function(text: string, classes: string[] = []) {
				let classesStr = (classes.length !== 0) ? ` class="${classes.map(c => { return `${c}${projectHash}` }).join(' ')}"` : '';

				return `<span${classesStr}>${text}</span>`;
			};

			let addBuffer = function() {
				if (buffer.length === 0) return;

				if (white !== null) {
					if (white[0] === '/') lastLine += createElem(buffer, ['comment']);
					else lastLine += createElem(buffer, ['str']);
				}

				else if (keywords1.indexOf(buffer) !== -1) lastLine += createElem(buffer, ['key1']);
				else if (keywords2.indexOf(buffer) != -1) lastLine += createElem(buffer, ['key2']);
				else if (keywords3.indexOf(buffer) != -1) lastLine += createElem(buffer, ['key3']);
				else if (buffer[0].match(letterOrDigit) && ch === '(') lastLine += createElem(buffer, ['func']);
				else if (buffer.match(/\d+/)) lastLine += createElem(buffer, ['num']);
				else lastLine += buffer;

				buffer = '';
			};

			let addLine = function() {
				let countElem = '';
				if (linesMap[lineCount] !== undefined) {
					if (linesMap[lineCount] > 0) {
						countElem = `<span class="covercount${projectHash}">x<span class="count${projectHash}">${linesMap[lineCount]}</span></span>`;
					} else {
						countElem = `<span class="covercount${projectHash}"><span class="count${projectHash}">&#33;</span></span>`;
					}
				}

				let lineClass = linesMap[lineCount] !== undefined ? (linesMap[lineCount] === 0 ? `noncovered${projectHash}` : `covered${projectHash}`) : '';
				lineNumbers.push(`<div class="linenumber${projectHash} ${lineClass}">${lineCount + 1}</div>`);
				formattedSource.push(`<span class="line${projectHash} ${lineClass}">${lastLine}${countElem}</span>`);
				lastLine = '';
				lineCount++;
			};

			for (ch of file.sourceCode) {
				if (ch === '\r') continue;

				if (white === null) {
					if (ch.match(letterOrDigit)) {
						buffer += ch;
					} else if (ch === '\n') {
						addBuffer();
						addLine();
					} else {
						addBuffer();

						if (['\'', '"', '`'].indexOf(ch) !== -1 && pch !== '\\') {
							white = ch;
							buffer += ch;
						} else if (pch === '/' && ch === '/') {
							lastLine = lastLine.substring(0, lastLine.length - 1);
							buffer = '//';
							white = '//';
						} else if (pch === '/' && ch === '*') {
							lastLine = lastLine.substring(0, lastLine.length - 1);
							buffer = '/*';
							white = '/*';
						} else {
							lastLine += encodeCh();
						}
					}
				} else {
					if (ch === white && pch !== '\\') {
						buffer += ch;
						addBuffer();
						white = null;
					} else if (ch === '\n') {
						addBuffer();
						addLine();
						if (white === '//') white = null;
					} else if (white === '/*' && pch === '*' && ch === '/') {
						buffer += ch;
						addBuffer();
						white = null;
					} else {
						buffer += encodeCh();
					}
				}

				pch = ch;
			}

			addBuffer();
			addLine();


			// let formattedSource: string[] = [];
			// let lineNumbers: string[] = [];

			// let linesMap: { [index: string]: number } = {};
			// for (let line of file.lines) {
			// 	linesMap[line.l] = line.c;
			// }

			// let source = file.sourceCode;
			// let inserts = [];

			// for (let branch of file.branches) {
			// 	if (branch.c[0] === 0) inserts.push({ pos: branch.s, ifType: true });
			// 	else if (branch.c[1] === 0) inserts.push({ pos: branch.s, ifType: false });
			// }

			// inserts.sort(function(a, b) { return a.pos - b.pos; });
			// let sourceParts = [];
			// let lastPartPos = 0;

			// for (let insert of inserts) {
			// 	sourceParts.push(source.substring(lastPartPos, insert.pos));

			// 	if (insert.ifType) {
			// 		sourceParts.push(`<span class="warrning${projectHash} warrningif${projectHash}" title="If path not taken.">I</span>`);
			// 	} else {
			// 		sourceParts.push(`<span class="warrning${projectHash} warrningelse${projectHash}" title="Else path not taken.">E</span>`);
			// 	}

			// 	lastPartPos = insert.pos;
			// }

			// sourceParts.push(source.substring(lastPartPos));
			// source = sourceParts.join('');

			// source = source.replace(/\r/g, '');
			// let sourceLines = source.split('\n');

			// for (let li = 0; li < sourceLines.length; li++) {
			// 	let lineClass = linesMap[li] !== undefined ? (linesMap[li] === 0 ? `noncovered${projectHash}` : `covered${projectHash}`) : '';
			// 	let line = sourceLines[li]
			// 		.replace(/&/g, '&amp;')
			// 		.replace(/"/g, '&quot;')
			// 		.replace(/'/g, '&#39;')
			// 		.replace(/</g, '&lt;')
			// 		.replace(/>/g, '&gt;')
			// 		.replace(/\`/g, '&#96;');

			// 	let countElem = '';
			// 	if (linesMap[li] !== undefined) {
			// 		if (linesMap[li] > 0) {
			// 			countElem = `<span class="covercount${projectHash}">x<span class="count${projectHash}">${linesMap[li]}</span></span>`;
			// 		} else {
			// 			countElem = `<span class="covercount${projectHash}"><span class="count${projectHash}">&#33;</span></span>`;
			// 		}
			// 	}

			// 	lineNumbers.push(`<div class="linenumber${projectHash} ${lineClass}">${li + 1}</div>`);
			// 	formattedSource.push(`<span class="line${projectHash} ${lineClass}">${line}${countElem}</span>`);
			// }

			report.push(`<div class="filecontent${projectHash} filecontent${file.hash} ${file === coverage.files[0] ? ('active' + projectHash) : ''}">`);
			report.push(`<div class="linenumbers${projectHash}">${lineNumbers.join('\n')}</div>`);
			report.push(`<pre class="source${projectHash}">${formattedSource.join('\n')}</pre>`);
			report.push(`</div>`);
		}

		report.push('</div>');
		report.push('</div>');

		report.push('<script>');
		report.push(`__REPORTJS__`);
		report.push('</script>');

		report.push('</body>');
		report.push('</html>');

		return report.join('\n');
	};

	if (!tscover.saveReport) tscover.saveReport = function(reportPath = '.', pathRemap: { from: string, to: string }) {
		reportPath = path.join(reportPath, 'coverage');
		if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);

		let report = tscover.generateReport();
		fs.writeFileSync(path.join(reportPath, 'coverage.html'), report, 'utf8');
	};

	if (!tscover.saveCoverage) tscover.saveCoverage = function(coveragePath = '.') {
		coveragePath = path.join(coveragePath, 'coverage');
		if (!fs.existsSync(coveragePath)) fs.mkdirSync(coveragePath);

		let coverage = tscover.generateCoverage();
		fs.writeFileSync(path.join(coveragePath, 'coverage.json'), JSON.stringify(coverage, null, 2), 'utf8');
	};
}

__fileHash__ = __fileHash__.__tscover__.data['__filename__'];
