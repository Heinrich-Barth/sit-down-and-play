const DeckManager = require("./deckmanager");
const HandManager = require("./handmanager-arda");
const Deck = require("./deck-arda");

class DeckManagerArda extends DeckManager {

    constructor()
    {
        super();

        this.adminUserId = "";
    }

    static ID_CHARACTERS = "arda_characters";
    static ID_MP = "arda_mps";
    static ID_MINORS = "arda_minors";

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

    addArdaHands(jsonDeck, listAgents, gameCardProvider)
    {        
        this.addArdaHand(DeckManagerArda.ID_MINORS, listAgents, gameCardProvider, jsonDeck.minors, {});
        this.addArdaHand(DeckManagerArda.ID_MP, listAgents, gameCardProvider, jsonDeck.mps, {});
        this.addArdaHand(DeckManagerArda.ID_CHARACTERS, listAgents, gameCardProvider, jsonDeck.chars_mind7, jsonDeck.chars_others);
    }

    addArdaHand(playerId, listAgents, gameCardProvider, jPlay, jPool)
    {
        let jDeck = {
            pool: jPool,
            sideboard: {},
            playdeck : jPlay
        }
        
        super.addDeck(playerId, jDeck, listAgents, gameCardProvider);
    }

    addDeck(playerId, jsonDeck, listAgents, gameCardProvider)
    {
        super.addDeck(playerId, jsonDeck, listAgents, gameCardProvider);
        if (super.deckCount() === 1)
        {
            this.adminUserId = playerId;
            this.addArdaHands(jsonDeck, listAgents, gameCardProvider);
            this.drawMinorItems(4);
        }
        else
        {
            this.updateDeckData(playerId, this.adminUserId);
        }

        this.addMPHand(playerId + "mp", gameCardProvider);
        this.assignRandomMPs(playerId + "mp", gameCardProvider, 5);
    }

    drawMinorItems(nCount)
    {
        const deckSource = this.getPlayerDeck(DeckManagerArda.ID_MINORS);
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.draw();
        }
    }

    assignRandomMPs(playerId, nCount)
    {
        const deckSource = this.getPlayerDeck(DeckManagerArda.ID_MP);
        const deckTarget = this.getPlayerDeck(playerId);

        if (deckSource === null || deckTarget === null)
            return;

        for (let i = 0; i < nCount; i++)
            deckTarget.push().toHand(deckSource.popTopCard());
    }


    /**
     * Add a special "player" with "mp" suffix.
     * This will draw from the common MP pile and also discard into it.
     * Yet, the hand is separate.
     * 
     * @param {String} playerId 
     * @param {Object} gameCardProvider 
     */
    addMPHand(playerId, gameCardProvider)
    {
        super.addDeck(playerId, {}, [], gameCardProvider);
        this.updateDeckData(playerId, DeckManagerArda.ID_MP);
    }

    updateDeckData(playerId, adminId)
    {
        const _deckAdmin = this.getPlayerDeck(adminId);
        const _deckPlayer = this.getPlayerDeck(playerId);

        /**
         * make sure playdeck and discard pile are identical
         */
        if (_deckAdmin !== null && _deckPlayer !== null)
        {
            _deckPlayer.discardPile = _deckAdmin.discardPile;
            _deckPlayer.sideboard = _deckAdmin.sideboard;
            _deckPlayer.playdeck = _deckAdmin.playdeck;
        }
    }
}

module.exports = DeckManagerArda;