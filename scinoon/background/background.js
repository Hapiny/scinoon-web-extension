const BACKGROUND_DEBUG = true;

let sciTabsQuery = {
	url: [
		"http://127.0.0.1:9000/research/*",
		"http://localhost:9000/research/*",
		"https://scilocal.at.ispras.ru/research/*",
		"https://scigraph.at.ispras.ru/research/*",
		"https://scinoon.at.ispras.ru/research/*",
		"https://scinoon.com/research/*"
	]
};

function queryAddr(url) {
	let addr = "";
	if (url.search("semanticscholar") != -1 ) {
		addr = '/ext/';
	}	
	if (url.search("scholar.google") != -1 ) {
		addr = '/scholar/';
	}	
	return addr;
}

function onTermsExtractionError(jqXHR, textStatus, errorThrown) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: terms extraction error: " + textStatus + errorThrown);
	}
}

var sciserver = {
	saveAndProcessArticles : (articles, sender) => {
		// if (BACKGROUND_DEBUG) {
		// 	console.log("BG: extracted data from CONTENT arrive");
		// 	console.log(articles);
		// }
		browser.storage.local.get().then(data => {
			var base = data.origin;
			var id = sender.tab.id;
			var url = sender.url;
			$.ajax({
				type : "POST",
				url : base + queryAddr(url) + data.map,
				data : articles,
				success : function(data) {
					if (BACKGROUND_DEBUG) {
						console.log("BG: normalized data arrives");
					}
					browser.tabs.sendMessage(id, {
						name: messages.NORMALIZED_DATA,
						data: data
					});
				},
				error : function(jqXHR, textStatus, errorThrown) {
					if (BACKGROUND_DEBUG) {
						console.log("BG: normalized data error: " + textStatus + errorThrown);
					}
				},
				dataType : "json",
				contentType : "application/json"
			});
		});

	},
	saveResearchMap : (articles, callback, map) => {
		browser.storage.local.get().then(data => {
			var base = data.origin;
			map = typeof map !== 'undefined' ? map : data.map;
			if (map == null) {
				if (BACKGROUND_DEBUG) {
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
		});
	},
	getTermsFromResearch: (id) => {
		browser.storage.local.get().then( data => {
			var base = data.origin;
			$.ajax({
				type: "GET",
				url: base + '/research/' + data.map + '/terms/getFromResearch/' + data.topCount,
				success: function(data) {
					if (BACKGROUND_DEBUG) {
						console.log("BG: terms from research arrives")
						console.log(data);
					}
					browser.tabs.sendMessage(id, {
						name: messages.EXTRACTED_TERMS_RESEARCH,
						data: data
					});
				},
				error: onTermsExtractionError
			});
		}, onError);
	},
	getTermsFromClusters: function(id) {
		browser.storage.local.get().then(data => {
			var base = data.origin;
			$.ajax({
				type : "GET",
				url : base + '/research/' + data.map + '/terms/getFromClusters/' + data.topCount,
				success : function(data) {
					if (data.length == 0) {
						if (BACKGROUND_DEBUG) {
							console.log("BG: there are no terms from clusters")
						}
					} else {
						if (BACKGROUND_DEBUG) {
							console.log("BG: terms from cluster arrives");
							console.log(data);
						}
						browser.tabs.sendMessage(id, {
							name: messages.EXTRACTED_TERMS_CLUSTERS,
							data: data
						});
					}
				},
				error : onTermsExtractionError
			});
		}, onError);
	}
};

function onError(error) {
	if (BACKGROUND_DEBUG) {
		console.log(`BG: error ${error}`);
	}
}

function sendRmUpdatedToTabs(tabs) {
	for (let tab of tabs) {
		browser.tabs.sendMessage(tab.id, {name: messages.RM_UPDATED});
	}
}

function handleReturnExtracted(message, sender) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: extraction results arrive!");
	}
	sciserver.saveAndProcessArticles(JSON.stringify(message.data.articles), sender);
}

function handleSelectedArticles(message) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: selection received");
		console.log(message.data);
	}
	sciserver.saveResearchMap(JSON.stringify(message.data), function() {
		browser.tabs.query(sciTabsQuery).then(sendRmUpdatedToTabs, onError);
	});
}

// XXX Very similar to options.js#updateServerAndMap()
function handleSetDefaultMap(message) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: setting default map");
		console.log(message);
	}
	var newDefaultMap = message.data.map;
	var newDefaultOrigin = message.data.origin;

	if (newDefaultMap && newDefaultOrigin) {
		browser.storage.local.set(message.data);

		function forEachTabInTabs(tabs) {
			for (let tab of tabs) {
				browser.tabs.sendMessage(tab.id, {
					name: messages.DEFAULT_MAP_CHANGED,
					data: message.data
				});
			}
		}

		var querying = browser.tabs.query(sciTabsQuery);
		querying.then(forEachTabInTabs, onError);
	}
}

function handleGetTerms(sender) {
	sciserver.getTermsFromResearch(sender.tab.id);
	sciserver.getTermsFromClusters(sender.tab.id);
}

browser.runtime.onMessage.addListener(function(message, sender) {
	switch (message.name) {
		case messages.SET_DEFAULT_MAP:
			handleSetDefaultMap(message);
			break;
		case messages.SELECTED_ARTICLES:
			handleSelectedArticles(message);
			break;
		case messages.RETURN_EXTRACTED:
			handleReturnExtracted(message, sender);
			break;
		case messages.GET_TERMS:
			handleGetTerms(sender);
			break;
	}
});


browser.storage.local.get("map").then(data => {
	if (BACKGROUND_DEBUG) {
		console.log(browser.storage.local);
	}
	if (data.map == null) {
		browser.storage.local.set({map: "CERMINE"});
	}
}, onError);

browser.storage.local.get("origin").then(data => {
	if (data.origin == null) {
		browser.storage.local.set({origin: "https://scigraph.at.ispras.ru"});
	}
}, onError);

browser.storage.local.get("topCount").then(data => {
	if (data.topCount == null) {
		browser.storage.local.set({topCount: 20});
	}
}, onError);


// class SciServer {
// 	constructor(sciUrls) {
// 		this.sciUrls = sciUrls;
// 	}


// }