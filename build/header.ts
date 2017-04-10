let __statements__ = null;
let __branches__ = null;
// ---split---
let __hash__: any = (Function('return this'))();
if (!__hash__.__coverage__) __hash__.__coverage__ = {};
__hash__ = __hash__.__coverage__;

if (!__hash__.saveLcov) __hash__.generateLcov = function(pathRemap) {
    let g: any = (Function('return this'))();
    let p = [];
    let c: any = {};
    for (let k in g.__coverage__) c = g.__coverage__[k];
    for (let f in c) {
        let ff = f;
        if (pathRemap) {
            ff = ff.replace(pathRemap.from, pathRemap.to);
        }

        p.push('TN:');
        p.push('SF:' + ff);
        p.push('FNF:0');
        p.push('FNH:0');

        let q = c[f];
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

if (!__hash__.saveLcov) __hash__.saveLcov = function(lcovPath = 'lcov.info', pathRemap: any) {
    let g: any = (Function('return this'))();
    let fs;
    let r = eval('require');
    if (typeof r === 'function') fs = r('fs');
    else throw new Error('Cannot access require function.');

    let v = g.__coverage__.generateLcov(pathRemap);
    fs.writeFileSync(lcovPath, v, 'utf8');
    fs.writeFileSync(lcovPath + '.json', JSON.stringify(g.__coverage__, null, 2), 'utf8');
}

if (!__hash__.__hash__) __hash__.__hash__ = {};
__hash__ = __hash__.__hash__;
if (!__hash__['__filename__']) __hash__['__filename__'] = {
    s: __statements__,
    b: __branches__
};
__hash__ = __hash__['__filename__'];
