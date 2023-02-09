
const createCompanyHtml = function(companyId, id)
{
    const div = document.createElement("div");
    div.setAttribute("class", "company tableCell hiddenVisibility nonEmptyContainer");
    div.setAttribute("id", id);
    div.setAttribute("data-company-id", companyId);
    div.innerHTML = `<div class="company-site-list pos-rel">
                    <div class="location-icon-image fa fa-code-fork location-underdeep location-select-ud hiddenToOpponent" title="Organise underdeep movement"></div>
                    <div class="location-icon-image fa fa-map-signs location-icon location-select hiddenToOpponent" title="Organise region movement"></div>
                    <div class="location-icon-image fa fa-eye location-reveal hide hiddenToOpponent" title="Reveal movement"></div>
                    <div class="sites">
                        <div class="site-container site-current fl"></div>
                        <div class="site-container site-regions fl"></div>
                        <div class="site-container site-target fl"></div>
                        <div class="site-container site-onguard fl"></div>
                        <div class="clear"></div>
                    </div>
                </div>
                <div class="clear"></div>
                <div class="company-characters-add fl"></div>
                <div class="company-characters fl"></div>
                <div class="clear"></div>`;
    return div;
}

const createOpponentContainer = function(sHexPlayerCode, playerId)
{
    let pContainer = document.getElementById("opponent_table");
    if (pContainer === null)
        return null;

    /* check if the container already exists  */
    let jTarget = pContainer.querySelector("[data-player='" + sHexPlayerCode + "']");
    if (jTarget !== null)
        return jTarget;

    /* create new container for opponent */
    const div = document.createElement("div");
    div.setAttribute("class", "col90 companies center-text");
    div.setAttribute("id", "companies_opponent_" + sHexPlayerCode);
    div.setAttribute("data-player", sHexPlayerCode);
    div.innerHTML = `<div class="company tableCell emptyContainer create-new-company hiddenToOpponent" id="create_new_company_opponent_${sHexPlayerCode}">
                        <div class="clear"></div>
                    </div>`;

    pContainer.appendChild(div);

    createOpponentContainerVisitorHand(pContainer, playerId);

    return div;
};

const createOpponentContainerVisitorHand = function(pContainer, playerId)
{
    if (document.body.getAttribute("data-is-watcher") !== "true" || document.getElementById("playercard_hand_container_" + playerId) !== null)
        return;

    const div = document.createElement("div");
    div.setAttribute("id", "playercard_hand_container_" + playerId);
    div.setAttribute("class", "visitor-hand-view");
    pContainer.appendChild(div);

    const eHand = document.getElementById("watch_togglehand");
    if (eHand !== null)
        eHand.click();
}

const getCardStateCss = function(nState)
{
    if (nState === 0)
        return "state_ready";
    else if (nState === 90)
        return "state_tapped";
    else if (nState === 91)
        return "state_tapped_fixed";
    else if (nState === 180)
        return "state_wounded";
    else if (nState === 270)
        return "state_rot270";
    else
        return "";
};

/**
 * creat cCharacter div
 * @param {JSON} jsonCard 
 * @param {String} id 
 * @returns DOM element or empty fragment
 */
const createCharacterHtml = function(jsonCard, id)
{
    const uuid = jsonCard.uuid;
    if (uuid === "" || id === "")
        return document.createDocumentFragment();

    const div = document.createElement("div");
    div.setAttribute("class", "company-character pos-rel fl character-is-company-host");
    div.setAttribute("id", id);
    div.setAttribute("data-character-uuid", uuid);

    let pCharacterContainer = document.createElement("div");
    pCharacterContainer.setAttribute("class", "company-character-container pad10 pos-rel");

    {
        let pCharDiv = document.createElement("div");
        pCharDiv.setAttribute("class", "company-character-host");
        pCharDiv.appendChild(createNewCard(jsonCard));
        pCharacterContainer.appendChild(pCharDiv);
    }

    {
        let pCharDiv = document.createElement("div");
        pCharDiv.setAttribute("class", "company-character-reosurces company-character-reosurces-empty");
        pCharacterContainer.appendChild(pCharDiv);
    }
    

    const pTemp = document.createElement("div");
    pTemp.setAttribute("class", "company-character-influenced");

    div.appendChild(pCharacterContainer);
    div.appendChild(pTemp);      
    return div;
};
 
