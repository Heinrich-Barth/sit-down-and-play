
const PlayboardManagerCharacters = require("./PlayboardManagerCharacters");

class PlayboardManagerStagingArea extends PlayboardManagerCharacters
{
    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer);
        
        this.stagingareas = { };
    }

    reset()
    {
        super.reset();
        
        this.stagingareas = { };
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

        this.stagingareas[playerId] = {
            resources : [],
            hazards : []
        };

        return true;
    }

    /**
     * Save current game state
     * @returns Object
     */
     Save()
     {
         let data = super.Save();
         data.stagingarea = this.stagingareas;
 
         return data;
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

        for (let i in this.stagingareas)
        {
            if (super.removeFromList(uuid, this.stagingareas[i].resources) || super.removeFromList(uuid, this.stagingareas[i].hazards))
                return true;
        }
        
        /* at last, it might be an onguard card */
        return false;
    }
 
     
    /**
     * Move a card to the staging area from a players HAND
     * @param {String} uuid
     * @param {String} playerSourceId
     * @param {String} playerTagetId
     * @returns {boolean}
     */
     MoveCardToStagingArea(uuid, playerSourceId, playerTagetId)
     {
        const pCard = this.GetCardByUuid(uuid);
        if (pCard === null)
            return false;

        if (!this.removeCardFromDeckOrCompany(playerSourceId, uuid))
        {
            console.log("Could not remove card " + uuid + " from deck of company/staging area");
            return false;
        }

        const pStagingArea = typeof this.stagingareas[playerTagetId] === "undefined" ? null : this.stagingareas[playerTagetId];
        if (pStagingArea === null)
            return false;

        if (pCard.type === "hazard")
            pStagingArea.hazards.push(uuid);
        else
            pStagingArea.resources.push(uuid);

        return true;
     }
 

    Restore(playboard)
    {
        super.Restore(playboard);

        this.stagingareas = { };
        for (let uuid in playboard.stagingarea)
        {
            this.stagingareas[uuid] = {
                resources : this.ArrayUUIDClone(playboard.stagingarea[uuid].resources),
                hazards : this.ArrayUUIDClone(playboard.stagingarea[uuid].hazards)
            };
        }
    }


    GetStagingCards(playerId, isResources)
    {
        if (this.stagingareas[playerId] === undefined)
            return [];
        else if (isResources && this.stagingareas[playerId].resources !== undefined)
            return this.stagingareas[playerId].resources;
        else if (!isResources && this.stagingareas[playerId].hazards !== undefined)
            return this.stagingareas[playerId].hazards;
        else
            return [];        
    }

}

module.exports = PlayboardManagerStagingArea;