// $(document).off(".data-api");

document.addEventListener("set default map", function(event) {
	console.log(event.detail);
	browser.runtime.sendMessage({
	    name: messages.SET_DEFAULT_MAP,
	    data: event.detail
	});
});

// TODO Actually the code below substitutes ping plugin behaviour.

// We need to listen for frontend request for cases when we will be executed BEFORE frontend would be ready to listen
document.addEventListener("request options", function() {
	browser.storage.local.get().then(data => {
		var event = new CustomEvent(messages.DEFAULT_MAP_CHANGED, {detail: data})
		document.dispatchEvent(event)
	});
});

// We need to send message to frontend for cases when it requests data BEFORE we ready to listen to such request
browser.storage.local.get().then(data => {
	var event = new CustomEvent(messages.DEFAULT_MAP_CHANGED, {detail: data})
	document.dispatchEvent(event)
});

browser.runtime.onMessage.addListener(function(message) {
	switch (message.name) {
		case messages.RM_UPDATED:
			// TODO Do not reload whole page
			console.log(message);
			location.reload();
			break;
		case messages.DEFAULT_MAP_CHANGED:
			// Forward message to frontend scripts
			var event = new CustomEvent(messages.DEFAULT_MAP_CHANGED, {detail: message.data})
			document.dispatchEvent(event)
	}
});