function insertNewcontainer(bIsPlayer, sHexPlayerCode, companyId, playerId)
{
    const id = "company_" + companyId;
    const pDiv = createCompanyHtml(companyId, id);
    if (pDiv === null)
        return null;

    if (bIsPlayer)
    {
        const pNew = document.getElementById("create_new_company");
        pNew.parentElement.insertBefore(pDiv, pNew);
    }
    else
    {
        const container = createOpponentContainer(sHexPlayerCode, playerId);
        if (container !== null)
            container.appendChild(pDiv);
    }

    return document.getElementById(id);
}

function createLocationCard(code, img, bIsPlayer, sTitle)
{
    let sOwner = bIsPlayer ? "" : "other";
    const div = document.createElement("div");
    div.setAttribute("class", "card padR5 fl");
    div.setAttribute("draggable", "false");
    div.setAttribute("data-card-code", code);
    
    if (sTitle !== undefined && sTitle !== "")
        div.setAttribute("title", sTitle);

    const pImage = document.createElement("img");
    pImage.setAttribute("src", "/data/backside-region");
    pImage.setAttribute("data-owner", sOwner);
    pImage.setAttribute("class", "card-icon");
    pImage.setAttribute("data-img-image", img);
    pImage.setAttribute("data-image-path", "");
    pImage.setAttribute("data-image-backside", "/data/backside");
    pImage.setAttribute("crossorigin", "anonymous");
    div.appendChild(pImage);
    return div;
}

/**
 * Insert a new character container
 * @param {json} jsonCard character card
 * @param {Object} pTargetContainer DOM container
 * @param {boolean} bInsertBefore insert before given element (of append otherwise)
 * @param {boolean} bIsHosting Is hosting character
 * @param {boolean} isRevealed
 * @returns {Object} DOM Container
 */
 function insertNewCharacter(jsonCard, pContainer, bInsertBefore, bIsHosting)
 {
     const id = "character_" + jsonCard.uuid;
     let pHtml = createCharacterHtml(jsonCard, id);
     if (pHtml == null)
         return document.getElementById("test");

     if (!bIsHosting)
     {
         pHtml.classList.remove("character-is-company-host");
         pHtml.classList.add("character-is-company-follower");
     }

     if (bInsertBefore)
         pContainer.parentElement(pHtml, pContainer);
     else
         pContainer.appendChild(pHtml);

     return document.getElementById(id);
 }

 function createNewCard(card)
 {
     if (card.uuid === "")
         return document.createDocumentFragment();

    const _backside = GameCompanies.CardList.getFlipSide(card.code);
    let pImage = document.createElement("img");
    pImage.setAttribute("class", "card-icon");
    pImage.setAttribute("src", _backside);
    pImage.setAttribute("data-image-backside", _backside);
    pImage.setAttribute("data-image-path", "");
    pImage.setAttribute("decoding", "async");
    pImage.setAttribute("crossorigin", "anonymous");
    pImage.setAttribute("data-uuid", card.uuid);
    pImage.setAttribute("data-img-image", GameCompanies.CardList.getImage(card.code));

     if (typeof card.owner === "undefined" || card.owner === "")
         pImage.setAttribute("data-owner", "");
     else
     {
         let bIsMyCard = MeccgPlayers.isChallenger(card.owner) ? "" : card.owner;
         pImage.setAttribute("data-owner", bIsMyCard);
     }
         
     pImage.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

     let pDiv = document.createElement("div");
     pDiv.setAttribute("class", "card " + getCardStateCss(card.state));
     pDiv.setAttribute("id", GameCompanies.CARDID_PREFIX + card.uuid);
     pDiv.setAttribute("data-uuid", card.uuid);
     pDiv.setAttribute("data-card-code", GameCompanies.CardList.getSafeCode(card.code));
     pDiv.setAttribute("data-card-type", card.type);
     pDiv.setAttribute("draggable", "true");
     pDiv.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

     if (card.token !== undefined && card.token > 0)
     {
         pDiv.setAttribute("data-token", card.token);
         pDiv.setAttribute("title", "Tokens: " + card.token);
     }       

     pDiv.appendChild(pImage);
     return pDiv;
 }

