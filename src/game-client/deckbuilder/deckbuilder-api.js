
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
    DECK_SITES: "sites",

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
        if (sTarget === "" || this._deck[sTarget] === undefined || this._deck[sTarget][code] === undefined)
        {
            console.warn("not in target deck: " + sTarget);
            return false;
        }

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
        for (let i = 0; i < count; i++)
        {
            this._count++;
            if (DeckList.addToDeck(card.code, target))
                this.add(target, card)
        }
    },

    _count : 0,
    _deckname : "",
    
    onUpdateDeckName : function(e)
    {
        DeckbuilderApi._deckname = "";
        if (e === undefined || e.detail === undefined)
            return;

        const name = e.detail.trim();
        const pos = name.lastIndexOf(".");
        DeckbuilderApi._deckname = pos < 1 ? name.trim() : name.substr(0, pos).trim();
    },

    onLoadDeck : function(e)
    {
        if (e === undefined)
            return;

        let vsMissing = [];
        let sNotes = "";

        const jDeck = e.detail;
        if (jDeck !== undefined)
        {
            DeckbuilderApi._deck = {};
            DeckbuilderApi._count = 0;

            /** necessary to update the counters again to remove previous deck stats */
            DeckList.removeExisting();
            ViewCards.resetCounter();
       
            if (jDeck !== undefined && jDeck.notes !== undefined)
                sNotes = jDeck.notes;

            vsMissing = DeckbuilderApi.initAddCards(jDeck);
        }

        if (!DeckbuilderApi.isEmptyArray(vsMissing))
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Some cards are missing. Check description field at the end." }));

        document.getElementById("notes").value = DeckbuilderApi.createNotesText(sNotes, vsMissing);
        document.body.dispatchEvent(new CustomEvent("meccg-deck-load-complete"));
        document.body.dispatchEvent(new CustomEvent("meccg-deckbuilder-update-summary"));
    },

    isEmptyArray : function(vsMissing)
    {
        if (vsMissing === null || vsMissing === undefined || vsMissing.length === 0)
            return true;

        for (let entry of vsMissing)
        {
            if (entry !== "")
                return false;
        }
    
        return true;
    },

    createNotesText : function(sText, vsMissing)
    {
        if (vsMissing.length === 0)
            return sText;

        for (let _val of vsMissing)
        {
            if (_val !== "")
            {
                if (sText !== "")
                    sText += "\n\n";

                sText += _val;
            }
        }

        return sText;
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
            const type = card.type.toLowerCase();
            if (type === "character")
            {
                const secondary = card.Secondary.toLowerCase();
                if (secondary === "character")
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_CHARACTER);
                else if (secondary === "agent")
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_CHARACTER);
                else if (secondary === "avatar")
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_AVATAR);
                else
                    DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_SIDEBOARD);
            }
            else if (type === "resource")
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_RESOURCE);
            else if (type === "hazard")
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_HAZARD);
            else
                DeckbuilderApi.onInitAddCard(card, count, DeckbuilderApi.DECK_SIDEBOARD);
        }

        function addCardGroup(cardList, groupkey, target)
        {
            let sNotFound = "";

            for (let key in cardList[groupkey])
            {
                let count = getCardCount(cardList[groupkey][key]);
                if (count < 1)
                    continue;
    
                const card = ViewCards.getCardFromCardCode(key);
                if (card === null)
                {
                    if (sNotFound === "")
                        sNotFound = "Not found in " + groupkey.toUpperCase() + "\n" + count + " " + key;
                    else
                        sNotFound += "\n" + count + " " + key;
                }
                else
                {
                    if (target !== "" && target !== undefined)
                        DeckbuilderApi.onInitAddCard(card, count, target);
                    else
                        doAddCard(card, count);
                }
            }
    
            return sNotFound;
        }

        let _notFound = [];
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_POOL, DeckbuilderApi.DECK_POOL));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_RESOURCE));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_RESOURCES));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_HAZARD));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_HAZARDS));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_CHARACTER));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_CHARACTER2));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_AVATAR, DeckbuilderApi.DECK_AVATAR));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_SIDEBOARD, DeckbuilderApi.DECK_SIDEBOARD));
        _notFound.push(addCardGroup(cards, DeckbuilderApi.DECK_SITES, DeckbuilderApi.DECK_SITES));
        return _notFound;
    },

    createExtendedDeck : function(input)
    {
        const deck = {
            pool: {
                characters: {},
                resources: {},
                hazards: {}
            },
            deck: {
                resources: {},
                characters: {},
                hazards: {}
            },
            sideboard: {
                characters: {},
                resources: {},
                hazards: {}
            }, 
            sites: { }
        };

        function onProcessPart(cards, targetPart)
        {
            if (cards === undefined || cards === null)
                return;

            for (let code in cards)
            {
                const _card = cards[code];
                if (_card.type === "Hazard")
                    targetPart["hazards"][code] = _card.count;
                else if (_card.type === "Character")
                    targetPart["characters"][code] = _card.count;
                else if (_card.type === "Site")
                    targetPart[code] = 1;
                else
                    targetPart["resources"][code] = _card.count;
            }
        }

        function onProcessTarget(cards, target)
        {
            if (cards === undefined || target === undefined || cards === null)
                return;

            for (let code in cards)
                target[code] = cards[code].count;
        }

        onProcessPart(input.pool, deck.pool);
        onProcessTarget(input.character, deck.deck.characters);
        onProcessTarget(input.avatar, deck.deck.characters);
        onProcessTarget(input.resource, deck.deck.resources);
        onProcessTarget(input.hazard, deck.deck.hazards);
        onProcessPart(input.sideboard, deck.sideboard);
        onProcessPart(input.sites, deck.sites);

        return deck;
    },

    toString(jDeck, title, notes)
    {
        return ReadDeck.toString(jDeck, title, notes);
    }
}

document.getElementById("save_deck").onclick = function()
{
    let sName = DeckbuilderApi._deckname.trim();
    if (sName === null || sName === undefined || sName === "")
        sName = "Your deck";

    const _deck = DeckbuilderApi.createExtendedDeck(DeckbuilderApi._deck);
    const notes = document.getElementById("notes").value;

    const data = {
        data: DeckbuilderApi.toString(_deck, sName, notes),
        name : sName
    };

    document.body.dispatchEvent(new CustomEvent("meccg-saveas-deck", { "detail": data}));
};

document.body.addEventListener("meccg-deckbuilder-load-deck", DeckbuilderApi.onLoadDeck, false);

document.body.addEventListener("meccg-deckbuilder-add-to-deck", DeckbuilderApi.onAdd, false);
document.body.addEventListener("meccg-deckbuilder-remove-from-deck", DeckbuilderApi.onRemove, false);
document.body.addEventListener("meccg-file-dropped-name", DeckbuilderApi.onUpdateDeckName, false);
document.body.addEventListener("meccg-deck-available", DeckbuilderApi.onLoadDeck, false);
