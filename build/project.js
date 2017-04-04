"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var crypto = require("crypto");
var typescript = require("typescript");
var source_1 = require("./source");
var ProjectInstrumenter = (function () {
    function ProjectInstrumenter() {
    }
    /**
     * Calculates a hash for a given array of source files
     * @param sources Array of source file nodes to calculate hash for
     */
    ProjectInstrumenter.prototype.calculateHash = function (sources) {
        var hash = crypto.createHash('md5');
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            hash.update(source.getFullText());
        }
        return '__' + hash.digest("hex").substring(0, 8) + '__';
    };
    /**
     * Main entry point into compilation process
     */
    ProjectInstrumenter.prototype.run = function () {
        var _this = this;
        // capture installed TypesScript compiler and its createProgram func
        var typescriptPath = require.resolve('typescript');
        var typescriptRoot = path.dirname(typescriptPath);
        var tscPath = path.join(typescriptRoot, 'tsc.js');
        var tscCode = fs.readFileSync(tscPath, 'utf8');
        tscCode = tscCode.replace(/ts.executeCommandLine\(ts\.sys\.args\)\;/, '// ts.executeCommandLine(ts.sys.args);');
        tscCode = '(function(require, __filename) { ' + tscCode + ' ;return ts; })';
        var ts = vm.runInThisContext(tscCode, { displayErrors: true })(require, tscPath);
        var createProgramOriginal = ts.createProgram;
        // capture runtime SyntaxKind values
        this.sk = vm.runInThisContext('(function(typescript) { return typescript.SyntaxKind })')(typescript);
        // hijack createProgram - main entry point into compilation process
        ts.createProgram = function (fileNames, compilerOptions, compilerHost) {
            var program;
            // call createProgram() and emit() with empty writer to trigger parsing of source files
            program = typescript.createProgram(fileNames, compilerOptions);
            program.emit(undefined, function (fileName, data, writeByteOrderMark, onError) { });
            var sources = program.getSourceFiles();
            _this.hash = _this.calculateHash(program.getSourceFiles());
            var covObjName = "__cov_" + _this.hash + "_";
            // getSourceFile gets syntax tree of the source file. We are hijacking this to insert instrumentaion logic
            var getSourceFileOriginal = compilerHost.getSourceFile;
            compilerHost.getSourceFile = function (fileName, languageVersion, onError) {
                var result = getSourceFileOriginal.apply(compilerHost, [fileName, languageVersion, onError]);
                var source = sources.filter(function (s) { return s.fileName == fileName; })[0];
                if (fileName.match(/\.ts$/) && !fileName.match(/\.d\.ts$/) && source) {
                    var instrumenter = new source_1.SourceInstrumenter(_this, fileName, source);
                    instrumenter.visit();
                    return ts.createSourceFile(fileName, instrumenter.instrumentedSource, languageVersion);
                }
                return result;
            };
            // call original createProgram() and emit() to trigger the whole process
            program = createProgramOriginal.apply(ts, [fileNames, compilerOptions, compilerHost]);
            program.emit(undefined, function (fileName, data, writeByteOrderMark, onError) { });
            return program;
        };
        ts.executeCommandLine(ts.sys.args);
    };
    return ProjectInstrumenter;
}());
exports.ProjectInstrumenter = ProjectInstrumenter;
