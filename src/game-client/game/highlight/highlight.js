
/**
 * Handles highlighting of a company
 * 
 * It adds the css class
 * and also removes it after some time 
 * 
 */
class HighlightElement {

    /**
     * Check if the element may have the event
     * 
     * @param {String} sCompanyId 
     * @returns {Boolean} Success
     */
    addCss(sCompanyId)
    {
        if (sCompanyId === "")
            return false;

        let jCompany = document.getElementById("company_" + sCompanyId);

        /** avoid duplicate events */
        if (jCompany === null || jCompany.classList.contains("glowing-green"))
            return false;
        else
        {
            jCompany.classList.add("glowing-green");
            return true;
        }
    }

    /**
     * Start the timeout event to remove the class later
     * @param {String} sCompanyId 
     */
    startEvent(sCompanyId, nMillis)
    {
        if (nMillis < 1000)
            return;

        setTimeout(function()
        {
            let _id = sCompanyId;
            const elem = document.getElementById("company_" + _id);
            if (elem !== null)
                elem.classList.remove("glowing-green");

        }, nMillis)
    }

    /**
     * Create the event if possible 
     * 
     * @param {String} sCompanyId 
     */
    init(sCompanyId)
    {
        if (this.addCss(sCompanyId))
            this.startEvent(sCompanyId, 4100);
    }
}

(function() {
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/client/game/highlight/highlight.css?t=" + Date.now());
    document.head.appendChild(styleSheet);
})();

/* accept custom event and trigger css animation */
document.body.addEventListener("meccg-highlight", (e) => new HighlightElement().init(e.detail), false);
