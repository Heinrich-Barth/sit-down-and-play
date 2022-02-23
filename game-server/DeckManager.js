
const CARD_STATE = { };

Object.defineProperties(CARD_STATE, {
    ready: {
        value: 0,
        writable: false,
        configurable: false
    },
    tapped: {
        value: 90,
        writable: false,
        configurable: false
    },
    wounded: {
        value: 180,
        writable: false,
        configurable: false
    },
    tapped_fixed: {
        value: 91,
        writable: false,
        configurable: false
    },
    rot270: {
        value: 270,
        writable: false,
        configurable: false
    }
});

class DeckManager {

    constructor()
    {
        this._uuid_count = 0;
        this._cardMap = { };
        this._siteMap = { };
        this._deck = { };
        this._handManager = null;
        this._firstPlayerId = "";
    }

    save()
    {
        let jData = 
        {
            admin : this._firstPlayerId,
            uuid_count : this._uuid_count,
            cardMap : this._cardMap,
            siteMap : this._siteMap,
            deck : { }
        };
        
        for (let key in this._deck) 
            jData.deck[key] = this._deck[key].save(this._firstPlayerId === key);

        return jData;
    }

    size(playerid)
    {
        if (playerid == undefined || this._deck[playerid] === undefined)
            return null;
        else
            return this._deck[playerid].size();
    }

    resoteCardMapCloneCard(input)
    {
        /** overwrite */
        return null;
    }

    restoreCardMap(data)
    {
        if (data === null || data === undefined)
            return;

        this._cardMap = { };

        for (let key of Object.keys(data))
        {
            const _card = this.resoteCardMapCloneCard(data[key]);
            if (_card === null)
                throw new Error("Cannot duplicate card");
            else
                this._cardMap[key] = _card;
        }
    }

    restoreSiteMap(data)
    {
        this._siteMap = { };

        if (data === null || data === undefined)
            return;

        for (let key of Object.keys(data))
        {
            this._siteMap[key] = {};

            let _site = data[key];
            for (let site of Object.keys(_site))
                this._siteMap[key][site] = _site[site] === true;
        }
    }

