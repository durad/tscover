let __statements__ = null;
let __branches__ = null;
// ---split---
let __hash__: any = (Function('return this'))();

{
    let global = __hash__;
    global.__coverage__ = global.__coverage__ || { hash: '__hash__', data: {} };
    let coverage = global.__coverage__;
    let data = coverage.data;
    data['__filename__'] = data['__filename__'] || {
        s: __statements__,
        b: __branches__
    };

    let r = eval('require');
    let fs = (typeof r === 'function') ? r('fs') : null;
    let path = (typeof r === 'function') ? r('path') : null;

    let process = global.process || null;
    if (process && process.argv && process.argv.indexOf('--savelcov') >= 0 && !coverage.scheduleLcovSave) {
        coverage.scheduleLcovSave = true;

        for (let e of ['beforeExit', 'exit', 'SIGINT', 'SIGTERM']) {
            process.on(e, () => {
                if (!coverage.lcovOnExitSaved) {
                    coverage.lcovOnExitSaved = true;
                    coverage.saveLcov();
                }
            });
        }
    }

    if (!coverage.generateLcov) coverage.generateLcov = function(pathRemap) {
        let p = [];
        for (let f in data) {
            let ff = f;
            if (pathRemap) ff = ff.replace(pathRemap.from, pathRemap.to);

            p.push('TN:');
            p.push('SF:' + ff);
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
}

__hash__ = __hash__.__coverage__.data['__filename__'];
