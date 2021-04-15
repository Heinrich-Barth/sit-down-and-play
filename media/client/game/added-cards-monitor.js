
/**
 * Check for newly added cards to mark them
 * via CSS animation
 */
class CheckForCardsPlayed {

    constructor(sCardIdPrefix) 
    { 
        this.vsBefore = [];
        this.vsAfter = [];
        this.cardIdPrefix = sCardIdPrefix;
    }

    /**
     * Get all image ids inside a given container
     * 
     * @param {jQuery} jContainer 
     */
    getCards(jContainer)
    {
        let jList = [];

        jContainer.find("img").each(function()
        {
            let sId = jQuery(this).attr("data-uuid");
            if (typeof sId !== "undefined" && sId !== "")
                jList.push(sId);
        });

        return jList;
    }

    /**
     * Check for all cards
     * @param {jQuery} jContainer 
     */
    loadBefore(jContainer)
    {
        this.vsBefore = this.getCards(jContainer);
    }

    /**
     * Check for all cards
     * @param {jQuery} jContainer 
     */
    loadAfter(jContainer)
    {
        this.vsAfter = this.getCards(jContainer);
    }

    /**
     * Mark the newly added cards
     */
    mark()
    {
        this.markCards(this.identifyNewCards())
    }

    /**
     * Get all those cards that are available only in the "after" array
     * 
     * @returns {array} id list
     */
    identifyNewCards()
    {
        if (this.vsAfter.length === 0)
            return [];

        let vsNew = [];
        let nSize = this.vsAfter.length;
        for (var i = 0; i < nSize; i++)
        {
            if (!this.vsBefore.includes(this.vsAfter[i]))
                vsNew.push(this.vsAfter[i]);
        }

        return vsNew;
    }
    
    /**
     * Mark a list of cards by their IDs
     * 
     * @param {array} vsIds 
     */
    markCards(vsIds)
    {
        const nSize = vsIds.length;
        for (var i = 0; i < nSize; i++)
            CheckForCardsPlayed.markCard(this.cardIdPrefix + vsIds[i]);
    }

    /**
     * Mark a specific card by its id
     * @param {String} sId 
     */
    static markCard(sId)
    {
        let elem = document.getElementById(sId);
        if (elem !== null)
            jQuery(elem).addClass("card-highlight");
    }

};

/**
 * Check for company cards
 */
class CheckForCardsPlayedCompany extends CheckForCardsPlayed
{
    constructor(sCardIdPrefix) 
    { 
        super(sCardIdPrefix);
    }

    /**
     * Get all cards of a given company 
     * 
     * @param {jQuery} jContainer 
     */
    getCards(jContainer)
    {
        let jList = [];

        jContainer.find(".company-characters").each(function()
        {
            jQuery(this).find("img").each(function()
            {
                let sId = jQuery(this).attr("data-uuid");
                if (typeof sId !== "undefined" && sId !== "")
                    jList.push(sId);
            });
        });

        return jList;
    }
}