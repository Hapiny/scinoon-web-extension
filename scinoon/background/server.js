class SciServer {
	constructor(sciUrls, debug) {
        this.sciUrls = sciUrls;
		this.isDebug = debug;
	}

	queryAddr(url) {
		let addr = "";
		if (url.search("semanticscholar") !== -1 ) {
			addr = '/ext/';
		}	
		if (url.search("scholar.google") !== -1 ) {
			addr = '/scholar/';
		}	
		return addr;
	}

	onError(error) {
		if (this.isDebug) {
			console.log(`BG: error ${error}`);
		}
	}

	saveAndProcessArticles(articles, sender) {
		let verbose = this.isDebug;
		browser.storage.local.get().then(data => {
			var base = data.origin;
			var id = sender.tab.id;
			var url = sender.url;
			$.ajax({
				type : "POST",
				// url : base + this.queryAddr(url) + data.map,
				url : base + "/ext/" + data.map,
				data : articles,
				success : function(data) {
					if (verbose) {
						console.log("BG: normalized data arrives");
					}
					browser.tabs.sendMessage(id, {
						name: messages.NORMALIZED_DATA,
						data: data
					});
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if (verbose) {
						console.log("BG: normalized data error: " + textStatus + errorThrown);
					}
				},
				dataType : "json",
				contentType : "application/json"
			});
		}, this.onError);

	}

	saveResearchMap(articles, callback, map) {
		browser.storage.local.get().then(data => {
			let base = data.origin;
			map = typeof map !== 'undefined' ? map : data.map;
			if (map == null) {
				if (this.isDebug) {
					console.log("BG: warn! unsetted research map name.");
				}
				map = "demo";
			}
			$.ajax({
				type : "POST",
				url : base + '/research/' + map + '/save_articles',
				data : articles,
				success : callback,
				error : function(jqXHR, textStatus, errorThrown) {
					alert("BG: Data didn't save.")
				},
				contentType : "application/json"
			});
		}, this.onError);
	}

	getTermsFromResearch(id) {
		let verbose = this.isDebug;
		browser.storage.local.get().then(data => {
			let base = data.origin;
			$.ajax({
				type: "GET",
				url: base + '/research/' + data.map + '/terms/getFromResearch/' + data.topCount,
				success: function(data) {
					if (verbose) {
						console.log("BG: terms from research arrives")
						console.log(data);
					}
					browser.tabs.sendMessage(id, {
						name: messages.EXTRACTED_TERMS_RESEARCH,
						data: data
					});
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if (verbose) {
						console.log("BG: terms extraction error: " + textStatus + errorThrown);
					}
				}
			});
		}, this.onError);
	}

	getTermsFromClusters(id) {
		let verbose = this.isDebug;
		browser.storage.local.get().then(data => {
			var base = data.origin;
			$.ajax({
				type : "GET",
				url : base + '/research/' + data.map + '/terms/getFromClusters/' + data.topCount,
				success : function(data) {
					if (data.length == 0) {
						if (verbose) {
							console.log("BG: there are no terms from clusters")
						}
					} else {
						if (verbose) {
							console.log("BG: terms from cluster arrives");
							console.log(data);
						}
						browser.tabs.sendMessage(id, {
							name: messages.EXTRACTED_TERMS_CLUSTERS,
							data: data
						});
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if (verbose) {
						console.log("BG: terms extraction error: " + textStatus + errorThrown);
					}
				}
			});
		}, this.onError);
	}
}