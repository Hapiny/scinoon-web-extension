class SciServer {
	constructor(sciUrls, debug) {
        this.sciUrls = sciUrls;
		this.isDebug = debug;
	}

	onError(error) {
		if (this.isDebug) {
			console.log(`BG: error ${error}`);
		}
	}

	saveAndProcessArticles(articles, sender, message) {
		let verbose = this.isDebug;
		let response = undefined;
		browser.storage.local.get().then(data => {
			var base = data.origin;
			var id = sender.tab.id;
			let makeRequest = (articles) => {
				let isSuccess = true;
				$.ajax({
					type : "POST",
					url : base + "/ext/" + message.data.map,
					data : articles,
					async: false,
					success : function(data) {
						if (verbose) {
							console.log("BG: normalized data arrives");
						}
						isSuccess = data;
					},
					error : function(jqXHR, textStatus, errorThrown) {
						if (jqXHR.status === 413) {
							articles = JSON.parse(articles);
							let lenHalf = (articles.length / 2 >> 0) + 1;
							if (verbose) {
								console.log(`BG: too many articles (${articles.length})`);
							}
							isSuccess = []; 
							for (let i of [0, 1]) {
								let response = makeRequest(JSON.stringify(articles.slice(i * lenHalf, (i + 1) * lenHalf)));
								if (typeof response !== "boolean") {
									isSuccess.push(...response);
								} else {
									isSuccess = true;
									break;
								}
							}
						}
					},
					dataType : "json",
					contentType : "application/json"
				});
				return isSuccess;
			}

			response = makeRequest(articles);
			if (typeof response !== "boolean") {
				browser.tabs.sendMessage(id, {
					name: messages.NORMALIZED_DATA,
					data: response,
					map : message.data.map,
				});
			} else if (verbose) {
				console.log("BG: normalized data error: ");
			}

		}, this.onError);

	}

	saveResearchMap(articles, callback, map) {
		let verbose = this.isDebug;
		browser.storage.local.get().then(data => {
			let base = data.origin;
			map = typeof map !== 'undefined' ? map : data.map;
			if (map == null) {
				if (verbose) {
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