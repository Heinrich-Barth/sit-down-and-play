const DeckManager = require("./deckmanager");
const HandManager = require("./handmanager-arda");
const Deck = require("./deck-arda");

class DeckManagerArda extends DeckManager {

    constructor()
    {
        super();

        this.adminUserId = "";
    }

    getAdminDeck()
    {
        return super.getPlayerDeck(this.adminUserId);
    }

    newDeckInstance(playerId)
    {
        return new Deck(playerId);
    }

    creatHandManager()
    {
        return new HandManager(this);
    }

    isArda()
    {
        return true;
    }

    shuffleArdaMarshallingPoints()
    {
        this.shuffleAny(this.playdeck);
    }

    addDeck(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        let pDeck = super.addDeck(playerId, jsonDeck, listAgents, gameCardProvider);
        if (super.deckCount() === 1)
        {
            this.adminUserId = playerId;

            /** all players share the same minor item hand */
            this.drawMinorItems(playerId, 4);

            pDeck.shuffleCommons();
        }
        else
        {
            this.updateDeckData(playerId, this.adminUserId);
        }

        /** every player draws their own MP hand */
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
}

module.exports = DeckManagerArda;

