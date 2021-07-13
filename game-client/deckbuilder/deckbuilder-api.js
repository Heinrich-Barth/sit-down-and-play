
const DeckbuilderApi =
{
    _allowUpdate : true,

    _deck : { },

    add : function(sTarget, jsonCard)
    {
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
        else
            this._deck[sTarget][jsonCard.code].count++;

        return true;
    },
    
    remove : function(sTarget, code)
    {
        if (this._deck[sTarget] === undefined || this._deck[sTarget][code] === undefined)
            return false;

        if (this._deck[sTarget][code].count === 1)
            delete this._deck[sTarget][code];
        else
            this._deck[sTarget][code].count--;
            
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
    await writable.write(JSON.stringify(DeckbuilderApi._deck));
    await writable.close();
}

(function()
{
    document.getElementById("save_deck").onclick = onSaveDeck;
})();

