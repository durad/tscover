"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var typescript = require("typescript");
var util_1 = require("./util");
var source_1 = require("./source");
var ProjectInstrumenter = (function () {
    function ProjectInstrumenter() {
    }
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
            _this.hash = util_1.Util.calculateHash(program.getSourceFiles());
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
