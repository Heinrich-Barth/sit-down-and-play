
/**
 * Handles highlighting of a company
 * 
 * It adds the css class
 * and also removes it after some time 
 * 
 */
class HighlightElement {

    constructor() { }

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

        let jCompany = jQuery(".company[data-company-id='" + sCompanyId + "']");

        /** avoid duplicate events */
        if (jCompany.hasClass("glowing-green"))
            return false;
        else
        {
            jCompany.addClass("glowing-green");
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
            jQuery(".company[data-company-id='" + _id + "']").removeClass("glowing-green");
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
};

/* accept custom event and trigger css animation */
document.body.addEventListener("meccg-highlight", function(e)
{
    new HighlightElement().init(e.detail);
}, false);

