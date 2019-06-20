class Extractor {
	constructor(name, blockSelector, verbose=false) {
		this.name = name;
		this.blockSelector = blockSelector;
		this.blocks = document.querySelectorAll(this.blockSelector);
		this.verbose = verbose;
		
		if (verbose) {
			console.log(`EXTRACTOR (${name}): block selector = ${blockSelector}`);
			if (this.blocks.length) {
				console.log(`EXTRACTOR (${name}): selected ${this.blocks.length} blocks`)
			} else {
				console.log(`EXTRACTOR (${name}): there are no blocks to select; (document state = ${document.readyState})`);
			}
		}
	}

	// in inherited classes extract method must be overloaded
	extract(doc) {
		let result = [];
		return result;
	};

	getBlocks(blockSelector=this.blockSelector) {
		this.blocks = document.querySelectorAll(blockSelector);
		return this.blocks;
	}

	getTitle(block, titleSelector) {
		let titleField = block.querySelector(titleSelector);
		let title = "empty title";
		if (!titleField && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): title isn't extracted`);
		} else if (this.verbose) {
			title = titleField.innerText;
			console.log(`EXTRACTOR (${this.name}): extracted title = ${title.slice(0, 30)}...`);
		}
		return title;
	}
	
	getYear(block, yearSelector) {
		let yearField = block.querySelector(yearSelector);
		let year = 2000;
		if (!yearField && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): year isn't extracted`);
		} else if (this.verbose) {
			year = parseInt(yearField.innerText);
			console.log(`EXTRACTOR (${this.name}): extracted year = ${year}`);
		}
		return year;
	}
	
	getAbstract(block, abstractSelector) {
		let abstractField = block.querySelector(abstractSelector);
		let abstract = "emtpy abstract";
		if (!abstractField && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): abstract isn't extracted`);			
		} else if (this.verbose) {
			abstract = abstractField.innerText;
			console.log(`EXTRACTOR (${this.name}): extracted abstract = ${abstract.slice(0, 30)}...`);			
		}
		return abstract;
	}
	
	getAuthors(block, authotsSelector) {
		let authorsElements = block.querySelectorAll(authotsSelector);
		if (!authorsElements.length && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): authors aren't extracted`);			
		} else if (this.verbose) {
			console.log(`EXTRACTOR (${this.name}): authors extracted`);			
		}
		return authorsElements;
	}
	
	getTextLink(block, textLinkSelector) {
		let textLinkField = block.querySelector(textLinkSelector);
		let textLink = "";
		if (!textLinkField && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): text link isn't extracted`);			
		} else if (this.verbose) {
			textLink = textLinkField.getAttribute("href");
			console.log(`EXTRACTOR (${this.name}): extracted text link = ${textLink}`);			
		}
		return textLink;
	}
	
	getTextType(block, textTypeSelector) {
		let textTypeField = block.querySelector(textTypeSelector);
		if (!textTypeField && this.verbose) {
			console.log(`EXTRACTOR (${this.name}): text type isn't extracted`);			
		} else if (this.verbose) {
			console.log(`EXTRACTOR (${this.name}): text type extracted`);
		}
		return textTypeField;
	}
}