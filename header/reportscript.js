
function removeClass(e, cls) {
	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
	e.className = e.className.replace(reg,' ');
}

function addClass(e, cls) {
	e.className = e.className + ' ' + cls;
}

function selectFile(fileHash) {
	removeClass(document.querySelector('.filecontainer__projectHash__.active__projectHash__'), 'active__projectHash__');
	removeClass(document.querySelector('.filecontent__projectHash__.active__projectHash__'), 'active__projectHash__');
	addClass(document.querySelector('.filecontainer' + fileHash), 'active__projectHash__');
	addClass(document.querySelector('.filecontent' + fileHash), 'active__projectHash__');
}
