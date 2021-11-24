
const PlayboardManagerStagingArea = require("./PlayboardManagerStagingArea");

class PlayboardManagerCompanies extends PlayboardManagerStagingArea
{
    constructor(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer)
    {
        super(_listAgents, _eventManager, _gameCardProvider, isSinglePlayer);
        
        this.companies = { };
    }

    reset()
    {
        super.reset();
        
        this.companies = { };
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        let data = super.Save();

        data.companies = this.companies;

        return data;
    }

    Restore(playboard)
    {
        super.Restore(playboard);

        this.companies = {};

        for (let companyid in playboard.companies)
        {
            let _company = playboard.companies[companyid];
            let newCompany = {
                id: companyid,
                playerId: this.AssertString(_company.playerId),
                characters: [],
                sites: { 
                    current: "",
                    regions: [],
                    target: "",
                    attached: [],
                    revealed: false
                }
            };

            for (let char of _company.characters)
            {
                const _character = {
                    uuid: this.AssertString(char.uuid),
                    influenced: this.ArrayUUIDClone(char.influenced)
                };

                newCompany.characters.push(_character);
            }

            if (_company.sites !== undefined)
            {
                newCompany.sites.current = this.AssertString(_company.sites.current);
                newCompany.sites.target = this.AssertString(_company.sites.target);
                newCompany.sites.regions = this.ArrayUUIDClone(_company.sites.regions);
                newCompany.sites.attached = this.ArrayUUIDClone(_company.sites.attached);
                newCompany.sites.revealed = _company.sites.revealed === true;
            }

            this.companies[companyid] = newCompany;
        }
    }


    /**
      * Remove empty companies 
      * @returns {Array|String} List of company ids removed 
      */
    removeEmptyCompanies()
    {
        var keys = [];
        for (var key in this.companies)
        {
            if (this.companies[key].characters.length === 0)
            {
                this.discardCompanyOnGuardCards(key);
                keys.push(key);
            }
        }

        for (var i = 0; i < keys.length; i++)
        {
            console.log("Company " + key + " is empty and will be removed.");
            delete this.companies[keys[i]];
        }

        return keys;
    }

    /**
     * Remove all onguard cards for a given company
     * @param {String} companyUuid
     * @return {void}
     */
    discardCompanyOnGuardCards(companyUuid)
    {
        if (!this.companyExists(companyUuid))
            return;

        var _uuid, jCard, pDeck;
        var vsSites = this.companies[companyUuid].sites.attached;
        for (var i = 0; i < vsSites.length; i++)
        {
            _uuid = vsSites[i];
            jCard = this.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : super.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
                pDeck.push().toDiscardpile(_uuid);
        }

        this.companies[companyUuid].sites = [];
    }
 
