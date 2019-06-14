document.addEventListener("DOMContentLoaded", function() {
	
	var scilocalTabsQuery = {url: ["http://*/research/*", "https://scigraph.at.ispras.ru/research/*"]};
	
	function onError(error) {
		console.log(`Error: ${error}`);
	}
	
	function updateServerAndMap() {
		
		function forEachTabInTabs(tabs) {
			browser.storage.local.get().then(data => {
				for (let tab of tabs) {
					browser.tabs.sendMessage(tab.id, {
						name: messages.DEFAULT_MAP_CHANGED,
						data: data
					});
				}
			});
		}
		
		var querying = browser.tabs.query(scilocalTabsQuery);
		querying.then(forEachTabInTabs, onError);
	}
	
	(function() {
		var mapElement = document.getElementById("mapInput");
		browser.storage.local.get("map").then(data => {
			mapElement.value = data.map;
		}, onError)
		mapElement.addEventListener("change", function() {
			console.log("changed to " + mapElement.value);
			// TODO provide better security
			browser.storage.local.set({map: mapElement.value});
			updateServerAndMap()
		});
	})();
	(function() {
		var serverElement = document.getElementById("serverInput");
		browser.storage.local.get("origin").then(data => {
			serverElement.value = data.origin
		}, onError)
		serverElement.addEventListener("change", function() {
			console.log("changed to " + serverElement.value);
			// TODO provide better security
			browser.storage.local.set({origin: serverElement.value});
			updateServerAndMap()
		});
	})();
	(function() {
		var topCountElement = document.getElementById("topCountInput");
		browser.storage.local.get("topCount").then(data => {
			topCountElement.value = data.topCount
		}, onError)
		topCountElement.addEventListener("change", function() {
			console.log("changed to " + topCountElement.value);
			// TODO provide better security
			browser.storage.local.set({topCount: topCountElement.value});
		});
	})();
	
	// (function() {
	// 	let icon = document.getElementById("icon");
	// 	icon.style.height = "64px";
	// 	icon.style.width = "64px";

	// 	let titleField = document.getElementById("icon-and-name-wrapper");
	// 	let nameSpan = titleField.getElementsByTagName("span")[0];
	// 	nameSpan.style.fontSize = "50px"; 
	// })();

	browser.runtime.onMessage.addListener(function(message) {
		if (message.name == messages.SET_DEFAULT_MAP) {
			console.log("SET_DEFAULT_MAP catched by options");
			document.getElementById("mapInput").value = message.data.map;
			document.getElementById("serverInput").value = message.data.origin;
		}
	});
})
