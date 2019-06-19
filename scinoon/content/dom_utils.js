function makeDraggableElement(elem) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	if (document.getElementById(elem.id + "_draggable")) {
        document.getElementById(elem.id + "_draggable")
            .onmousedown = dragMouseDown;  // if present, the header is where you move the DIV from
	} else {
		elem.onmousedown = dragMouseDown; // otherwise, move the DIV from anywhere inside the DIV
	}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position
		elem.style.top = (elem.offsetTop - pos2) + "px";
		elem.style.left = (elem.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		// stop moving when mouse button is released
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

function addBtn(btnField, btnClassList="btn btn-primary btn-sm add_to_rm_button", btnText="Loading...", check=true) {
    let btn = document.createElement("button");
    btn.type = "button";
    btn.className = btnClassList;
    btn.textContent = btnText;
    btn.style.marginTop = "10px";
    if (!btnField.querySelector(".flex-item.alternate-sources-dropdown")) {
        btn.style.marginLeft = "10px";
    }
    if (!btnField.querySelector(".add_to_rm_field") && check) {
        let bootstrapTag = document.createElement("div");
        bootstrapTag.className = "bootstrap";
        bootstrapTag.appendChild(btn);
        btnField.appendChild(bootstrapTag);
    }

}

function createTermsPanel() {
	if (document.getElementById("terms_panel") !== null) {
		return;
	}
	var termsPanel = document.createElement('div');
	termsPanel.className = "scholar_terms_panel bootstrap";
	termsPanel.id = "terms_panel"
	
	var titleBox = document.createElement('div');
	titleBox.textContent = "Terms from current research map";
	titleBox.className = "btn btn-lg btn-dark";
	titleBox.id = "terms_panel_draggable"
	
	var centerBtn = document.createElement("center");
	var openTermsBtn = document.createElement('div');
	openTermsBtn.id = "open-btn";
	openTermsBtn.textContent = "Show Terms";
	openTermsBtn.className = "btn btn-primary";
	openTermsBtn.style.display = "table-cell";

	centerBtn.appendChild(openTermsBtn);
	titleBox.appendChild(centerBtn);
	termsPanel.appendChild(titleBox);
	
	var termsBox = document.createElement('div');
	termsBox.id = "termsBox";
	termsBox.style.display = "none";
	termsBox.className = "scholar_terms_box";
	
	var researchTermsBox = document.createElement('div');
	researchTermsBox.id = "researchTermsBox";
	
	
	termsBox.appendChild(researchTermsBox);
	termsPanel.appendChild(termsBox);
	
	document.body.appendChild(termsPanel);
	openTermsBtn.addEventListener("click", () => {
		var termsBoxDisplay = $("#termsBox")[0].style.display;
		if (termsBoxDisplay === "none") {
			$("#termsBox")[0].style.display = "block";
			$("#open-btn")[0].innerText = "Close Terms";
		} else {
			$("#termsBox")[0].style.display = "none";
			$("#open-btn")[0].innerText = "Show Terms";
		}
	});
	makeDraggableElement(termsPanel);
}

function addTermsTitle(text, termsBox) {
	var title = document.createElement('p');
	title.innerHTML = `<center><h3>${text}</h3></center>`;
	termsBox.appendChild(title);
}

function addTermToList(term, termsList, searchString) {
	var li = document.createElement('li');
	li.innerHTML = 
		`<span>
			<a href='${baseLink + searchString + "+" + term}'>
				<img src='${browser.extension.getURL("/icons/add.png")}' alt='+' style='vertical-align: -25%'/>
			</a>
			&nbsp;
			<span class='term_text'>
				<a href='http://${hostname}${scholar.searchPath}${term}'>${term}</a>
			</span>
		</span>`;
	li.className = "term_list_item";
	termsList.appendChild(li);
}

function addTermsGroup(name, terms, termsBox, searchString) {
	var termsList = document.createElement('ul');
	termsList.className = "terms_list";
	addTermsTitle(name, termsBox);
	if (terms.length == 0) {
		var label = document.createElement('p');
		label.innerHTML = "<center><font size=2>There are no extracted terms for this group</font></center>";
		termsBox.appendChild(label);
	} else {
		for (let term of terms) {
			addTermToList(term, termsList, searchString);
		}
		termsBox.appendChild(termsList);
	}
}


function createAddButtons() {
	let articleBlocks = $(scholar.articleBlocksSelector);
	for (let index = 0; index < articleBlocks.length; index++) {
		addBtn(articleBlocks[index]);
	}
}

function addButtonOnArticlePage() {
	let btnField = document.querySelector(".flex-container.flex-wrap.flex-paper-actions-group");
	addBtn(btnField);
}