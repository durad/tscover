
import * as crypto from 'crypto';
import * as typescript from 'typescript';

export class Util {
	/**
	 * Calculates a hash for a given array of source files
	 * @param sources Array of source file nodes to calculate hash for
	 */
	static calculateHash(sources: ReadonlyArray<typescript.SourceFile>): string {
		let hash = crypto.createHash('md5');

		for (let source of sources) {
			hash.update(source.getFullText());
		}

		return '__' + hash.digest("hex").substring(0, 8) + '__';
	}
}
