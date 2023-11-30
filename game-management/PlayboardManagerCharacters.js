const PlayboardManagerDeck = require("./PlayboardManagerDeck");
const Logger = require("../Logger");

class PlayboardManagerCharacters extends PlayboardManagerDeck
{
    characters = { };

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
          for (let _uuid of listAdded)
          {
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
        return {
            uuid : uuid,
            influenced : [...listInfluencedUUids]
        };
    }

    popCharacterCards(characterUuid)
    {
        const pCharacter = this.getCharacterByUuid(characterUuid);
        if (pCharacter === null)
        {
            /** 
             * Character has not been found, i.e. is to be popped from hand.
             * Anyway, we are done here
             */
            return [];
        }

        let vsCards = [...pCharacter.resources, ...pCharacter.hazards];
        vsCards.push(characterUuid);

        pCharacter.resources = [];
        pCharacter.hazards = [];

        return vsCards;
    }

    /**
     * Process the influenced characters after the host has been 
     * popped (i.e. because it is being discarded or similar).
     * 
     * You may overwrite this method to split them in a separate company
     * 
     * @param {String} companyUuid 
     * @param {Array} listCharacters List of character uuid
     * @returns 
     */
    onPopInfluencedCharacters(companyUuid, listCharacters)
    {
        if (companyUuid === undefined || listCharacters === undefined)
            return [];

        let cardList = [];
        for (let charUuid of listCharacters)
        {
            const list = this.popCharacterCards(charUuid);
            const lenList = list.length;
            if (lenList === 0)
                continue;

            this.deleteCharacter0(charUuid);

            for (let uuid of list)
                cardList.push(uuid);
        }

        return cardList;
    }


    /**
     * Delete an entry from the characters map if existent
     * @param {String} uuid Character UUID
     */
    deleteCharacter0(uuid)
    {
        if (uuid !== undefined && uuid !== "" && this.characters[uuid] !== undefined)
            delete this.characters[uuid];
    }

    /**
     * Pop a character and its cards as well as all influenced characters and their cards.
     * @param {String} characterUuid 
     * @returns 
     */
    PopCharacterAndItsCards(characterUuid)
    {
        /* get the list of affected company characters */
        let character = this.popCompanyCharacter(characterUuid); // { uuid: uuid, sourceCompany : "", influenced : [] }
        if (character === null)
            return [];

        let cardList = this.popCharacterCards(characterUuid);
        if (cardList.length === 0)
            return [];

        const listRem = this.onPopInfluencedCharacters(character.sourceCompany, character.influenced);
        this.deleteCharacter0(character.uuid);
        return [...cardList, ...listRem];
    }

    readyResources(uuid)
    {
        if (!this.characterExists(uuid))
        {
            Logger.warn("character does not exist: " + uuid);
        }
        else
        {
            for (let _card of this.characters[uuid].resources)
                super.readyCard(_card);
        }
    }
   
    /**
     * Let a character host a card from hand or stage
     * 
     * @param {String} company Company Id
     * @param {String} character Target Character Id
     * @param {String} uuid Card Uuid
     * @returns {Boolean}
     */
    CharacterHostCard(company, character, uuid)
    {
        const pCard = this.GetCardByUuid(uuid);
        if (pCard === null || this.characters[character] === undefined)
            return false;

        const playerId = pCard.owner;
        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            Logger.warn("Cannot get player deck " + playerId);
            return false;
        }

        // remove chard from deck, character or staging area
        if (!this.removeCardFromDeckOrCompany(playerId, uuid))
        {
            Logger.warn("Could not remove card " + uuid);
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

        let list = this.PopCharacterAndItsCards(characterUuid);
        this.MoveCardCharacterTo0(characterUuid, list, target);
            
        
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

    MoveCardCharacterTo0(characterUuid, listUuids, target)
    {
        const isOutOfPlay = target === "outofplay";

        /** if a character is put out of play, its hosted cards are only discarded. */
        const targetOther = isOutOfPlay ? "discardpile" : target;
        for (let carduuid of listUuids)
        {
            if (carduuid === characterUuid)
                super.moveCard(carduuid, target);
            else
                super.moveCard(carduuid, targetOther);
        }
    }

    PopOnGuardCard(_cardUuid)
    {
        return false;
    }


    /**
     * Transfer a RESOURCE/HAZARD between characters
     * 
     * @param {String} _sourceCharacter
     * @param {String} targetCharacter
     * @param {String} cardUuid
     * @param {String} playerId
     * @returns {Boolean}
     */
     CharacterTransferCard(_sourceCharacter, targetCharacter, cardUuid, playerId)
     {
         const pTargetChar = this.characters[targetCharacter];
         if (typeof pTargetChar === "undefined")
         {
             Logger.warn("Undefinied target character "+ targetCharacter);
             return false;
         }
 
         const pCard = this.GetCardByUuid(cardUuid);
         if (pCard === null)
         {
             Logger.warn("Cannot find card " + cardUuid);
             return false;
         }
         else if (pCard.type !== "hazard" && pCard.type !== "resource")
         {
             Logger.warn("Can only transfer hazards or resources");
             return false;
         }
         else if (!this.removeCardFromDeckOrCompany(playerId, cardUuid))
         {
             Logger.warn("Cannot remove card form source owner");
             return false;
         }
 
         if (pCard.type === "hazard")
             pTargetChar.hazards.push(cardUuid);
         else // ist klar wg. IF type check ;; if (pCard.type === "resource")
             pTargetChar.resources.push(cardUuid);
 
         return true;
     }
 
     addNewCharacter(uuid, companyId)
     {
        this.characters[uuid] = this.createNewCharacter(companyId, uuid);
     }
}

module.exports = PlayboardManagerCharacters;