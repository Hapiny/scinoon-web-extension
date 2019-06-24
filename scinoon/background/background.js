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
let sciserver = new SciServer(sciTabsQuery, BACKGROUND_DEBUG);

function sendRmUpdatedToTabs(tabs) {
	for (let tab of tabs) {
		browser.tabs.sendMessage(tab.id, {name: messages.RM_UPDATED});
	}
}

function handleReturnExtracted(message, sender) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: extraction results arrive!");
	}
	sciserver.saveAndProcessArticles(JSON.stringify(message.data.articles), sender, message);
}

function handleSelectedArticles(message) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: selection received");
		console.log(message.data);
	}
	sciserver.saveResearchMap(
		JSON.stringify(message.data), 
		function() {
			browser.tabs.query(sciTabsQuery).then(sendRmUpdatedToTabs,sciserver.onError);
		},
		message.map
	);
}

function handleSetDefaultMap(message) {
	if (BACKGROUND_DEBUG) {
		console.log("BG: setting default map");
		console.log(message);
	}
	let newDefaultMap = message.data.map;
	let newDefaultOrigin = message.data.origin;

	if (newDefaultMap && newDefaultOrigin) {
		let newUrl = newDefaultOrigin + "/" + newDefaultMap;
		browser.storage.local.set(message.data);
		browser.storage.local.get("anotherMaps").then(data => {
			let anotherMaps = data.anotherMaps;
			if (anotherMaps.indexOf(newUrl) === -1) {
				let newMaps = [newUrl];
				newMaps.push(...anotherMaps);
				browser.storage.local.set({anotherMaps: newMaps.slice(0, maxCountOfMaps)});
			}
		});
		

		function forEachTabInTabs(tabs) {
			for (let tab of tabs) {
				browser.tabs.sendMessage(tab.id, {
					name: messages.DEFAULT_MAP_CHANGED,
					data: message.data
				});
			}
		}

		var querying = browser.tabs.query(sciTabsQuery);
		querying.then(forEachTabInTabs, sciserver.onError);
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

let maxCountOfMaps = 3;
let defaultMap = "CERMINE";
let defaultServer = "https://scigraph.at.ispras.ru";

browser.storage.local.get("map").then(data => {
	if (data.map == null) {
		browser.storage.local.set({map: defaultMap});
	}
}, sciserver.onError);

browser.storage.local.get("origin").then(data => {
	if (data.origin == null) {
		browser.storage.local.set({origin: defaultServer});
	}
}, sciserver.onError);

browser.storage.local.get("topCount").then(data => {
	if (data.topCount == null) {
		browser.storage.local.set({topCount: 20});
	}
}, sciserver.onError);

browser.storage.local.get("anotherMaps").then(data => {
	if (data.anotherMaps == null) {
		browser.storage.local.set({anotherMaps: [defaultServer + "/" + defaultMap]});
	}
}, sciserver.onError);