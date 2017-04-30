
function a(fn: () => Promise<void>) {
	(async () => {
		await fn();
	})();
}

async function b(fn: () => void) {
	fn();
}

a(async function() {
	await b(function() {
		for (let i = 0; i < 1; i++) {
			a(async () => {
				await b(() => {
					let c = 1;
					while (c > 0) {
						a(async () => await b(() => console.log('the end!')));
						c--;
					}
				});
			});
		}
	})
});
