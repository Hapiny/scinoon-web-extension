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
		articleBlocksSelector : "#gs_res_ccl_mid > .gs_r.gs_or.gs_scl",
		articleSourceName     : "ext-google-scholar",
		titleFieldSeclector   : (block) => {
			return block.getElementsByClassName("gs_rt")[0];
		},
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
			return block.querySelector(".search-result-title");
		},
	},
	arxiv : {
		name            : "arxiv",
		searchPath      : "/search/?searchtype=all&source=header&query=",
		getSearchString : () => {
			let searchString = document.getElementById("query");
			if (searchString) {
				return searchString.value;
			}
		},
		articleBlocksSelector : ".arxiv-result",
		articleSourceName     : "ext-arxiv",
		titleFieldSeclector   : (block) => {
			return block.querySelector(".title.mathjax");
		},
	},
	pubmed : {
		name            : "pubmed",
		searchPath      : "/pubmed/?term=",
		getSearchString : () => {
			let searchString = document.getElementById("term");
			if (searchString) {
				return searchString.value;
			}
		},
		articleBlocksSelector : "div.rslt",
		articleSourceName     : "ext-pubmed",
		titleFieldSeclector   : (block) => {
			return block.querySelector("p.title");
		},
	},
};