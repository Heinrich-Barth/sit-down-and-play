
const DeckbuilderApi =
{
    _allowUpdate : true,

    _deck : { },

    DECK_SIDEBOARD : "sideboard",
    DECK_CHARACTER : "character",
    DECK_RESOURCE: "resource",
    DECK_HAZARD: "hazard",
    DECK_AVATAR : "avatar",
    DECK_POOL : "pool",

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
    
    onInitAddCard : function(card, count, target)
    {
        for (var i = 0; i < count; i++)
        {
            this._count++;
            if (DeckList.addToDeck(card.code, target))
                this.add(target, card)
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
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_CHARACTER);
                else if (card.Secondary === DeckbuilderApi.DECK_AVATAR)
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_AVATAR);
                else
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_SIDEBOARD);
            }
            else if (card.type === "Resource")
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_RESOURCE);
            else if (card.type === "Hazard")
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_HAZARD);
            else
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_SIDEBOARD);
        }

        var size = cards["size"];
        var count, card;
        for (var key in cards[DeckbuilderApi.DECK_POOL])
        {
            count = cards[DeckbuilderApi.DECK_POOL][key].count;
            
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get pool card from code " + key);
            else
                this.onInitAddCard(card, count, DeckbuilderApi.DECK_POOL);
        }
        
        for (var key in cards[DeckbuilderApi.DECK_RESOURCE])
        {
            count = cards[DeckbuilderApi.DECK_RESOURCE][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get resource card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards[DeckbuilderApi.DECK_HAZARD])
        {
            count = cards[DeckbuilderApi.DECK_HAZARD][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get hazard card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards[DeckbuilderApi.DECK_CHARACTER])
        {
            count = cards[DeckbuilderApi.DECK_CHARACTER][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get character card from code " + key);
            else
                doAddCard(card, count);
        }
        for (var key in cards[DeckbuilderApi.DECK_AVATAR])
        {
            count = cards[DeckbuilderApi.DECK_AVATAR][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null)
                Notify.error("Cannot get avatar card from code " + key);
            else
                this.onInitAddCard(card, count, DeckbuilderApi.DECK_AVATAR)
        }
        
        for (var key in cards[DeckbuilderApi.DECK_SIDEBOARD])
        {
            count = cards[DeckbuilderApi.DECK_SIDEBOARD][key].count;
            card = ViewCards.getCardFromCardCode(key);
            if (card === null) 
                Notify.error("Cannot get sideboard card from code " + key);
            else            
                this.onInitAddCard(card, count, DeckbuilderApi.DECK_SIDEBOARD)
        }
        
        return size;
    },
}

let g_bKeyIsCtrl = false;

document.addEventListener('keyup', (e) => g_bKeyIsCtrl = false);
document.addEventListener('keydown', function(e)
{
    if (e.keyCode == 17) 
    {
        e.preventDefault();
        g_bKeyIsCtrl = true;
    }

	if (e.keyCode == 83 && g_bKeyIsCtrl)
    {
        g_bKeyIsCtrl = false;
        e.preventDefault();
        onSaveDeck();
	}
});

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