    /**
      * Remove a single card from site onguard list
      * @param {String} uuid
      * @param {String} companyUuid
      * @return {Boolean} success
      */
    discardCompanyOnGuardCard(uuid, companyUuid)
    {
        if (!this.companyExists(companyUuid))
            return false;

        let _uuid, jCard, pDeck;
        let vsSites = this.companies[companyUuid].sites.attached;
        for (let i = vsSites.length - 1; i >= 0; i--)
        {
            _uuid = vsSites[i];
            if (_uuid !== uuid)
                continue;

            jCard = this.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : super.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
            {
                pDeck.push().toDiscardpile(_uuid);
                vsSites.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    PopOnGuardCard(cardUuid)
    {
        let _list, count, _uuid;
        for (let key in this.companies) 
        {
            _list = this.companies[key].sites.attached;
            count = _list.length;
            for (let i = count - 1; i >= 0; i--)
            {
                _uuid = _list[i];
                if (_uuid === cardUuid)
                {
                    _list.splice(i, 1);
                    return true;
                }
            }
        }

        return false;
    }

    linearizeCompanyCharacter(companyCharacter)
    {
        var list = [];
    
        if (typeof companyCharacter.influenced === "undefined" || typeof companyCharacter.uuid === "undefined" )
            return list;
    
        for (var y = 0; y < companyCharacter.influenced.length; y++)
            list.push(companyCharacter.influenced[y]);
    
        list.push(companyCharacter.uuid);
        return list;
    }
    /**
     * Add a company character to a given target company. It does not check if the company character is already in this company!
     * 
     * @param {String} targetCompanyId
     * @param {String} hostingCharacterUuid ID or empty (=general influence)
     * @param {JSON} companyCharacter
     * @returns {Boolean}
     */
     addCompanyCharacterToCompany(targetCompanyId, hostingCharacterUuid, companyCharacter)
     {
         var targetCompany = this.companies[targetCompanyId];
         if (typeof targetCompany === "undefined")
         {
             console.log("Target company does not exist: " + targetCompanyId);
             return false;
         }
 
         var listAdded = [];
 
         if (hostingCharacterUuid === "") /* add to target company list */
         {
             targetCompany.characters.push(companyCharacter);
             listAdded.push(companyCharacter.uuid);
         }
         else
         {
             var _host;
 
             listAdded = this.linearizeCompanyCharacter(companyCharacter);
             for (var i = 0; i < targetCompany.characters.length; i++)
             {
                 _host = targetCompany.characters[i];
                 if (_host.uuid === hostingCharacterUuid)
                 {
                     for (var y = 0; y < listAdded.length; y++)
                         _host.influenced.push(listAdded[y]);
 
                     break;
                 }
             }
         }
 
        super.addCompanyCharacterToCompany(targetCompanyId, hostingCharacterUuid, listAdded);
        return true;
     }

     /**
      * Join a company
      * 
      * @param {String} uuid Character to join
      * @param {String} source 
      * @param {String} companyId target company
      * @param {String} playerId player id
      * @returns {Boolean} Success state
      */
    JoinCompany(uuid, source, companyId, playerId)
    {
        var pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            console.log("Cannot find player deck");
            return false;
        }

        if (source === "hand")
        {
            pDeck.pop().fromHand(uuid);

            this.companies[companyId].characters.push({ uuid: uuid, influenced : [] });
            this.addNewCharacter(uuid,this.createNewCharacter(companyId, uuid));
        }
        else
        {
            var card = this.popCompanyCharacter(uuid);
            if (!this.addCompanyCharacterToCompany(companyId, "", card))
            {
                console.log("Character " + uuid + " cannot join company " + companyId);
                return false;
            }
        }
  
        return true;
    }
  
      /**
       * Join another character -- only possible if character does not theirself has
       * other characters under direct influence
       * 
       * @param {String} uuid Character to join
       * @param {String} targetcharacter target host character
       * @param {String} targetCompany target company
       * @param {String} playerId player id
       * @returns {String} Company Id
       */
    JoinCharacter(uuid, targetcharacter, targetCompany, playerId)
    {
        this.getOrCreateCharacter(uuid, targetCompany);

        var card = this.popCompanyCharacter(uuid);
        if (!this.addCompanyCharacterToCompany(targetCompany, targetcharacter, card))
        {
            let sNew = this.getCardCode(uuid, "Unknown character");
            console.log("Character " + sNew + " cannot join company " + targetCompany);
            return false;
        }
        else
        {
            let sNew = this.getCardCode(uuid, "Unknown character");
            let sHost = this.getCardCode(targetcharacter, "unknown host");
            console.log("Character " + sNew + " joined " + sHost + " under direct influence in company " + targetCompany);
            return true;
        }
    }
  

    ReadyCompanyCards(companyUuid)
    {
        if (!this.companyExists(companyUuid))
        {
            console.log("Company does not exist.");
            return;
        }

        var _companyCharacter, _characterInfuenced;
        var _list = this.companies[companyUuid].characters;
        for (var i = 0; i < _list.length; i++)
        {
            _companyCharacter = _list[i];

            super.readyCard(_companyCharacter.uuid);
            super.readyResources(_companyCharacter.uuid);

            for (var y = 0; y < _companyCharacter.influenced.length; y++)
            {
                _characterInfuenced = _companyCharacter.influenced[y];

                super.readyCard(_characterInfuenced);
                super.readyResources(_characterInfuenced);
            }
        }
    }
    /**
     * Get a characters current location
     * @param {String} uuid
     * @return {String} Location Code
     */
     getCharactersCurrentLocation(uuid)
     {
         var _list, _companyCharacter, _found;
         for (var key in this.companies)
         {
             _list = this.companies[key].characters;
             for (var i = 0; i < _list.length; i++)
             {
                 _found = false;
                 _companyCharacter = this.companies[key].characters[i];
                 if (_companyCharacter.uuid === uuid)
                     _found = true;
                 else /* check influenced characters */
                 {
                     for (var y = 0; y < _companyCharacter.influenced.length; y++)
                     {
                         if (_companyCharacter.influenced[y] === uuid)
                             _found = true;
                     }
                 }
 
                 if (_found)
                     return this.companies[key].sites.current;
             }
         }
 
         return "";
     }
 
     /**
      * Set the companies current location
      * @param {String} companyUuid
      * @param {String} sLocationCode
      * @returns {void} 
      */
      SetCompanyStartSite(companyUuid, sStart, vsRegions, sTarget)
      {
          if (this.companies[companyUuid] !== undefined)
          {
              let jCompanySites = this.companies[companyUuid].sites;
              jCompanySites.current = sStart;
              jCompanySites.regions = vsRegions;
              jCompanySites.target = sTarget;
              jCompanySites.revealed = false;
          }
      }
   
     /**
      * Reveal company sites
      * @param {String} companyUuid
      * @returns {void} 
      */
      RevealCompanyDestinationSite(companyUuid)
      {
          if (this.companyExists(companyUuid))
              this.companies[companyUuid].sites.revealed = true;
      }
  
      CompanyArrivedAtDestination(companyUuid)
      {
          if (!this.companyExists(companyUuid))
              return;
          
          var jCompanySites = this.companies[companyUuid].sites;
          if (jCompanySites.target !== "")
          {
              jCompanySites.current = jCompanySites.target;
              jCompanySites.target = "";
          }
  
          jCompanySites.regions = [];
          jCompanySites.revealed = false;
      }
  
     /**
      * Add a hazard to a company location
      * @param {String} cardUuid
      * @param {String} companyUuid
      * @returns {success state} 
      */
      AddHazardToCompanySite(cardUuid, companyUuid)
      {
          if (!this.companyExists(companyUuid))
          {
              console.log("Cannot find company " + companyUuid);
              return false;
          }
  
          let vsSites = this.companies[companyUuid].sites.attached;
          for (let i = 0; i < vsSites.length; i++)
          {
              if (cardUuid === vsSites[i])
                  return false;
          }
  
          vsSites.push(cardUuid);
          return true;
      }
  
    popCompanyCharacter0(uuid)
    {
        var card = {
            uuid: uuid,
            sourceCompany : "",
            influenced : []
        };

        var _list, _companyCharacter;
        for (var key in this.companies)
        {
            card.sourceCompany = key;

            _list = this.companies[key].characters;
            for (var i = 0; i < _list.length; i++)
            {
                _companyCharacter = this.companies[key].characters[i];
                if (_companyCharacter.uuid === uuid)
                {
                    /* pop character and all influenced characters */
                    card.uuid = _companyCharacter.uuid;
                    for (var y = 0; y < _companyCharacter.influenced.length; y++)
                        card.influenced.push(_companyCharacter.influenced[y]);

                    _list.splice(i, 1);
                    return card;
                }
                else /* check influenced characters */
                {
                    for (var y = 0; y < _companyCharacter.influenced.length; y++)
                    {
                        if (_companyCharacter.influenced[y] === uuid)
                        {
                            _companyCharacter.influenced.splice(y, 1);
                            return card;
                        }
                    }
                }
            }
        }

        console.log("Character has not yet been in any other company.");
        return card;
    }

    /**
     * Remove a character from a company
     * 
     * @param {String} uuid Character UUID
     * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
     */
    popCompanyCharacter(uuid)
    {
        /**
         * Remove a character (and its influenced characters) form its company
         * @param {String} uuid
         * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
         */
        return this.popCompanyCharacter0(uuid);
    }
 
    /**
      * Create a new company
      * 
      * @param {type} uuid Character UUID
      * @param {type} source 
      * @param {type} playerId
      * @returns {String} Company Id
      */
    CreateNewCompany(uuid, source, playerId)
    {
        if (uuid === "" || source === "" || playerId === "")
            return "";

        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
            return "";

        let vsInfluenced = [];
        let currentLocation = "";

        const companyId = this.obtainUniqueCompanyId(playerId);
        if (source === "hand")
        {
            pDeck.pop().fromHand(uuid);
        }
        else
        {
            currentLocation = this.getCharactersCurrentLocation(uuid);
            vsInfluenced = this.popCompanyCharacter(uuid).influenced;
        }

        this.companies[companyId] = this.createNewCompanyWithCharacter(companyId, playerId, uuid, vsInfluenced, currentLocation);
       
        const pChar = this.getOrCreateCharacter(uuid, companyId);
        pChar.parentUuid = "";
        pChar.companyId = companyId;

        return companyId;
      }

  
 
    /**
     * Get the company ids belonging to a given player id
     * 
     * @param {String} playerId
     * @returns {Array}
     */
     GetCompanyIds(playerId)
     {
         var list = [];
 
         for (var key in this.companies) 
         {
             if (playerId !== "" && this.companies[key].playerId === playerId)
                 list.push(key);
         }
 
         return list;
     }
  
 
     companyExists(uuid)
     {
         return typeof this.companies[uuid] !== "undefined";
     }
 
     GetCompanyAttachedLocationCards(companyId)
     {
         let res = {
             current: "",
             current_tapped : false,
             regions: [],
             target: "",
             target_tapped : false,
             attached : [],
             revealed : false
         };
 
         if (companyId === "" || typeof this.companies[companyId] === "undefined")
             return res;
 
         let sOwnerId = this.companies[companyId].playerId;
         let jSites = this.companies[companyId].sites;
         let _list = [];
         
         for (var i = 0; i < jSites.attached.length; i++)
         {
             let _card = this.GetCardByUuid(jSites.attached[i]);
             if (_card !== null)
                 _list.push(_card);
         }
 
         res.current = jSites.current;
         res.regions = jSites.regions;
         res.target = jSites.target;
         res.revealed = jSites.revealed;
         res.attached = _list;
         res.current_tapped = this.IsSiteTapped(sOwnerId, jSites.current);
         res.target_tapped = this.IsSiteTapped(sOwnerId, jSites.target);
                 
         return res;
     }
     
    /**
     * Get the first company character card by company id
     * @param {String} companyId
     * @return json or null
     */
    GetFirstCompanyCharacterCardByCompanyId(companyId)
    {
        if (companyId === "" || typeof this.companies[companyId] === "undefined")
        {
            console.log("Cannot find company by its id " + companyId + " (GetFirstCompanyCharacterCardByCompanyId)");
            return null;
        }

        var vsChars = this.companies[companyId].characters;
        for (var i = 0; i < vsChars.length; i++)
            return this.GetCardByUuid(vsChars[i].uuid);

        return null;
    }

    _addCharacter(jsonChar, targetList)
    {
        if (typeof jsonChar === "undefined" || typeof jsonChar.uuid === "undefined")
            return;

        var _card = this.GetCardByUuid(jsonChar.uuid);
        if (_card === null)
        {
            console.log("Cannot get card from " + jsonChar.uuid);
            return;
        }

        const pChar = this.getCharacterByUuid(jsonChar.uuid);
        if (pChar === null)
        {
            console.log("Cannot find character by it " + jsonChar.uuid);
            return;
        }

        var elem = {
                character : _card,
                resources : [],
                hazards : [],
                influenced : [] // in itself a list of characters (i.e. this elem field)
        };

        if (typeof pChar.resources !== "undefined" && pChar.resources.length > 0)
            elem.resources = this.toCardList(pChar.resources);

        if (typeof pChar.hazards !== "undefined" && pChar.hazards.length > 0)
            elem.hazards = this.toCardList(pChar.hazards);

        if (typeof jsonChar.influenced !== "undefined")
        {
            for (var i = 0; i < jsonChar.influenced.length; i++)
                this._addCharacter({uuid : jsonChar.influenced[i], influenced : []}, elem.influenced);
        }

        targetList.push(elem);
    }

    GetFullCompanyByCompanyId(companyId)
    {
        if (companyId === "" || typeof this.companies[companyId] === "undefined")
        {
            console.log("Cannot find company by its id " + companyId + " (GetFullCompanyByCompanyId)");
            return null;
        }

        var company = {
            id : companyId,
            characters : [],
            sites : this.GetCompanyAttachedLocationCards(companyId),
            playerId : this.companies[companyId].playerId
        };

        var vsChars = this.companies[companyId].characters;
        for (var i = 0; i < vsChars.length; i++)
            this._addCharacter(vsChars[i], company.characters);

        return company;
    }
/*
var company = {
    id : companyId,
    characters : [],
    sites : PLAYBOARD_MANAGER.GetCompanyAttachedLocationCards(companyId),
    playerId : PLAYBOARD_MANAGER.companies[companyId].playerId
};

var vsChars = PLAYBOARD_MANAGER.companies[companyId].characters;
for (var i = 0; i < vsChars.length; i++)
    addCharacter(vsChars[i], company.characters);

*/    
}

module.exports = PlayboardManagerCompanies;