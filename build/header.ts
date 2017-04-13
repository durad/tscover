let __statements__ = null;
let __branches__ = null;
let __sourceCode__ = null;
// ---split---
let __fileHash__: any = (Function('return this'))();

{
    let global = __fileHash__;
    global.__coverage__ = global.__coverage__ || { hash: '__projectHash__', data: {} };
    let projectHash = '__projectHash__';
    let coverage = global.__coverage__;
    let data = coverage.data;
    data['__filename__'] = data['__filename__'] || {
        s: __statements__,
        b: __branches__,
        hash: '__fileHash__',
        sourceCode: __sourceCode__
    };

    let r = eval('require');
    let fs = (typeof r === 'function') ? r('fs') : null;
    let path = (typeof r === 'function') ? r('path') : null;

    let process = global.process || null;
    if (process && process.argv && process.argv.indexOf('--autosavecover') >= 0 && !coverage.scheduleLcovSave) {
        coverage.scheduleLcovSave = true;
        let argIndex = process.argv.indexOf('--autosavecover');
        process.argv.splice(argIndex, 1);

        for (let e of ['beforeExit', 'exit', 'SIGINT', 'SIGTERM']) {
            process.on(e, () => {
                if (!coverage.lcovOnExitSaved) {
                    coverage.lcovOnExitSaved = true;
                    coverage.saveLcov();
                    coverage.saveReport();
                }
            });
        }
    }

    if (!coverage.generateLcov) coverage.generateLcov = function(pathRemap) {
        let p = [];
        for (let f in data) {
            if (pathRemap) f = f.replace(pathRemap.from, pathRemap.to);

            p.push('TN:');
            p.push('SF:' + f);
            p.push('FNF:0');
            p.push('FNH:0');

            let q = data[f];
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

    if (!coverage.saveLcov) coverage.saveLcov = function(lcovPath = '.', pathRemap: any) {
        lcovPath = path.join(lcovPath, 'coverage');
        if (!fs.existsSync(lcovPath)) fs.mkdirSync(lcovPath);

        let lcov = coverage.generateLcov(pathRemap);
        fs.writeFileSync(path.join(lcovPath, 'lcov.info'), lcov, 'utf8');
        fs.writeFileSync(path.join(lcovPath, 'lcov.info.json'), JSON.stringify(coverage, null, 2), 'utf8');
    }

    if (!coverage.generateReport) coverage.generateReport = function(reportPath = '.', pathRemap: any) {
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
        for (let f in data) {
            report.push('<div class="filename" hash="' + data[f].hash + '">' + f + '</div>');
        }
        report.push('</div>');

        report.push(`<div class="filecontents${projectHash}">`);
        let fileIndex = 0;
        for (let f in data) {
            let q = data[f];
            let h = 0;
            let m: any = {};

            for (let li = 0; li < q.s.length; li++) {
                m[q.s[li].l] = m[q.s[li].l] || 0
                m[q.s[li].l] += q.s[li].c;
            }

            let source = data[f].sourceCode.replace(/\r/g, '');
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

            report.push(`<div class="filecontent${projectHash} ${fileIndex === 0 ? 'active' : ''}" hash="${data[f].hash}">`);
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

    if (!coverage.saveReport) coverage.saveReport = function(reportPath = '.', pathRemap: any) {
        reportPath = path.join(reportPath, 'coverage');
        if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath);

        let report = coverage.generateReport();
        fs.writeFileSync(path.join(reportPath, 'coverage.html'), report, 'utf8');
    }
}

__fileHash__ = __fileHash__.__coverage__.data['__filename__'];
