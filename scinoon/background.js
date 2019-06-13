var scilocalTabsQuery = {url: ["http://127.0.0.1:9000/research/*",
							   "http://localhost:9000/research/*",
							   "https://scilocal.at.ispras.ru/research/*",
							   "https://scigraph.at.ispras.ru/research/*",
							   "https://scinoon.at.ispras.ru/research/*",
							   "https://scinoon.com/research/*"]};

function queryAddr(url) {
	var addr = "";
	if (url.search("semanticscholar")!= -1 ) {
		addr = '/ext/';
	}	
	if (url.search("scholar.google")!= -1 ) {
		addr = '/scholar/';
	}	
	return addr;
}

var sciserver = function() {

	function onTermsExtractionError(jqXHR, textStatus, errorThrown) {
		console.log("terms extraction error: " + textStatus
				+ errorThrown);
	}

	return {
		saveAndProcessArticles : function(articles, sender) {
			browser.storage.local.get().then(data => {
				console.log(data);
				var base = data.origin;
				var id = sender.tab.id;
				var url = sender.url;
				$.ajax({
					type : "POST",
					url : base + queryAddr(url) + data.map,
					data : articles,
					success : function(data) {
						console.log("normalized data arrives: " + data);
						// TODO PERF: Avoid conversion to/from text
						browser.tabs.sendMessage(id, {
							name: messages.NORMALIZED_DATA,
							data: data
						});
					},
					error : function(jqXHR, textStatus, errorThrown) {
						console.log("normalized data error: " + textStatus
								+ errorThrown);
						// TODO Show error message in popup
					},
					dataType : "json",
					contentType : "application/json"
				});
			});

		},
		saveResearchMap : function(articles, callback, map) {
			browser.storage.local.get().then(data => {
				var base = data.origin;
				map = typeof map !== 'undefined' ? map : data.map;
				if (map == null) {
					console.log("warn! unsetted research map name.");
					map = "default";
				}
				$.ajax({
					type : "POST",
					url : base + '/research/' + map + '/save_articles',
					data : articles,
					success : callback,
					error : function(jqXHR, textStatus, errorThrown) {
						alert("Data didn't save.")
					},
					contentType : "application/json"
				});
			});
		},
		getTermsFromResearch: function(id) {
			browser.storage.local.get().then( data => {
				var base = data.origin;
				$.ajax({
					type: "GET",
					url: base + '/research/' + data.map + '/terms/getFromResearch/' + data.topCount,
					success: function(data) {
						console.log("terms from research arrives: " + data)
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
							console.log("there are no terms from clusters")
						} else {
							console.log("terms from cluster arrives: " + data);
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
};

function onError(error) {
	console.log(`Error: ${error}`);
}

function sendRmUpdatedToTabs(tabs) {
	for (let tab of tabs) {
		browser.tabs.sendMessage(tab.id, {name: messages.RM_UPDATED});
	}
}

function handleReturnExtracted(message, sender) {
	console.log("extraction results arrive!");
	sciserver().saveAndProcessArticles(JSON.stringify(message.data.articles), sender);
}

function handleSelectedArticles(message) {
	console.log("selection received in BG");
	console.log(message.data);
	sciserver().saveResearchMap(JSON.stringify(message.data), function() {
		browser.tabs.query(scilocalTabsQuery).then(sendRmUpdatedToTabs, onError);
	});
}

// XXX Very similar to options.js#updateServerAndMap()
function handleSetDefaultMap(message) {
	console.log(message);
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

		var querying = browser.tabs.query(scilocalTabsQuery);
		querying.then(forEachTabInTabs, onError);
	}
}

function handleGetTerms(sender) {
	sciserver().getTermsFromResearch(sender.tab.id);
	sciserver().getTermsFromClusters(sender.tab.id);
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
	if (data.map == null) {
		browser.storage.local.set({map: "default"});
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
