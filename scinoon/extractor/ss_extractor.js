class SSExtractor extends Extractor {
    constructor(name="google") {
        super(name);
    }

    extract(doc) {
        let extractedArticles = [];
		let articleBlocks = doc.getElementsByClassName("search-result");

		for(let block of articleBlocks) {
			let article = {
				ids : [], authors : []
			};
			let moreAuthorsButton = block.getElementsByClassName("more-authors-label")[0];
			// click to get full list of authors
			if (moreAuthorsButton) {
				moreAuthorsButton.click();
			}
			
			let authorsElements = block.getElementsByClassName("author-list__link");
			for(let elem of authorsElements) {
				let authorUrl = elem.getAttribute("href");
				let author = {
					fullName : elem.innerText, 
					ids : [{
						id  : authorUrl.split("/").pop(),
						src : window.location.hostname + authorUrl
					}]
				};
				article.authors.push(author);
			}
			
			moreAuthorsButton = block.getElementsByClassName("more-authors-label")[0];
			// hide list of authors
			if (moreAuthorsButton) {
				moreAuthorsButton.click();
			}
			
			let paperLink = block.getElementsByClassName("icon-button paper-link")[0];
			if(paperLink) {
                let isPdfAvailable = paperLink.getAttribute("data-heap-direct-pdf-link");
				article["textUrl"] = paperLink.getAttribute("href");
				if (isPdfAvailable === "true") {
					article["textType"] = "pdf";
				}
			}
			
			let titleElement = block.getElementsByClassName("search-result-title")[0];
			let info = {
				id  : titleElement.getElementsByTagName("a")[0].getAttribute("href").split('/').pop(),
				src : "semantic-scholar",
			};
			article.ids.push(info);
			article.title = titleElement.innerText;
			
			let yearField = block.querySelector('[data-selenium-selector="paper-year"]');
			if (yearField) {
				article.year = parseInt(yearField.innerText);
			}

			let moreAbstractButton = block.getElementsByClassName("more mod-clickable")[0];
			// click to get full abstract
			if (moreAbstractButton) {
				moreAbstractButton.click();
			}
			
			let abstractField = block.getElementsByClassName("abstract")[0];
			if (abstractField) {
				article.abstractText = abstractField.innerText.slice(0, -7);
			}
			// click to hide full abstract
			if (moreAbstractButton) {
				moreAbstractButton.click();
			}
			extractedArticles.push(article);
		}
		return extractedArticles;
    }
}