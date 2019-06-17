var messages = {
	EXTRACT : 'extract data',
	RETURN_EXTRACTED : 'return extracted',

	COPY : 'copy',
	NORMALIZED_DATA : 'normalized data',
	RM_UPDATED : 'research map is updated',

	SELECTED_ARTICLES : 'selected articles',

	SET_DEFAULT_MAP: 'set default map',
	DEFAULT_MAP_CHANGED: 'default map changed',

	EXTRACTED_TERMS_RESEARCH: 'extracted terms research',
	EXTRACTED_TERMS_CLUSTERS: 'extracted terms clusters',
	GET_TERMS: 'get terms'
};


var scholars = {
	google : {
		name            : "google",
		searchPath      : "/scholar?q=",
		getSearchString : () => {
			return document.getElementById("gs_hdr_tsi").value;
		},
		articleBlocksSelector : "#gs_res_ccl_mid > .gs_r.gs_or",
		articleSourceName     : "scholar",
		titleFieldSeclector   : (block) => {
			return block.getElementsByClassName("gs_rt")[0];
		},
		getBlockFilter : (id) => {
			return `a[href*=\\?cites\\=${id}],a[href*=\\?cluster\\=${id}]`;
		}
	},
	semantic : {
		name            : "semantic",
		searchPath      : "/search?q=",
		getSearchString : () => {
			return document.getElementsByClassName("input form-input")[0].value;
		},
		articleBlocksSelector : ".search-result",
		articleSourceName     : "ext-semantic-scholar",
		titleFieldSeclector   : (block) => {
			return block.getElementsByTagName("a")[0];
		},
		getBlockFilter : (id) => {
			return `a[data-heap-paper-id=${id}]`;
		}
	}
};

function makeDraggableElement(elem) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	if (document.getElementById(elem.id + "_draggable")) {
		/* if present, the header is where you move the DIV from:*/
		document.getElementById(elem.id + "_draggable").onmousedown = dragMouseDown;
	} else {
		/* otherwise, move the DIV from anywhere inside the DIV:*/
		elem.onmousedown = dragMouseDown;
	}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elem.style.top = (elem.offsetTop - pos2) + "px";
		elem.style.left = (elem.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
	}
}
