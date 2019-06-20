function parseArticleOnPage() {
    let article = {};
    article.ids = [{
        id : window.location.href.split("/").slice(-1)[0],
        src : "semantic-scholar"
    }];
    let articleHeader = document.getElementById("paper-header");

    let moreAuthorsBtn = articleHeader.querySelector(".more-authors-label");
    if (moreAuthorsBtn) {
        moreAuthorsBtn.click();
    }

    let authorsField = articleHeader.getElementsByClassName("author-list__link author-list__author-name");
    article.authors = [];
    if (authorsField.length) {
        for (let author of authorsField) {
            let authorRef = author.getAttribute("href");
            article.authors.push({
                fullName : author.innerText,
                ids : [{
                    id : authorRef.split("/").pop(),
                    src : window.location.hostname + authorRef
                }],
            });
        }
    }

    moreAuthorsBtn = articleHeader.querySelector(".more-authors-label");
    if (moreAuthorsBtn) {
        moreAuthorsBtn.click();
    }

    let doiField = articleHeader.querySelector('[data-selenium-selector="paper-doi"]');
    if (doiField) {
        article.doi = doiField.innerText;
    }
    let articleTitleField = document.querySelector('[data-selenium-selector="paper-detail-title"]');
    if (articleTitleField) {
        article.title = articleTitleField.innerText;
    }

    let yearField = articleHeader.querySelector('[data-selenium-selector="paper-year"]');
    if (yearField) {
        article.year = parseInt(yearField.innerText);
    }

    let moreAbstractBtn = articleHeader.querySelector('[data-selenium-selector="text-truncator-toggle"]');
    if (moreAbstractBtn) {
        moreAbstractBtn.click();
    }

    let abstractField = articleHeader.getElementsByClassName("text-truncator abstract__text text--preline");
    if (abstractField.length) {
        article.abstractText = abstractField[0].innerText.slice(0, -5);
    }
    
    if (moreAbstractBtn) {
        moreAbstractBtn.click();
    }
    let result = [];
    result.push(article);
    return result;
}