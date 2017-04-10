
interface TSCover {
	/**
	 * Gets coverage data from current session in LCOV format.
	 * @param pathRepam If present its `from` and `to` properties are used to remap file paths in LCOV file.
	 * @returns LCOV data as a string.
	 */
	generateLcov(pathRemap?: { from: string | RegExp, to: string }): string;

	/**
	 * Saves coverage data in LCOV format to disk.
	 * @param lcovPath Path of the LCOV file. Defaults to lcov.info.
	 * @param pathRepam If present its `from` and `to` properties are used to remap file paths in LCOV file.
	 */
	saveLcov(lcovPath: string, pathRemap?: { from: string, to: string });
}

/**
 * Global coverate object used access code coverage functionality.
 */
export declare var __coverage__: TSCover;
