class GameCompanyLocation 
{
    constructor(GameCompanies, _CardList, _CardPreview, CARDID_PREFIX)
    {
        this.pGameCompanies = GameCompanies;
        this.CardList = _CardList;
        this.CardPreview = _CardPreview;
        this.CARDID_PREFIX = CARDID_PREFIX;
    }

    static TITLE_SITE_DEST = "Destination site. Drop hazards to play onguard or to the site or DOUBLECLICK to let arrive";
    static TITLE_SITE_ORIGIN = "Site of origin/current site";


    createLocationCard(code, img, bIsPlayer, sTitle)
    {
        let sOwner = bIsPlayer ? "" : "other";
        const div = document.createElement("div");
        div.setAttribute("class", "card");
        div.setAttribute("draggable", "false");
        div.setAttribute("data-card-code", code);
        
        if (sTitle !== undefined && sTitle !== "")
            div.setAttribute("title", sTitle);

        const pImage = document.createElement("img");
        pImage.setAttribute("src", "/data/backside-region");
        pImage.setAttribute("data-owner", sOwner);
        pImage.setAttribute("class", "card-icon");
        pImage.setAttribute("data-img-image", img);
        pImage.setAttribute("data-image-backside", "/data/backside");
        pImage.setAttribute("crossorigin", "anonymous");
        div.appendChild(pImage);
        return div;
    }

    clearSiteContainer(companyElem)
    {
        ArrayList(companyElem.querySelectorAll(".site-container")).each(DomUtils.removeAllChildNodes);
    }

    getCompanyContainer(company)
    {
        return document.getElementById("company_" + company);
    }

