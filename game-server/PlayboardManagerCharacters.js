
const PlayboardManagerDeck = require("./PlayboardManagerDeck");


class PlayboardManagerCharacters extends PlayboardManagerDeck
{
    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer);
        
        this.characters = { };
    }

    reset()
    {
        super.reset();
        
        this.characters = { };
    }

    characterExists(uuid)
    {
        return typeof this.characters[uuid] !== "undefined";
    }
    
    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        let data = super.Save();
        data.characters = this.characters;
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

        for (let i in this.characters)
        {
            if (super.removeFromList(uuid, this.characters[i].resources) || super.removeFromList(uuid, this.characters[i].hazards))
                return true;
        }
 
        return false;
     }
     /**
     * Add a company character to a given target company. It does not check if the company character is already in this company!
     * 
     * @param {String} targetCompanyId
     * @param {String} hostingCharacterUuid ID or empty (=general influence)
     * @param {JSON} companyCharacter
     * @returns {Boolean}
     */
      addCompanyCharacterToCompany(targetCompanyId, hostingCharacterUuid, listAdded)
      {
          
          for (var y = 0; y < listAdded.length; y++)
          {
              var _uuid = listAdded[y];
              this.characters[_uuid].companyId = targetCompanyId;
              this.characters[_uuid].parentUuid = hostingCharacterUuid;
          }
  
          return true;
      }
 
    /**
     * Create a new character entry
     * 
     * @param {String} companyId
     * @param {String} characterUuid
     * @returns {Object}
     */
     createNewCharacter(companyId, characterUuid)
     {
         return {
             companyId : companyId,
             character : characterUuid,
             uuid : characterUuid,
             parentUuid : "",
             resources : [],
             hazards : []
         }; 
     }
   
     getOrCreateCharacter(uuid, targetCompany)
     {
         /* create character card info if necessary (e.g. if played from hand) */
         if (typeof this.characters[uuid] === "undefined")
             this.characters[uuid] = this.createNewCharacter(targetCompany, uuid);

        return this.characters[uuid];
     }


    /**
     * Get a character by its uid
     * @param {String} uuid
     * @return {json} json or null
     */
    getCharacterByUuid(uuid)
    {
        if (uuid !== "" && this.characterExists(uuid))
            return this.characters[uuid];
        else
            return null;
    }
    
    /**
     * Get a character card by its uid
     * @param {String} uuid
     * @return {json} json or null
     */
     GetCharacterCardByUuid(uuid)
     {
         let pChar = this.getCharacterByUuid(uuid);
         if (pChar === null || typeof pChar.uuid === "undefined")
             return null;
         else
             return this.GetCardByUuid(pChar.uuid);
     }
 
    Restore(playboard)
    {
        super.Restore(playboard);

        this.characters = { };
        for (let characterid in playboard.characters)
        {
            const _source = playboard.characters[characterid];
            this.characters[characterid] = {
                companyId : this.AssertString(_source.companyId),
                character : this.AssertString(_source.character),
                uuid : this.AssertString(_source.uuid),
                parentUuid : this.AssertString(_source.parentUuid),
                resources : this.ArrayUUIDClone(_source.resources),
                hazards : this.ArrayUUIDClone(_source.hazards)
            }
        }
    }

    /**
     * Create a new company character which can be added to a company
     * 
     * @param {type} uuid
     * @param {type} listInfluencedUUids
     */
    createCompanyCharacter(uuid, listInfluencedUUids)
    {
        var list = [];
        for (var i = 0; i < listInfluencedUUids.length; i++)
            list.push(listInfluencedUUids[i]);

        return {
            uuid : uuid,
            influenced : list
        };
    }

    createNewCompanyWithCharacter(companyId, playerId, hostUuid, listInfluencedUUids, startingLocation)
    {
        var list = [];
        for (var i = 0; i < listInfluencedUUids.length; i++)
            list.push(listInfluencedUUids[i]);

        return {
                id : companyId,
                playerId : playerId,
                characters : [ this.createCompanyCharacter(hostUuid,listInfluencedUUids) ],
                sites: {
                    current: startingLocation,
                    regions: [],
                    target: "",
                    attached : []
                }
        };
    }

    popCharacterCards(characterUuid)
    {
        var pCharacter = this.getCharacterByUuid(characterUuid);
        if (pCharacter === null)
        {
            /** 
             * Character has not been found, i.e. is to be popped from hand.
             * Anyway, we are done here
             */
            return [];
        }

        var vsCards = [];
        for (var i = 0; i < pCharacter.resources.length; i++)
            vsCards.push(pCharacter.resources[i]);

        for (var i = 0; i < pCharacter.hazards.length; i++)
            vsCards.push(pCharacter.hazards[i]);

        vsCards.push(characterUuid);

        pCharacter.resources = [];
        pCharacter.hazards = [];

        return vsCards;
    }

    PopCharacterAndItsCards(characterUuid)
    {
        // get the list of affected company characters
        var character = this.popCompanyCharacter(characterUuid); // { uuid: uuid, sourceCompany : "", influenced : [] }
        if (character === null)
            return [];

        var cardList = this.popCharacterCards(characterUuid);
        if (cardList.length === 0)
            return [];

        for (var i = 0; i < character.influenced.length; i++)
        {
            var list = this.popCharacterCards(character.influenced[i]);
            if (list.length !== 0)
            {
                //console.log("delete influenced character " + character.influenced[i]);
                delete this.characters[character.influenced[i]];
                for (var y = 0; y < list.length; y++)
                    cardList.push(list[y]);
            }
        }

        if (typeof this.characters[character.uuid] !== "undefined")
            delete this.characters[character.uuid];

        return cardList;
    }

    readyResources(uuid)
    {
        if (!this.characterExists(uuid))
        {
            console.log("character does not exist: " + uuid);
            return;
        }

        var _companyCharacter = this.characters[uuid];
        for (var i = 0; i < _companyCharacter.resources.length; i++)
           super.readyCard(_companyCharacter.resources[i]);
    }


    
    /**
     * Let a character host a card from hand or stage
     * 
     * @param {String} company Company Id
     * @param {String} character Target Character Id
     * @param {String} uuid Card Uuid
     * @param {String} playerId
     * @param {Boolean} bFromHand
     * @returns {Boolean}
     */
    CharacterHostCard(company, character, uuid, bFromHand, playerId)
    {
        const pCard = this.GetCardByUuid(uuid);
        if (pCard === null)
            return false;

        playerId = pCard.owner;

        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            console.log("Cannot get player deck " + playerId);
            return false;
        }

        // remove chard from deck, character or staging area
        if (!this.removeCardFromDeckOrCompany(playerId, uuid))
        {
            console.log("Could not remove card " + uuid);
            return false;
        }

        if (pCard.type === "hazard")
            this.characters[character].hazards.push(uuid);
        else
            this.characters[character].resources.push(uuid);

        return true;
    }
 
    /**
      * Move a CHARACTER card from anywhere to ...
      * 
      * @param {String} characterUuid
      * @param {String} playerId
      * @param {String} target "sideboard, discardpile, playdeck, hand"
      * @returns {List} list of cards moved
      */
    MoveCardCharacterTo(characterUuid, playerId, target)
    {
        if (!super.isValidTarget(target))
            return [];

        var list = this.PopCharacterAndItsCards(characterUuid);
        for (var i = 0; i  < list.length; i++)
            super.moveCard(list[i], target);
        
        if (this.PopOnGuardCard(characterUuid))
        {
            super.moveCard(characterUuid, target);
            if (list.length === 0)
                list = [characterUuid];
            else if (!list.includes(characterUuid))
                list.push(characterUuid);
        }
            
        return list;
    }

    PopOnGuardCard(cardUuid)
    {
        return false;
    }


    /**
     * Transfer a RESOURCE/HAZARD between characters
     * 
     * @param {String} sourceCharacter
     * @param {String} targetCharacter
     * @param {String} cardUuid
     * @param {String} playerId
     * @returns {Boolean}
     */
     CharacterTransferCard(sourceCharacter, targetCharacter, cardUuid, playerId)
     {
         var pTargetChar = this.characters[targetCharacter];
         if (typeof pTargetChar === "undefined")
         {
             console.log("Undefinied target character "+ targetCharacter);
             return false;
         }
 
         var pCard = this.GetCardByUuid(cardUuid);
         if (pCard === null)
         {
             console.log("Cannot find card " + cardUuid);
             return false;
         }
         else if (pCard.type !== "hazard" && pCard.type !== "resource")
         {
             console.log("Can only transfer hazards or resources");
             return false;
         }
         else if (!this.removeCardFromDeckOrCompany(playerId, cardUuid))
         {
             console.log("Cannot remove card form source owner");
             return false;
         }
 
         if (pCard.type === "hazard")
             pTargetChar.hazards.push(cardUuid);
         else // ist klar wg. IF type check ;; if (pCard.type === "resource")
             pTargetChar.resources.push(cardUuid);
 
         return true;
     }
 

     addNewCharacter(uuid, character)
     {
        this.characters[uuid] = character;
     }
}

module.exports = PlayboardManagerCharacters;