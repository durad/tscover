
function removeClass(e, cls) {
	var reg = new RegExp('(\\\\s|^)'+cls+'(\\\\s|$)');
	e.className = e.className.replace(reg,' ');
}

function addClass(e, cls) {
	e.className = e.className + ' ' + cls;
}

function selectFile(fileHash) {
	removeClass(document.querySelector('.filecontainer${projectHash}.active${projectHash}'), 'active${projectHash}');
	removeClass(document.querySelector('.filecontent${projectHash}.active${projectHash}'), 'active${projectHash}');
	addClass(document.querySelector('.filecontainer' + fileHash), 'active${projectHash}');
	addClass(document.querySelector('.filecontent' + fileHash), 'active${projectHash}');
}
