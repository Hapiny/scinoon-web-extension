const DEBUG = true;

const scilocalTabsQuery = {
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
	let resultAddr = "";
	if (url.search("semanticscholar") !== -1) {
		resultAddr = "/ext/";
	}	
	else if (url.search("scholar.google") !== -1) {
		resultAddr = "/scholar/";
	}
	return resultAddr;
}

var sciserver = function() {


	return {
		saveAndProcessArticles : (articles, sender) => {
			browser.storage.local.get().then(data => {
				let base = data.origin;
				let id = sender.tab.id;
				let url = sender.url;
				
				if (DEBUG) {
					console.log("Result request URL: ", base + queryAddr(url) + data.map);
				}

				$.ajax({
					type    : "POST",
					url     : base + queryAddr(url) + data.map,
					data    : articles,
					success : (data) => {
						if (DEBUG) {
							console.log(messages.success.NORMALIZED_DATA);
							console.log(data);
						}

						browser.tabs.sendMessage(id, {
							name : messages.success.NORMALIZED_DATA,
							data : data
						});
					},
					// TODO Show error message in popup
					error       : messages.error.NORMALIZED_ERROR.info,
					dataType    : "json",
					contentType : "application/json"
				});
			});

		},

		saveResearchMap : (articles, callback, map) => {
			browser.storage.local.get().then(data => {
				let base = data.origin;
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

		getTermsFromResearch : (id) => {
			browser.storage.local.get().then( data => {
				var base = data.origin;
				$.ajax({
					type: "GET",
					url: base + '/research/' + data.map + '/terms/getFromResearch/' + data.topCount,
					success: (data) => {
						if (DEBUG) {
							console.log(messages.success.EXTRACTED_TERMS_RESEARCH);
							console.log(JSON.stringify(data));
						}
						browser.tabs.sendMessage(id, {
							name: messages.success.EXTRACTED_TERMS_RESEARCH,
							data: data
						});
					},
					error: messages.error.EXTRACTED_TERMS_ERROR.info,
				});
			}, onError);
		},
		getTermsFromClusters: (id) => {
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
								name: messages.success.EXTRACTED_TERMS_CLUSTERS,
								data: data
							});
						}
					},
					error : messages.error.EXTRACTED_TERMS_ERROR.info,
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
		browser.tabs.sendMessage(tab.id, {name: messages.success.RM_UPDATED});
	}
}

function handleReturnExtracted(message, sender) {
	if (DEBUG) {
		console.log("extraction results arrive");
	}
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

browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.name) {
		case messages.success.SET_DEFAULT_MAP:
			handleSetDefaultMap(message);
			break;
		case messages.success.SELECTED_ARTICLES:
			handleSelectedArticles(message);
			break;
		case messages.success.RETURN_EXTRACTED:
			handleReturnExtracted(message, sender);
			break;
		case messages.success.GET_TERMS:
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
