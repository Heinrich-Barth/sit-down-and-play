
const DeckbuilderApi =
{
    _allowUpdate : true,

    _deck : { },

    DECK_SIDEBOARD : "sideboard",
    DECK_CHARACTER : "character",
    DECK_CHARACTER2 : "chars",
    DECK_RESOURCE: "resource",
    DECK_RESOURCES: "resources",
    DECK_HAZARD: "hazard",
    DECK_HAZARDS: "hazards",
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
        if (this._deck[sTarget] === undefined || this._deck[sTarget][code] === undefined)
            return false;

        if (this._deck[sTarget][code].count === 1)
            delete this._deck[sTarget][code];
        else
            this._deck[sTarget][code].count--;
           
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

    onUpdateDeckName : function(e)
    {
        if (e === undefined || e.detail === undefined)
            return;

        const name = e.detail.trim();
        const pos = name.lastIndexOf(".");
        document.getElementById("deckname").value = pos < 1 ? name.trim() : name.substr(0, pos).trim();
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
        function getCardCount(pCard)
        {
            if (pCard !== undefined)
            {
                if (pCard.count !== undefined)
                    return pCard.count;
                else
                    return parseInt(pCard);
            }
            else
                return 0;
        }

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

        function addCardGroup(cardList, groupkey, target)
        {
            let nSize = 0;
            for (let key in cardList[groupkey])
            {
                let count = getCardCount(cardList[groupkey][key]);
                if (count < 1)
                    continue;
    
                const card = ViewCards.getCardFromCardCode(key);
                if (card === null)
                    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Cannot get " + groupkey + " card from code " + key }));
                else
                {
                    if (target !== "" && target !== undefined)
                        DeckbuilderApi.onInitAddCard(card, count, target);
                    else
                        doAddCard(card, count);

                    nSize += count;
                }
            }
    
            return nSize;
        }

        let size = 0;
        size += addCardGroup(cards, DeckbuilderApi.DECK_POOL, DeckbuilderApi.DECK_POOL);
        size += addCardGroup(cards, DeckbuilderApi.DECK_RESOURCE);
        size += addCardGroup(cards, DeckbuilderApi.DECK_RESOURCES);
        size += addCardGroup(cards, DeckbuilderApi.DECK_HAZARD);
        size += addCardGroup(cards, DeckbuilderApi.DECK_HAZARDS);
        size += addCardGroup(cards, DeckbuilderApi.DECK_CHARACTER);
        size += addCardGroup(cards, DeckbuilderApi.DECK_CHARACTER2);
        size += addCardGroup(cards, DeckbuilderApi.DECK_AVATAR, DeckbuilderApi.DECK_AVATAR);
        size += addCardGroup(cards, DeckbuilderApi.DECK_SIDEBOARD, DeckbuilderApi.DECK_SIDEBOARD);
        
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

document.getElementById("save_deck").onclick = function()
{
    let sName = document.getElementById("deckname").value;
    if (sName === null || sName === undefined || sName === "")
        sName = "Your deck";
    else
        sName = sName.trim();

    const data = {
        data: DeckbuilderApi._deck,
        name : sName
    };

    document.body.dispatchEvent(new CustomEvent("meccg-saveas-deck", { "detail": data}));
};

document.body.addEventListener("meccg-deckbuilder-load-deck", DeckbuilderApi.onLoadDeck, false);

document.body.addEventListener("meccg-deckbuilder-add-to-deck", DeckbuilderApi.onAdd, false);
document.body.addEventListener("meccg-deckbuilder-remove-from-deck", DeckbuilderApi.onRemove, false);
document.body.addEventListener("meccg-file-dropped-name", DeckbuilderApi.onUpdateDeckName, false);
document.body.addEventListener("meccg-file-dropped", DeckbuilderApi.onLoadDeck, false);
