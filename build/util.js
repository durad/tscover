"use strict";
var crypto = require("crypto");
var Util = (function () {
    function Util() {
    }
    /**
     * Calculates a hash for a given array of source files
     * @param sources Array of source file nodes to calculate hash for
     */
    Util.calculateHash = function (sources) {
        var hash = crypto.createHash('md5');
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            hash.update(source.getFullText());
        }
        return '__' + hash.digest("hex").substring(0, 8) + '__';
    };
    return Util;
}());
exports.Util = Util;
