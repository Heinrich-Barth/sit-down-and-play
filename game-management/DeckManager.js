const Logger = require("../Logger");
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

    #uuid_count = 0;
    #cardMap = { };
    #siteMap = { };
    #deck = { };
    #handManager = null;
    #firstPlayerId = "";

    getDecks()
    {
        return this.#deck;
    }

    save()
    {
        const jData = 
        {
            admin : this.#firstPlayerId,
            uuid_count : this.#uuid_count,
            cardMap : this.#cardMap,
            siteMap : this.#siteMap,
            deck : { }
        };
        
        for (let key in this.#deck) 
            jData.deck[key] = this.#deck[key].save(this.#firstPlayerId === key);

        return jData;
    }

    size(playerid)
    {
        if (playerid == undefined || this.#deck[playerid] === undefined)
            return null;
        else
            return this.#deck[playerid].size();
    }

    resoteCardMapCloneCard(_input)
    {
        /** overwrite */
        return null;
    }

    restoreCardMap(data)
    {
        if (data === null || data === undefined)
            return;

        this.#cardMap = { };

        for (let key of Object.keys(data))
        {
            const _card = this.resoteCardMapCloneCard(data[key]);
            if (_card === null)
                throw new Error("Cannot duplicate card");
            else
                this.#cardMap[key] = _card;
        }
    }

    restoreSiteMap(data)
    {
        this.#siteMap = { };

        if (data === null || data === undefined)
            return;

        for (let key of Object.keys(data))
        {
            this.#siteMap[key] = {};

            let _site = data[key];
            for (let site of Object.keys(_site))
                this.#siteMap[key][site] = _site[site] === true;
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
                this.#deck[key] = deck;
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

        Logger.info("restore HOST deck");
        this.restoreDeck(decks, true);

        Logger.info("restore GUEST deck(s)");
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
        this.#uuid_count = 0;
        this.#cardMap = { };
        this.#deck = { };
    }
    
    getPlayers()
    {
        return Object.keys(this.#deck);
    }
    
    newDeckInstance(_playerId)
    {
        throw new Error("Overwrite newDeckInstance");
    }

    addDeck(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        let deck = this.newDeckInstance(playerId)
        deck.addDeck(jsonDeck, listAgents, this.#cardMap, gameCardProvider);
        deck.shuffle();
        this.#deck[playerId] = deck;

        if (this.#firstPlayerId === "")
            this.#firstPlayerId = playerId;

        return deck;
    }

    deckCount()
    {
        return Object.keys(this.#deck).length;
    }
    
    addCardsToSideboardDuringGame(playerId, jsonDeck)
    {
        if (typeof this.#deck[playerId] === "undefined")
            Logger.info("Could not find deck " + playerId);

        return typeof this.#deck[playerId] === "undefined" ? -1 : this.#deck[playerId].registerCardsToSideboard(jsonDeck, this.#cardMap);
    }

    importCardsToHand(playerId, code, bAsCharacter)
    {
        if (typeof this.#deck[playerId] === "undefined")
        {
            Logger.info("Could not find deck " + playerId);
            return false;
        }
        else if (code === "")
        {
            Logger.info("Invalid code provded.");
            return false;
        }
        else
            return this.#deck[playerId].importCardsToHand(code, bAsCharacter, this.#cardMap);

    }

    importCardsToGame(playerId, code, bAsCharacter)
    {
        if (typeof this.#deck[playerId] === "undefined" || code === "")
            return "";
        else
            return this.#deck[playerId].importCardsToDeck(code, bAsCharacter, this.#cardMap);
    }

    getCards() 
    {
        if (this.#handManager === null)
            this.#handManager = this.creatHandManager();
        
        return this.#handManager;
    }

    getPlayerDeck(playerId)
    {
        if (typeof this.#deck[playerId] === "undefined")
        {
            Logger.warn("Cannot find deck of player " + playerId);
            return null;
        }
        else
            return this.#deck[playerId];
    }

    flipCard(uuid)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return false;

        this.#cardMap[uuid].revealed = !this.#cardMap[uuid].revealed;
        return this.#cardMap[uuid].revealed;
    }
    
    #clearSitesTappedByPlaer(playerId)
    {
        if (typeof playerId !== "undefined" && typeof this.#siteMap[playerId] !== "undefined")
        {
            this.#siteMap[playerId] = {};
            Logger.info("cleared tapped sites.")
        }
    }
    
    #tapSiteState(playerId, code, bTapped)
    {
        if (typeof this.#siteMap[playerId] === "undefined")
            this.#siteMap[playerId] = {};
        
        if (bTapped && typeof this.#siteMap[playerId][code] === "undefined")
            this.#siteMap[playerId][code] = true;
        else if (!bTapped && typeof this.#siteMap[playerId][code] !== "undefined")
            delete this.#siteMap[playerId][code];
    }
    
    #siteIsTapped(playerId, code)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof code === "undefined" || code === "")
            return false;
        else
            return typeof this.#siteMap[playerId] !== "undefined" && typeof this.#siteMap[playerId][code] !== "undefined";
    }

    #getTappedSites(playerId)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof this.#siteMap[playerId] === "undefined")
            return { };
        else
            return  this.#siteMap[playerId];
    }

    #setCardState(uuid, nState)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return -1;
        else
        {
            this.#cardMap[uuid].state = nState;
            return nState;
        }
    }

    #isCardState(uuid, nState)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return false;
        else
            return this.#cardMap[uuid].state === nState;
    }

    getCharacters(playerid)
    {
        if (playerid === undefined || playerid === "")
            return [];
        
        const codes = [];
        Object.keys(this.#cardMap).forEach(uuid => 
        {
            const card = this.#cardMap[uuid];
            if (card.owner === playerid && (card.type === "character" || card.type === "avatar") && !codes.includes(card.code))
                codes.push(card.code);
        })

        return codes;
    }

    tapCard(uuid)
    {
        return this.#setCardState(uuid, CARD_STATE.tapped);
    }

    woundCard(uuid)
    {
        return this.#setCardState(uuid, CARD_STATE.wounded);
    }

    tapCardFixed(uuid)
    {
        return this.#setCardState(uuid, CARD_STATE.tapped_fixed);
    }

    readySite(playerId, code)
    {
        return this.#tapSiteState(playerId, code, false);
    }
    
    clearPlayerSites(playerId)
    {
        return this.#clearSitesTappedByPlaer(playerId);
    }
    
    tapSite(playerId, code)
    {
        return this.#tapSiteState(playerId, code, true);
    }
    
    siteIsTapped(playerId, code)
    {
        return this.#siteIsTapped(playerId, code);
    }

    getTappedSites(playerId)
    {
        return this.#getTappedSites(playerId);
    }
    
    readyCard(uuid)
    {
        return this.#setCardState(uuid, CARD_STATE.ready);
    }
    triceTapCard(uuid)
    {
        return this.#setCardState(uuid, CARD_STATE.rot270);
    }

    isStateWounded (uuid)
    {
        return this.#isCardState(uuid, CARD_STATE.wounded);
    }

    isStateTapped(uuid)
    {
        return this.#isCardState(uuid, CARD_STATE.tapped);
    }

    getFullPlayerCard(uuid)
    {
        if (uuid === "" || typeof this.#cardMap[uuid] === "undefined")
        {
            if (uuid !== "_site")
                Logger.warn("Cannot find card by uuid " + uuid);
                
            return null;
        }
        else
            return this.#cardMap[uuid];
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

    dumpCards(_playerId)
    {
        /** deprecated */
    }
}

module.exports = DeckManager;