    restoreDeck(decks, requireAdmin)
    {
        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === requireAdmin)
            {
                let deck = this.newDeckInstance(key);
                deck.restore(decks.deck[key]);
                this._deck[key] = deck;
            }
        }
    }

    preprocessRestore(decks)
    {
        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === undefined)
                decks.deck[key].ishost = false;
        }
    }

    restore(decks)
    {
        this.reset();
        this.restoreCardMap(decks.cardMap);
        this.restoreSiteMap(decks.siteMap);

        this.preprocessRestore(decks);

        console.log("restore HOST deck");
        this.restoreDeck(decks, true);

        console.log("restore GUEST deck(s)");
        this.restoreDeck(decks, false);

        this.uuid_count = Date.now();
        return true;
    }

    creatHandManager()
    {
        throw new Error("please overwrite!");
    }

    isArda()
    {
        return false;
    }
    
    isSinglePlayer()
    {
        return false;
    }

    reset()
    {
        this._uuid_count = 0;
        this._cardMap = { };
        this._deck = { };
    }
    
    getPlayers()
    {
        return Object.keys(this._deck);
    }
    
    newDeckInstance(playerId)
    {
        throw new Error("Overwrite newDeckInstance");
    }

    addDeck(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        let deck = this.newDeckInstance(playerId)
        deck.addDeck(jsonDeck, listAgents, this._cardMap, gameCardProvider);
        deck.shuffle();
        this._deck[playerId] = deck;

        if (this._firstPlayerId === "")
            this._firstPlayerId = playerId;

        return deck;
    }

    deckCount()
    {
        return Object.keys(this._deck).length;
    }
    
    addCardsToSideboardDuringGame(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        if (typeof this._deck[playerId] === "undefined")
            console.log("Could not find deck " + playerId);

        return typeof this._deck[playerId] === "undefined" ? -1 : this._deck[playerId].registerCardsToSideboard(jsonDeck, listAgents, this._cardMap, gameCardProvider);
    }

    importCardsToHand(playerId, code, bAsCharacter, gameCardProvider)
    {
        if (typeof this._deck[playerId] === "undefined")
        {
            console.log("Could not find deck " + playerId);
            return false;
        }
        else if (code === "")
        {
            console.log("Invalid code provded.");
            return false;
        }
        else
            return this._deck[playerId].importCardsToHand(code, bAsCharacter, this._cardMap, gameCardProvider);

    }

    getCards() 
    {
        if (this._handManager === null)
            this._handManager = this.creatHandManager();
        
        return this._handManager;
    }

    getPlayerDeck(playerId)
    {
        if (typeof this._deck[playerId] === "undefined")
        {
            console.log("Cannot find deck of player " + playerId);
            return null;
        }
        else
            return this._deck[playerId];
    }

    flipCard(uuid)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return false;

        this._cardMap[uuid].revealed = !this._cardMap[uuid].revealed;
        return this._cardMap[uuid].revealed;
    }
    
    _clearSitesTappedByPlaer(playerId)
    {
        if (typeof playerId !== "undefined" && typeof this._siteMap[playerId] !== "undefined")
        {
            this._siteMap[playerId] = {};
            console.log("cleared tapped sites.")
        }
    }
    
    _tapSiteState(playerId, code, bTapped)
    {
        if (typeof this._siteMap[playerId] === "undefined")
            this._siteMap[playerId] = {};
        
        if (bTapped && typeof this._siteMap[playerId][code] === "undefined")
            this._siteMap[playerId][code] = true;
        else if (!bTapped && typeof this._siteMap[playerId][code] !== "undefined")
            delete this._siteMap[playerId][code];
    }
    
    _siteIsTapped(playerId, code)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof code === "undefined" || code === "")
            return false;
        else
            return typeof this._siteMap[playerId] !== "undefined" && typeof this._siteMap[playerId][code] !== "undefined";
    }

    _getTappedSites(playerId)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof this._siteMap[playerId] === "undefined")
            return { };
        else
            return  this._siteMap[playerId];
    }

    _setCardState(uuid, nState)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return -1;
        else
        {
            this._cardMap[uuid].state = nState;
            return nState;
        }
    }

    _isCardState(uuid, nState)
    {
        if (typeof this._cardMap[uuid] === "undefined")
            return false;
        else
            return this._cardMap[uuid].state === nState;
    }

    tapCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.tapped);
    }

    woundCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.wounded);
    }

    tapCardFixed(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.tapped_fixed);
    }

    readySite(playerId, code)
    {
        return this._tapSiteState(playerId, code, false);
    }
    
    clearPlayerSites(playerId)
    {
        return this._clearSitesTappedByPlaer(playerId);
    }
    
    tapSite(playerId, code)
    {
        return this._tapSiteState(playerId, code, true);
    }
    
    siteIsTapped(playerId, code)
    {
        return this._siteIsTapped(playerId, code);
    }

    getTappedSites(playerId)
    {
        return this._getTappedSites(playerId);
    }
    
    readyCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.ready);
    }
    triceTapCard(uuid)
    {
        return this._setCardState(uuid, CARD_STATE.rot270);
    }

    isStateWounded (uuid)
    {
        return this._isCardState(uuid, CARD_STATE.wounded);
    }

    isStateTapped(uuid)
    {
        return this._isCardState(uuid, CARD_STATE.tapped);
    }

    getFullPlayerCard(uuid)
    {
        if (uuid === "" || typeof this._cardMap[uuid] === "undefined")
        {
            console.log("Cannot find card by uuid " + uuid);
            return null;
        }
        else
            return this._cardMap[uuid];
    }

    updateToken(uuid, bAdd)
    {
        const card = this.getFullPlayerCard(uuid);
        if (card !== null)
        {
            if (card.token === undefined)
            {
                if (bAdd)
                    card.token = 1;
            }
            else
            {
                if (bAdd)
                    card.token++;
                else if (card.token > 0)
                    card.token--;
            }

            return card.token;
        }
        else
            return -1;
    }

    dumpCards(playerId)
    {
        /** deprecated */
    }
}

module.exports = DeckManager;