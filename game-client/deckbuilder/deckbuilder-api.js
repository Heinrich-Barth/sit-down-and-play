
const DeckbuilderApi =
{
    _allowUpdate : true,

    _deck : { },

    onAdd : function(e)
    {
        const sTarget = e.detail.target;
        const pCard = ViewCards.config.jsonData[e.detail.index];
        if (DeckbuilderApi.add(sTarget, pCard))
        {
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-add-to-decklist", { "detail": e.detail })); /** update the deck list view */
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-update-bubble", { "detail": { index: e.detail.index, count: pCard.count } })); /** update the deck list view */
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-update-summary", { "detail": { } })); /** update the deck list view */
        }
    },

    add : function(sTarget, jsonCard)
    {
        if (jsonCard === null || jsonCard === undefined)
            return false;

        if (this._deck[sTarget] === undefined)
            this._deck[sTarget] = { };

        if (this._deck[sTarget][jsonCard.code] === undefined)
        {
            this._deck[sTarget][jsonCard.code] = {
                target : sTarget,
                code : jsonCard.code,
                type : jsonCard.type,
                count : 1
            }
        }
        else if (this._deck[sTarget][jsonCard.code].count > jsonCard.limit)
            return false;
        else
           this._deck[sTarget][jsonCard.code].count++;

        if (jsonCard.count > 0)
            jsonCard.count--;

        return true;
    },

    onRemove : function(e)
    {
        const sTarget = e.detail.target;
        const pCard = ViewCards.config.jsonData[e.detail.index];
        if (DeckbuilderApi.remove(sTarget, pCard))
        {
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-update-bubble", { "detail": { index: e.detail.index, count: pCard.count } })); /** update the deck list view */
            document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-update-summary", { "detail": { } })); /** update the deck list view */
        }
    },
    
    remove : function(sTarget, jsonCard)
    {
        const code = jsonCard.code
        if (this._deck[sTarget] === undefined || this._deck[sTarget][jsonCard.code] === undefined)
            return false;

        if (this._deck[sTarget][jsonCard.code].count === 1)
            delete this._deck[sTarget][jsonCard.code];
        else
            this._deck[sTarget][jsonCard.code].count--;
           
        if (jsonCard.count < jsonCard.limit)
            jsonCard.count++;

        return true;
    },
    
    addToPool : function(code)
    {
        return this.add("pool", code);
    },

    addToDeckHazard : function(code)
    {
        return this.add("hazard", code);
    },
    addToDeckResources : function(code)
    {
        return this.add("resource", code);
    },
    addToDeckCharacters : function(code)
    {
        return this.add("character", code);
    },
    addToDeckAvatar : function(code)
    {
        return this.add("avatar", code);
    },

    addToSideboard : function(code)
    {
        return this.add("sb", code);
    },
    
    onRetreiveDeckName : function(name)
    {
        document.getElementById("deck_name").innerHTML = "Deck";
    },
    
    onInitAddCard : function(card, count, target)
    {
        for (var i = 0; i < count; i++)
        {
            this._count++;
            if (DeckList.addToDeck(card.code, target))
                card.count--;
        }
    },

    _count : 0,
    
    loadDeckName : function()
    {
        return "";
    },

    onLoadDeck : function(e)
    {
        if (e === undefined)
            return;

        const jDeck = e.detail;
        if (jDeck !== undefined)
        {
            DeckbuilderApi._deck = {};
            DeckbuilderApi._count = 0;

            /** necessary to update the counters again to remove previous deck stats */
            DeckList.removeExisting();
            ViewCards.resetCounter();
            DeckbuilderApi.initAddCards(jDeck);
        }
    },
    
    initAddCards : function(cards)
    {

        function doAddCard(card, count)
        {
            if (card.type === "Character")
            {
                if (card.Secondary === "Character")
                    DeckbuilderApi.onInitAddCard(card, count, "chars");
                else if (card.Secondary === "Avatar")
                    DeckbuilderApi.onInitAddCard(card, count, "avatar");
                else
                    DeckbuilderApi.onInitAddCard(card, count, "sb");
            }
            else if (card.type === "Resource")
                DeckbuilderApi.onInitAddCard(card, count, "resource");
            else if (card.type === "Hazard")
                DeckbuilderApi.onInitAddCard(card, count, "hazard");
            else
                DeckbuilderApi.onInitAddCard(card, count, "sb");
        }

        var size = cards["size"];
        var count, card;
        for (var key in cards["pool"])
        {
            count = cards["pool"][key].count;
            
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get pool card from code " + key);
            else
                this.onInitAddCard(card, count, "pool");
        }
        
        for (var key in cards["resources"])
        {
            count = cards["resources"][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get resource card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards["hazards"])
        {
            count = cards["hazards"][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get hazard card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards["chars"])
        {
            count = cards["chars"][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get character card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards["avatar"])
        {
            count = cards["avatar"][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get avatar card from code " + key);
            else
                this.onInitAddCard(card, count, "avatar")
        }
        
        for (var key in cards["sideboard"])
        {
            count = cards["sideboard"][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null) 
                Notify.error("Cannot get sideboard card from code " + key);
            else            
                this.onInitAddCard(card, count, "sb")
        }
        
        return size;
    },
}

async function onSaveDeck()
{
    const fileHandle = await window.showSaveFilePicker({
        excludeAcceptAllOption: true,
        multiple: false,          
        types: [
            {
                description: "Deck Files",
                accept: {
                 'application/json': ['.meccg']
                }
            }
        ]
    });
    
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(DeckbuilderApi._deck, null, "\t"));
    await writable.close();

    document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Deck saved." }));
}

/**             
 */
(function()
{
    document.getElementById("save_deck").onclick = onSaveDeck;
})();

document.body.addEventListener("meccg-deckbuilder-load-deck", DeckbuilderApi.onLoadDeck, false);
document.body.addEventListener("meccg-deckbuilder-add-to-deck", DeckbuilderApi.onAdd, false);
document.body.addEventListener("meccg-deckbuilder-remove-from-deck", DeckbuilderApi.onRemove, false);
