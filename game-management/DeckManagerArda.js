const DeckManager = require("./DeckManager");
const HandManagerArda = require("./HandManagerArda");
const DeckArda = require("./DeckArda");

class DeckManagerArda extends DeckManager {

    #adminUserId = "";
    #singlePlayer = false;
    #poolGame = { };
    
    getAdminDeck()
    {
        return super.getPlayerDeck(this.#adminUserId);
    }

    newDeckInstance(playerId)
    {
        return new DeckArda(playerId);
    }

    creatHandManager()
    {
        return new HandManagerArda(this);
    }

    isArda()
    {
        return true;
    }

    isSinglePlayer()
    {
        return this.#singlePlayer;
    }

    shuffleArdaMarshallingPoints()
    {
        this.shuffleAny(this.playdeck);
    }

    restore(decks)
    {
        super.restore(decks);

        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === false)
                this.updateDeckData(key, this.#adminUserId)
        }

        return true;
    }

    addDeck(playerId, jsonDeck)
    {
        if (super.deckCount() === 0)
        {
            for (let _key in jsonDeck["pool"])
                this.#poolGame[_key] = jsonDeck["pool"][_key];
        }
        else
        {
            jsonDeck["pool"] = { };
            for (let _key in this.#poolGame)
                jsonDeck["pool"][_key] = this.#poolGame[_key];
        }

        const pDeck = super.addDeck(playerId, jsonDeck);
        if (super.deckCount() === 1)
        {
            this.#adminUserId = playerId;

            /** all players share the same minor item hand */
            this.drawMinorItems(playerId, 4);

            pDeck.shuffleCommons();
        }
        else
        {
            this.updateDeckData(playerId, this.#adminUserId);
        }

        /** every player draws their own MP hand */
        if (!this.isSinglePlayer())    
            this.drawMarshallingPoints(playerId, 5)
    }

    drawMinorItems(playerId, nCount)
    {
        const deckSource = this.getPlayerDeck(playerId);
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.drawCardMinorItems();
        }
    }

    drawMarshallingPoints(playerId, nCount)
    {
        const deckSource = this.getPlayerDeck(playerId);
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.drawCardMarshallingPoints();
        }
    }

    updateDeckData(playerId, adminId)
    {
        const _deckPlayer = this.getPlayerDeck(playerId);
        if (_deckPlayer !== null)
            _deckPlayer.updateListReferences(this.getPlayerDeck(adminId));
    }

    resoteCardMapCloneCard(input)
    {
        return DeckArda.cloneCardEntry(input);
    }
}

module.exports = DeckManagerArda;

