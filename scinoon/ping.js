// ==UserScript==
// @name Possibility to ping plugin from research maps and profiles.
// @include http://*:9000/research/*
// @include https://scilocal.at.ispras.ru/research/*
// ==/UserScript==

document.addEventListener("Ping plugin", function(event) {
	var version = browser.runtime.getManifest().version;
	document.dispatchEvent(new CustomEvent("Plugin enabled", {'detail': version}));
});