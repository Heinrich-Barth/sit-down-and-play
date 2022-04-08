
const PlayboardManagerCompanies = require("./PlayboardManagerCompanies");



class PlayboardManager extends PlayboardManagerCompanies
{
    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer);

        super.triggerEventSetupNewGame();
    }

    reset()
    {
        super.reset();

        super.triggerEventSetupNewGame();
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        return super.Save();
    }


    Restore(playboard)
    {
        super.Restore(playboard);
        return true;
    }

    /**
     * Add a player deck to the game 
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Boolean}
     */
    AddDeck(playerId, jsonDeck)
    {
        super.AddDeck(playerId, jsonDeck);
        this.getEventManager().trigger("on-deck-added", playerId, jsonDeck, this.getDecks())
        return true;
    }
     
    /**
     * Remove a card from the hand/deck or onboard company
     * 
     * @param {String} playerId
     * @param {String} uuid
     * @returns {Boolean}
     */
    removeCardFromDeckOrCompany(playerId, uuid)
    {
        if (super.removeCardFromDeckOrCompany(playerId, uuid))
            return true;
        else
            return this.PopOnGuardCard(uuid); /* at last, it might be an onguard card */
    }

    getParent(uuid)
    {
        const pCard = this.GetCardByUuid(uuid);
        return pCard === null ? "" : pCard.code;
    }  

    GetFullCompanyCharacter(companyId, uuid)
    {
        if (companyId === "" || !this.companyExists(companyId))
        {
            console.log("Cannot find company by its id " + companyId + " (GetFullCompanyCharacter)");
            return null;
        }

        const pCharacter = this.getCharacterByUuid(uuid);
        if (pCharacter === null)
        {
            console.log("Character " + uuid + " does not exist.");
            return null;
        }

        return {
            companyId : pCharacter.companyId,
            parent : this.getParent(pCharacter.parentUuid),
            character : this.GetCardByUuid(uuid),
            resources : this.toCardList(pCharacter.resources),
            hazards : this.toCardList(pCharacter.hazards),
            influenced : []
        };
    }

     /**
      * Move a single card from anywhere to ...
      * 
      * @param {String} uuid
      * @param {String} playerId
      * @param {String} target "sideboard, discardpile, playdeck, hand"&&
      * @returns {Boolean}
      */
    MoveCardTo(uuid, playerId, target)
    {
        const jCard = this.GetCardByUuid(uuid);
        if (jCard === null)
            return false;

        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
            return false;

        if (!this.removeCardFromDeckOrCompany(jCard.owner, uuid))
        {
            console.log("Could not remove card " + uuid + " from deck of company/staging area nor from location on guard lists");
            return false
        } 
        else
        {
            jCard.owner = playerId;
            return  super.moveCardToDeckPile(uuid, jCard, pDeck, target, playerId);
        }
    }
}

module.exports = PlayboardManager;