    drawStartSite(company, companyElem, start, bIsPlayer, revealStartSite, current_tapped)
    {
        const code = this.CardList.getSafeCode(start);
        const img = this.CardList.getImageSite(start);

        const pCard = this.createLocationCard(code, img, bIsPlayer, GameCompanyLocation.TITLE_SITE_ORIGIN);
        companyElem.querySelector(".site-current").appendChild(pCard);

        if (revealStartSite)
            ArrayList(companyElem).find(".site-current img.card-icon").each((_img) => _img.setAttribute("src", _img.getAttribute("data-img-image")));
        
        if (current_tapped)
            ArrayList(companyElem).find(".site-current .card").each((elem) => elem.classList.add("state_tapped"));
        
        if (bIsPlayer)
        {
            this.initSiteCardDraggable(pCard);
            document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: true, code: code }} ));
        }
    }

    initSiteCardDraggable(pCardDiv)
    {
        if (!pCardDiv.classList.contains("ui-draggable"))
        {
            pCardDiv.setAttribute("draggable", "true");
            pCardDiv.setAttribute("data-location", "sites");
            pCardDiv.setAttribute("data-card-type", "site");
            HandCardsDraggable.initDraggableCard(pCardDiv);
        }
    }

    drawTargetSite(company, companyElem, target, bIsPlayer, target_tapped)
    {
        const code = this.CardList.getSafeCode(target);
        const img = this.CardList.getImageSite(target);

        const pContainerTarget = companyElem.querySelector(".site-target");

        DomUtils.removeAllChildNodes(pContainerTarget);
        const pCardDiv = this.createLocationCard(code, img, bIsPlayer, GameCompanies.TITLE_SITE_DEST);
        pContainerTarget.appendChild(pCardDiv);
        
        if (!bIsPlayer)
            document.body.dispatchEvent(new CustomEvent('meccg-context-site-arrive', { detail: { id: "company_" + company, company: company, code: code }} ));
        else
        {
            this.initSiteCardDraggable(pCardDiv);
            document.body.dispatchEvent(new CustomEvent('meccg-context-site', { detail: { id: "company_" + company, company: company, start: false, code: code }} ));
        }
        
        if (target_tapped)
            ArrayList(pContainerTarget).find(".card").each((e) => e.classList.add("state_tapped"));

        this.revealLocations(companyElem);
    }

    revealLocations(companyElem)
    {
        ArrayList(companyElem).find(".location-reveal").each((e) => e.classList.remove("hide"));
    }

    revealMovement(company)
    {
        const companyElem = this.getCompanyContainer(company);
        if (companyElem === null)
            return;

        const jSiteContaienr = companyElem.querySelector(".sites");
        ArrayList(jSiteContaienr).find(".site-current .card-icon").each(this.revealCard);
        ArrayList(jSiteContaienr).find(".site-regions .card-icon").each(this.revealCard);
        ArrayList(jSiteContaienr).find(".site-target .card-icon").each(this.revealCard);
        ArrayList(companyElem).find(".location-reveal").each((e) => e.classList.add("hide"));
    }

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
    onAttachCardToCompanySites(companyId, cardList, bAllowContextMenu)
    {
        if (cardList.length === 0)
            return;

        const companyElement = this.getCompanyContainer(companyId);
        if (companyElement === null)
        {
            console.warn("Cannot find company " + companyId);
            return;
        }

        const jOnGuardContainer = companyElement.querySelector(".site-onguard");
        if (jOnGuardContainer === null)
        {
            console.warn("Cannot find on-guard site of company " + companyId);
            return;
        }

        const isPlayersCompany = this.pGameCompanies.isPlayersCompany(companyElement);
        const pCheckForCardsPlayed = new CheckForCardsPlayed("ingamecard_");
        pCheckForCardsPlayed.loadBefore(jOnGuardContainer);

        const len = cardList.length;
        for (let i = 0; i < len; i++)
            this.onAttachCardToCompanySitesElement(jOnGuardContainer, cardList[i], bAllowContextMenu, isPlayersCompany);

        pCheckForCardsPlayed.loadAfter(jOnGuardContainer);
        pCheckForCardsPlayed.mark();
    }

    onAttachCardToCompanySitesElement(pOnGuardContainer, card, bAllowContextMenu, isPlayersCompany)
    {
        pOnGuardContainer.appendChild(createNewCard(card));
        
        const pCard = document.getElementById(this.CARDID_PREFIX + card.uuid);
        if (pCard === null)
        {
            console.warn("Cannot find card #" + this.CARDID_PREFIX + card.uuid);
            return;
        }

        if (isPlayersCompany)
            this.CardPreview.init(pCard);
        else
            this.CardPreview.initOnGuard(pCard);

        this.pGameCompanies.initSingleCardEvent(pCard, true);
        
        if (bAllowContextMenu)
            document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: this.CARDID_PREFIX + card.uuid, type: "onguard" }} ));
        
        if (card.revealed || typeof card.revealed === "undefined")
            this.revealCard(pCard.querySelector("img"));
    }

    revealCard(pImage)
    {
        pImage.setAttribute("src", pImage.getAttribute("data-img-image"));
    }

    drawRegions(companyElem, regions, bIsPlayer, bHasTargetSite)
    {
        const pContainerReg = companyElem.querySelector(".site-regions");
        DomUtils.removeAllChildNodes(pContainerReg);

        if (regions.length === 0)
            return;

        /*  target site can be in the same region but this gives away certain information about the movement. 
            So always show at least 2 regions */
        if (bHasTargetSite && regions.length === 1)
            regions.push("" + regions[0]);

        for (let _reg of regions)
        {
            const code = this.CardList.getSafeCode(_reg);
            const img = this.CardList.getImageRegion(_reg);
            pContainerReg.appendChild(this.createLocationCard(code, img, bIsPlayer, "Region moved through. Drop hazard creates here"));
        }
    }

    onArriveAtTarget(pSites)
    {
        const pTarget = pSites.querySelector(".site-target div");
        if (pTarget === null)
            return;

        const pCurrent = pSites.querySelector(".site-current");
        DomUtils.removeAllChildNodes(pCurrent);

        pTarget.setAttribute("title", GameCompanyLocation.TITLE_SITE_ORIGIN);

        pCurrent.appendChild(pTarget);
        DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
    }

    drawLocations(company, start, regions, target, isRevealed, attached, current_tapped, target_tapped, revealStartSite)
    {
        const companyElem = this.getCompanyContainer(company);
        if (companyElem === null)
            return;

        this.clearSiteContainer(companyElem);

        const bIsPlayer = this.pGameCompanies.isPlayersCompany(companyElem);
        const isAgent = this.pGameCompanies.detectIsAgentCompany(companyElem);

        console.log("isAgent ", isAgent);

        if (target === undefined)
            target = "";

        if (regions === undefined)
            regions = [];

        if (isRevealed === undefined)
            isRevealed = false;

        if (!isRevealed && isAgent)
            revealStartSite = false;
        else if (revealStartSite === undefined)
            revealStartSite = true; 

        if (start !== undefined && start !== "")
            this.drawStartSite(company, companyElem, start, bIsPlayer, revealStartSite, current_tapped);

        if (target !== "")
            this.drawTargetSite(company, companyElem, target, bIsPlayer, target_tapped);
        else
            this.revealLocations(companyElem);

        if (attached.length > 0)
            this.onAttachCardToCompanySites(company, attached, true);

        this.drawRegions(companyElem, regions, bIsPlayer, target !== "");

        if (target !== "" && isRevealed)
            this.revealMovement(company);

        if (!bIsPlayer)
        {
            this.allowOnGuard(company, companyElem.querySelector(".site-current"), false);
            this.allowOnGuardRegion(company, companyElem.querySelector(".site-regions"), true);
            this.allowOnGuard(company, companyElem.querySelector(".site-target"), false);
        }

        this.initOnGuards(companyElem, bIsPlayer);
    }

    initOnGuards(companyElem, bIsPlayer)
    {
        ArrayList(companyElem).find(".site-container").each((elem) =>
        {
            const _isOnGuard = elem.classList.contains("site-onguard");

            const list = elem.querySelectorAll("div");
            const len = list === null ? 0 : list.length;

            for (let i = 0; i < len; i++)
            {
                if ((bIsPlayer && !_isOnGuard) || (!bIsPlayer && _isOnGuard))
                    this.CardPreview.initOnGuard(list[i]);
                else
                    this.CardPreview.init(list[i]);
            }
        });
    }

    /**
     * 
     * @param {String} companyUuid
     * @param {Object} pSiteTarget
     * @param {boolean} bAutoReveal
     * @return {void}
     */
    allowOnGuardRegion(companyUuid, pSiteTarget, bAutoReveal)
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
                GameCompanyLocation.onDropOnGuard(sCompanyUuid, ui.draggable[0], bRevealOnDrop);
                return false;
            }
        });
    }

    static onDropOnGuard(companyUuid, pCard, bRevealOnDrop)
    {
        if (pCard.getAttribute("data-location") === "hand")
        {
            const uuid = pCard.getAttribute("data-uuid");
            DomUtils.removeNode(pCard);
            MeccgApi.send("/game/company/location/attach", {uuid: uuid, companyUuid: companyUuid, reveal: bRevealOnDrop});
        }

        return false;
    }

    /**
     * 
     * @param {String} companyUuid
     * @param {Object} pSiteTarget
     * @param {boolean} bAutoReveal
     * @return {void}
     */
    allowOnGuard(companyUuid, pSiteTarget, bAutoReveal)
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
                GameCompanyLocation.onDropOnGuard(sCompanyUuid, ui.draggable[0], bRevealOnDrop);
                return false;
            }
        });
    }

    onCompanyReturnsToOrigin(sCompanyId, bReduceSites)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= this.getCompanyContainer(sCompanyId);
            if (pCompany !== null)
                this.onArriveAtOrigin(pCompany.querySelector(".sites"));
        }
        
        document.body.dispatchEvent(new CustomEvent("meccg-highlight", { "detail": sCompanyId }));
    }

    onCompanyArrivesAtDestination(sCompanyId, bReduceSites)
    {
        if (typeof bReduceSites === "undefined" || bReduceSites)
        {
            const pCompany= document.getElementById("company_" + sCompanyId);
            if (pCompany !== null)
                this.onArriveAtTarget(pCompany.querySelector(".sites"));
        }
        
        document.body.dispatchEvent(new CustomEvent("meccg-highlight", { "detail": sCompanyId }));
    }

    /**
     * Remove target and region site cards
     * @param {DOMElement} pSites 
     */
    onArriveAtOrigin(pSites)
    {
        if (pSites !== null)
        {
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-target"));
            DomUtils.removeAllChildNodes(pSites.querySelector(".site-regions"));
        }
    }

}