const GameCompanies = {

    CardList : null,
    CardPreview : null,
    HandCardsDraggable : null,
    PlayerSelector : new PlayerSelector(),

    CARDID_PREFIX : "ingamecard_",
    TITLE_SITE_DEST: "Destination site. Drop hazards to play onguard or to the site or DOUBLECLICK to let arrive",
    TITLE_SITE_ORIGIN : "Site of origin/current site",

    initCompanyManager : function(_CardList, _CardPreview, _HandCardsDraggable)
    {
        GameCompanies.CardList = _CardList;
        GameCompanies.CardPreview = _CardPreview;
        GameCompanies.HandCardsDraggable = _HandCardsDraggable;
        return GameCompanies;
    },

    updateLastSeen : function(username, isOnline)
    {
        GameCompanies.PlayerSelector.updateLastSeen(username, isOnline)
    },

    removePlayerIndicator : function(username)
    {
        GameCompanies.PlayerSelector.removePlayerIndicator(username)
    },
    
    updateHandSize : function(username, nCount, nCountPlaydeck)
    {
        GameCompanies.PlayerSelector.updateHandSize(username, nCount, nCountPlaydeck);
    },
    
    clearLastSeen : function()
    {
        GameCompanies.PlayerSelector.clearLastSeen();
    },

    character: {

        /**
         * Remove a character container from table
         * 
         * @param {string} uuid
         * @returns {void}
         */
        removeExistingCharacter: function (uuid)
        {
            DomUtils.removeNode(document.getElementById("character_" + uuid));
        },

        addResources: function (vsList, pContainer)
        {
            if (vsList.length === 0 || pContainer === null)
                return 0;

            for (let elem of vsList)
                pContainer.appendChild(createNewCard(elem));

            return vsList.length;
        },

        addInfluenced: function (vsList, pContainer)
        {
            if (vsList.length === 0 || pContainer === null)
                return 0;

            for (let elem of vsList)
                GameCompanies.character.add(elem, pContainer, false, false);

            return vsList.length;
        },

        /**
         * add a character to a given company if not already existent
         * @param {json} jsonCharacter
         * @param {Object} pContainer
         * @param {boolean} bInsertBeforeTarget insert before given element (of append otherwise)
         * @param {boolean} bIsHosting is hosting character
         * @returns {Object} Container DOM element
         */
        add(jsonCharacter, pContainer, bInsertBeforeTarget, bIsHosting)
        {
            /* remove, if the character is in the company. It is easier to redraw than to match which items are new etc. */
            GameCompanies.character.removeExistingCharacter(jsonCharacter.character.uuid);

            let pCharacter = insertNewCharacter(jsonCharacter.character, pContainer, bInsertBeforeTarget, bIsHosting);

            const pContainerResources = pCharacter.querySelector(".company-character-reosurces");
            
            let nAdded = 0;
            nAdded += this.addResources(jsonCharacter.resources, pContainerResources);
            nAdded += this.addResources(jsonCharacter.hazards, pContainerResources);

            if (nAdded === 0)
                pContainerResources.classList.add("hosts_nothing");
            else
                pContainerResources.classList.remove("hosts_nothing");

            pContainerResources.setAttribute("data-stack-size", nAdded);

            this.addInfluenced(jsonCharacter.influenced, pCharacter.querySelector(".company-character-influenced"));
            
            ArrayList(pCharacter).find("img.card-icon").each(function (img)
            {
                if (img.getAttribute("data-revealed") === "true")
                    img.setAttribute("src", img.getAttribute("data-image-path") + img.getAttribute("data-img-image"));
            });

            return pCharacter;
        }
    },

    removeCompany: function (sId)
    {
        DomUtils.removeNode(document.getElementById("company_" + sId));
    },

    removeAllEmptyCompanies : function()
    {
        ArrayList(document).find(".company").each((company) => {

            if (company.classList.contains("create-new-company") || company.getAttribute("id") === "create_new_company")
                return;
            
            if (ArrayList(company).find(".company-character-host").size() === 0)
                DomUtils.removeNode(company);
        });
    },

    removeEmptyCompanies: function (vsIds)
    {
        for (let id of vsIds)
            this.removeCompany(id);

        this.removeAllEmptyCompanies();      
    },

    player2Hex: function (sInput)
    {
        return GameCompanies.PlayerSelector.player2Hex(sInput);
    },
    
    /**
     * Attach a hazard to companies site
     * 
     * @param {String} companyId
     * @param {String} code
     * @param {String} cardUuid
     * @param {String} state
     * @param {String} reveal
     * @return {void}
     */
    onAttachCardToCompanySites : function(companyId, cardList, bAllowContextMenu)
    {
        if (cardList.length === 0)
            return;

        const companyElement = document.getElementById("company_" + companyId);
        if (companyElement === null)
        {
            console.warn("Cannot find company " + companyId);
            return;
        }

        let jOnGuardContainer = companyElement.querySelector(".site-onguard");
        if (jOnGuardContainer === null)
        {
            console.warn("Cannot find on-guard site of company " + companyId);
            return;
        }

        const isPlayersCompany = this.isPlayersCompany(companyElement);
        const pCheckForCardsPlayed = new CheckForCardsPlayed("ingamecard_");
        pCheckForCardsPlayed.loadBefore(jOnGuardContainer);

        const len = cardList.length;
        for (let i = 0; i < len; i++)
            this.onAttachCardToCompanySitesElement(jOnGuardContainer, cardList[i], bAllowContextMenu, isPlayersCompany);

        pCheckForCardsPlayed.loadAfter(jOnGuardContainer);
        pCheckForCardsPlayed.mark();
    },
    
    onAttachCardToCompanySitesElement : function(pOnGuardContainer, card, bAllowContextMenu, isPlayersCompany)
    {
        pOnGuardContainer.appendChild(createNewCard(card));
        
        let pCard = document.getElementById(GameCompanies.CARDID_PREFIX + card.uuid);
        if (pCard === null)
        {
            console.warn("Cannot find card #" + GameCompanies.CARDID_PREFIX + card.uuid);
            return;
        }

        if (isPlayersCompany)
            GameCompanies.CardPreview.init(pCard, true, true);
        else
            GameCompanies.CardPreview.initOnGuard(pCard, true, false);

        GameCompanies.initSingleCardEvent(pCard, true);
        
        if (bAllowContextMenu)
            document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: GameCompanies.CARDID_PREFIX + card.uuid, type: "onguard" }} ));
        
        if (card.revealed || typeof card.revealed === "undefined")
            GameCompanies.revealCard(pCard.querySelector("img"));
    },
    
    tapSite : function(playerId, code, bIsTapped)
    {
        function getTargetContainer(isMe, playerCode)
        {
            if (playerCode !== "")
            {
                if (isMe)
                    return document.getElementById("player_companies");
                else
                    return document.getElementById("opponent_table").querySelector(".companies[data-player='" + playerCode + "']");
            }
            else
                return null;
        }

        const container = getTargetContainer(MeccgPlayers.isChallenger(playerId), this.player2Hex(playerId));
        ArrayList(container).findByClassName("company").each(function (company)
        {
            ArrayList(company).findByClassName("site-container").each(function (sitecontainer)
            {
                const pThis = sitecontainer.querySelector('div[data-card-code="' + code + '"]');
                if (pThis !== null)
                {
                    if (bIsTapped)
                        pThis.classList.add("state_tapped");
                    else
                        pThis.classList.remove("state_tapped");
                }
            });
        });
    },

    requireCompanyContainer : function(bIsMe, compnanyId, playerId, pCheckForCardsPlayed)
    {
        const pElemContainer = document.getElementById("company_" + compnanyId);
        if (pElemContainer !== null)
        {
            pCheckForCardsPlayed.loadBefore(pElemContainer);
            ArrayList(pElemContainer).find(".company-characters").each(DomUtils.removeAllChildNodes);

            return pElemContainer;
        }
        else
        {

            const sHexPlayerCode = this.player2Hex(playerId);
            if (sHexPlayerCode === "")
                return null;

            const elemContainer = insertNewcontainer(bIsMe, sHexPlayerCode, compnanyId, playerId);
            if (document.body.getAttribute("data-is-watcher") === "true")
            {
                document.body.dispatchEvent(new CustomEvent("meccg-visitor-addname", { "detail": {
                    id: "companies_opponent_" + sHexPlayerCode,
                    player: playerId
                }}));
            }

            return elemContainer;
        }   
    },

    /**
     * draw a company on screen
     * 
     * @param {json} jsonCompany The Company JSON object
     * @returns {Boolean} success state
     */
    drawCompany: function (bIsMe, jsonCompany)
    {
        if (typeof jsonCompany !== "object" ||
            typeof jsonCompany.id === "undefined" || 
            typeof jsonCompany.characters === "undefined" ||
            jsonCompany.characters.length === 0)
        {
            return false;
        }
        const pCheckForCardsPlayed = new CheckForCardsPlayedCompany("ingamecard_");

        const elemContainer = this.requireCompanyContainer(bIsMe, jsonCompany.id, jsonCompany.playerId, pCheckForCardsPlayed);
        const pPlayerCompany = document.getElementById("company_" + jsonCompany.id);
        
        if (elemContainer === null)
            return false;

        const elemList = elemContainer.querySelector(".company-characters");
        if (elemList === null)
            return false;
            
        for (let _char of jsonCompany.characters)
            this.character.add(_char, elemList, false, true);

        this.drawLocations(jsonCompany.id, jsonCompany.sites.current, jsonCompany.sites.regions, jsonCompany.sites.target, jsonCompany.sites.revealed, jsonCompany.sites.attached, jsonCompany.sites.current_tapped, jsonCompany.sites.target_tapped);

        /** 
         * important: cards not my own must to be dragged around,
         * unless they are in my company.
         */
        if (!bIsMe && !this.isPlayersCompany(pPlayerCompany))
        {
            ArrayList(elemContainer).find(".card").each(function(jThis)
            {
                const sType = jThis.getAttribute("data-card-type");
                if (sType !== null && sType !== "hazard")
                    jThis.setAttribute("draggable", "false");
            });
        }

        ArrayList(elemList).find(".card").each(function (div)
        {
            if (bIsMe)
                GameCompanies.CardPreview.initOnGuard(div, true, bIsMe);
            else
                GameCompanies.CardPreview.init(div, true, bIsMe);

            GameCompanies.initSingleCardEvent(div, false);
        });

        if (pPlayerCompany !== null && bIsMe)
            GameCompanies.HandCardsDraggable.initOnCompany(elemContainer);

        ArrayList(elemList).find("div.card").each((_e) => document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: _e.getAttribute("id"), type: "generic" }} )));
        elemContainer.classList.remove("hiddenVisibility");

        
        this.highlightNewCardsAtTable(elemContainer, pCheckForCardsPlayed);
        return true;
    },

    highlightNewCardsAtTable(elemContainer, pCheckForCardsPlayed)
    {
        if (elemContainer !== null)
        {
            pCheckForCardsPlayed.loadAfter(elemContainer);
            pCheckForCardsPlayed.mark();
        }
    },

    initSingleCardEvent : function(pCardDiv, isOnGuardCard)
    {
        if (pCardDiv === null)
            return;

        pCardDiv.setAttribute("data-location", "inplay");

        if (isOnGuardCard || pCardDiv.getAttribute("data-card-type") !== "character")
            GameCompanies.HandCardsDraggable.initOnCardResource(pCardDiv);
        else
            GameCompanies.HandCardsDraggable.initOnCardCharacter(pCardDiv);
    },

    revealCard : function(pImage)
    {
        const src = pImage.getAttribute("data-image-path") + pImage.getAttribute("data-img-image");
        pImage.setAttribute("src", src);
    },

    revealLocations: function (company)
    {
        const companyElem = document.getElementById("company_" + company);
        if (companyElem === null)
            return;

        const jSiteContaienr = companyElem.querySelector(".sites");
        ArrayList(jSiteContaienr).find(".site-current .card-icon").each(GameCompanies.revealCard);
        ArrayList(jSiteContaienr).find(".site-regions .card-icon").each(GameCompanies.revealCard);
        ArrayList(jSiteContaienr).find(".site-target .card-icon").each(GameCompanies.revealCard);
        ArrayList(companyElem).find(".location-reveal").each((e) => e.classList.add("hide"));
    },

    isPlayersCompany : function(pCompany)
    {
        const parent = DomUtils.findParentByClass(pCompany, "companies");
        return parent !== null && parent.getAttribute("id") === "player_companies";
    },

    detectIsAgentCompany : function(companyContainer)
    {
        if (companyContainer == null)
            return false;
        
        let bHasRevealed = false;
        let nCharacters = 0;
        
        ArrayList(companyContainer.querySelectorAll(".company-character-host")).each(function(elem)
        {
            const img = elem.querySelector("img.card-icon");
            if (img !== null)
            {
                nCharacters++;
                if (img.getAttribute("src") !== "/data/backside")
                    bHasRevealed = true;
            }
        });

        return nCharacters === 1 && !bHasRevealed;
    },

    drawLocations: function (company, start, regions, target, isRevealed, attached, current_tapped, target_tapped, revealStartSite)
    {
        let code, img;
        if (revealStartSite === undefined)
            revealStartSite = true;

        const companyElem = document.getElementById("company_" + company);
        if (companyElem === null)
            return;

        const bIsPlayer = this.isPlayersCompany(companyElem);
        const isAgent = this.detectIsAgentCompany(companyElem);

        ArrayList(companyElem.querySelectorAll(".site-container")).each(DomUtils.removeAllChildNodes);

        if (start === undefined)
            start = "";

        if (target === undefined)
            target = "";

        if (regions === undefined)
            regions = [];

        if (isRevealed === undefined)
            isRevealed = false;

        if (!isRevealed && isAgent)
            revealStartSite = false;

        if (start !== "")
        {
            code = GameCompanies.CardList.getSafeCode(start);
            img = GameCompanies.CardList.getImageSite(start);
            companyElem.querySelector(".site-current").appendChild(createLocationCard(code, img, bIsPlayer, GameCompanies.TITLE_SITE_ORIGIN));

            if (revealStartSite)
                ArrayList(companyElem).find(".site-current img.card-icon").each((_img) => _img.setAttribute("src", _img.getAttribute("data-image-path") + _img.getAttribute("data-img-image")));
            
            if (current_tapped)
                ArrayList(companyElem).find(".site-current .card").each((elem) => elem.classList.add("state_tapped"));
            
            if (bIsPlayer)
                document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: true, code: code }} ));
        }

        if (target !== "")
        {
            code = GameCompanies.CardList.getSafeCode(target);
            img = GameCompanies.CardList.getImageSite(target);


            const pContainerTarget = companyElem.querySelector(".site-target");
            DomUtils.removeAllChildNodes(pContainerTarget);
            pContainerTarget.appendChild(createLocationCard(code, img, bIsPlayer, GameCompanies.TITLE_SITE_DEST));
            
            if (!bIsPlayer)
                document.body.dispatchEvent(new CustomEvent('meccg-context-site-arrive', { detail: { id: "company_" + company, company: company, code: code }} ));
            else
                document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: false, code: code }} ));
            
            if (target_tapped)
                ArrayList(pContainerTarget).find(".card").each((e) => e.classList.add("state_tapped"));

            ArrayList(companyElem).find(".location-reveal").each((e) => e.classList.remove("hide"));
        }
        else
            ArrayList(companyElem).find(".location-reveal").each((e) => e.classList.add("hide"));


        if (attached.length > 0)
            this.onAttachCardToCompanySites(company, attached, true);

        const pContainerReg = companyElem.querySelector(".site-regions");
        DomUtils.removeAllChildNodes(pContainerReg);

        for (let _reg of regions)
        {
            code = GameCompanies.CardList.getSafeCode(_reg);
            img = GameCompanies.CardList.getImageRegion(_reg);
            pContainerReg.appendChild(createLocationCard(code, img, bIsPlayer, "Region moved through. Drop hazard creates here"));
        }

        if (target !== "" && isRevealed)
            this.revealLocations(company);

        if (!bIsPlayer)
        {
            this.allowOnGuard(company, companyElem.querySelector(".site-current"), false);
            this.allowOnGuardRegion(company, companyElem.querySelector(".site-regions"), true);
            this.allowOnGuard(company, companyElem.querySelector(".site-target"), false);
        }

        ArrayList(companyElem).find(".site-container").each(function(elem)
        {
            const _isOnGuard = elem.classList.contains("site-onguard");

            const list = elem.querySelectorAll("div");
            const len = list === null ? 0 : list.length;

            for (let i = 0; i < len; i++)
            {
                if ((bIsPlayer && !_isOnGuard) || (!bIsPlayer && _isOnGuard))
                    GameCompanies.CardPreview.initOnGuard(list[i], true, bIsPlayer);
                else
                    GameCompanies.CardPreview.init(list[i], true, bIsPlayer);
            }
        });
    },

    onDropOnGuard: function (companyUuid, pCard, bRevealOnDrop)
    {
        if (pCard.getAttribute("data-location") === "hand")
        {
            const uuid = pCard.getAttribute("data-uuid");
            DomUtils.removeNode(pCard);
            MeccgApi.send("/game/company/location/attach", {uuid: uuid, companyUuid: companyUuid, reveal: bRevealOnDrop});
        }

        return false;
    },
    
    /**
     * 
     * @param {String} companyUuid
     * @param {Object} pSiteTarget
     * @param {boolean} bAutoReveal
     * @return {void}
     */
    allowOnGuard: function (companyUuid, pSiteTarget, bAutoReveal)
    {
        const sCompanyUuid = companyUuid;
        const bRevealOnDrop = bAutoReveal;
        
        jQuery(pSiteTarget).droppable(
        {
            tolerance: "pointer",
            classes: {"ui-droppable-hover": "on-drag-over", addClasses: false},
            accept: function (elem)
            {
                return elem.attr("data-location") === "hand";
            },
            drop: function (_event, ui)
            {
                GameCompanies.onDropOnGuard(sCompanyUuid, ui.draggable[0], bRevealOnDrop);
                return false;
            }
        });
    },
    /**
     * 
     * @param {String} companyUuid
     * @param {Object} pSiteTarget
     * @param {boolean} bAutoReveal
     * @return {void}
     */
    allowOnGuardRegion: function (companyUuid, pSiteTarget, bAutoReveal)
    {
        const sCompanyUuid = companyUuid;
        const bRevealOnDrop = bAutoReveal;

        jQuery(pSiteTarget).droppable(
        {
            tolerance: "pointer",
            classes: {"ui-droppable-hover": "on-drag-over", addClasses: false},
            accept: function (elem)
            {
                return elem.attr("data-location") === "hand" && elem.attr("data-card-type") === "hazard";
            },
            drop: function (_event, ui)
            {
                GameCompanies.onDropOnGuard(sCompanyUuid, ui.draggable[0], bRevealOnDrop);
                return false;
            }
        });
    },

    onEnterStartPhase: function ()
    {
        document.querySelector(".taskbar .startphase").classList.add("act");
    },
    
    readyCardsInContainer : function(pContainer)
    {
        ArrayList(pContainer).find(".company-character div.card").each((e) =>
        {
            if (e.classList.contains("state_tapped"))
                e.classList.remove("state_tapped");
        });
    },

    onEnterOrganisationPhase: function (sCurrent, bIsMe)
    {
        if (bIsMe)
        {
            const container = document.getElementById("player_companies");
            GameCompanies.readyCardsInContainer(container);
            GameCompanies.prefillEmptyMovementToCurrentSite(container)
        }
        else
            GameCompanies.readyCardsInContainer(document.getElementById("opponent_table").querySelector(".companies[data-player='" + this.player2Hex(sCurrent) + "']"));
    },

    prefillEmptyMovementToCurrentSite : function()
    {
        /** todo */
    },

    onEnterMovementHazardPhase: function ()
    {
        /** not needed here */
    },

    onArriveAtTarget: function (pSites)
    {
        const pTarget = pSites.querySelector(".site-target div");
        if (pTarget === null)
            return;

        const pCurrent = pSites.querySelector(".site-current");
        DomUtils.removeAllChildNodes(pCurrent);

        pTarget.setAttribute("title", GameCompanies.TITLE_SITE_ORIGIN);

        pCurrent.appendChild(pTarget);
        DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
    },

    onArriveAtOrigin: function (pSites)
    {
        if (pSites !== null)
        {
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-target"));
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
        }
    },

    onEnterSitePhase: function (sCurrent, bIsMe)
    {
        if (bIsMe)
            ArrayList(document.getElementById("player_companies")).find(".company-site-list .sites").each(GameCompanies.onArriveAtTarget);
        else
        {
            const sHex = this.player2Hex(sCurrent);
            const pOpponent = document.getElementById("companies_opponent_" + sHex);
            if (pOpponent !== null)
                GameCompanies.onArriveAtTarget(pOpponent.querySelector(".sites"));
        }
    },
    
    onCompanyArrivesAtDestination: function (sCompanyId, bReduceSites)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= document.getElementById("company_" + sCompanyId);
            if (pCompany !== null)
                GameCompanies.onArriveAtTarget(pCompany.querySelector(".sites"));
        }
        
        document.body.dispatchEvent(new CustomEvent("meccg-highlight", { "detail": sCompanyId }));
    },

    onCompanyReturnsToOrigin : function (sCompanyId, bReduceSites)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= document.getElementById("company_" + sCompanyId);
            if (pCompany !== null)
                GameCompanies.onArriveAtOrigin(pCompany.querySelector(".sites"));
        }
        
        document.body.dispatchEvent(new CustomEvent("meccg-highlight", { "detail": sCompanyId }));
    },

    onMenuActionClear: function (elem)
    {
        if (elem === null)
            return elem;

        elem.classList.remove("state_ready");
        elem.classList.remove("state_tapped");
        elem.classList.remove("state_tapped_fixed");
        elem.classList.remove("state_rot270");
        elem.classList.remove("state_wounded");
        return elem;
    },
    onMenuActionReadySite: function (ownerId, code)
    {
        GameCompanies.tapSite(ownerId, code, false);
    },
    onMenuActionTapSite: function (ownerId, code)
    {
        GameCompanies.tapSite(ownerId, code, true);
    },
    
    onMenuActionReady: function (uuid)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
    },

    onMenuActionTap: function (uuid, _code, bForced)
    {
        const elem = this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
        if (elem !== null)
            elem.classList.add(bForced ? "state_tapped_fixed" : "state_tapped");
    },

    onMenuActionWound: function (uuid)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_wounded");
    },

    onMenuActionRot270: function (uuid)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_rot270");
    },
    
    /**
     * Set the current player (player turn!)
     * @param {String} sPlayerId
     * @param {boolean} bIsMe
     * @return {void}
     */
    setCurrentPlayer : function(sPlayerId, bIsMe)
    {
        GameCompanies.PlayerSelector.setCurrentPlayer(sPlayerId, bIsMe);
    },

    onMenuActionGlow: function (uuid)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pElem === null)
            return;

        if (pElem.classList.contains("glowing"))
        {
            pElem.classList.remove("glowing");
            return;
        }

        pElem.classList.add("glowing");
        setTimeout(() => pElem.classList.remove("glowing"), 6000);
    },

    onMenuActionHighlight:  function (uuid)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (!pElem.classList.contains("card-highlight"))
            plem.classList.add("card-highlight");
    },

    onMenuActionRevealCard: function (uuid, reveal)
    {
        const pImage = uuid === "" ? null : document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pImage === null)
            return;

        let src;
        if (reveal)
            src = pImage.getAttribute("data-image-path") + pImage.getAttribute("data-img-image");
        else
            src = pImage.getAttribute("data-image-backside");

        if (src !== "")
            pImage.setAttribute("src", src);
    },

    onRemoveCardsFromGame: function (listUuid)
    {
        for (let uuid of listUuid)
            DomUtils.removeNode(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
    },

    onRemoveEmptyCompanies: function ()
    {
        ArrayList(document).find(".company").each(function (e)
        {
            if (e.getAttribute("id") !== "create_new_company")
                GameCompanies.onRemoveEmptyCompaniesCheckChars(e.querySelector(".company-characters"));
        });

        GameCompanies.removeAllEmptyCompanies();
    },

    onRemoveEmptyCompaniesCheckChars: function (elem)
    {
        if (ArrayList(elem).find(".card").size() === 0)
            DomUtils.unbindAndRemove(jQuery(elem).closest(".company"));
    }
};

