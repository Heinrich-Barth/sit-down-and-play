
class StagingArea
{
    constructor(_CardList, _CardPreview)
    {
        this.CardList = _CardList;
        this.CardPreview = _CardPreview;
    }

    getCardStateCss(nState)
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
    }

    createNewCard(uuid, code, type, id, cssState = "", turn = 0, token = 0, secondary = "")
    {
        if (uuid === "")
            return null;
        
        let jDiv = document.createElement("div");
        jDiv.setAttribute("class", "card " + cssState);
        jDiv.setAttribute("id", id);

        const safeCode = this.CardList.getSafeCode(code);

        jDiv.setAttribute("data-uuid", uuid);
        jDiv.setAttribute("data-card-code", safeCode);
        jDiv.setAttribute("data-card-type", type);
        jDiv.setAttribute("draggable", "true");
        jDiv.setAttribute("data-revealed", "true");
        jDiv.setAttribute("title", safeCode + ", since turn " + turn);
        jDiv.setAttribute("data-turn", turn);
        jDiv.setAttribute("data-secondary", secondary.toLowerCase());
        if (token > 0)
            jDiv.setAttribute("data-token", token);

        let jImage = document.createElement("img");
        jImage.setAttribute("class", "card-icon");
        jImage.setAttribute("src", "/data/backside");
        jImage.setAttribute("crossorigin", "anonymous");
        jImage.setAttribute("data-image-backside", this.CardList.getFlipSide(code));
        jImage.setAttribute("data-uuid", uuid);
        jImage.setAttribute("decoding", "async");
        jImage.setAttribute("data-revealed", true);
        jImage.setAttribute("data-img-image", this.CardList.getImage(code));

        jDiv.appendChild(jImage);
        return jDiv;
    }

    /**
     * Get the target container based on given input. If the specific cannot be found,
     * a fallback is obtained to consider caching or backwards compatibility.
     * 
     * @param {boolean} isPlayer 
     * @param {boolean} isResource 
     * @param {boolean} isFaction 
     * @param {boolean} isStage 
     * @returns HTML element
     */
    #getTargetContainer(isPlayer, isResource, isFaction, isStage)
    {
        const area = this.#getTargetContainerSpecific(isPlayer, isResource, isFaction, isStage);
        return area !== null ? area : this.#getTargetContainerSpecific(isPlayer, isResource, false, false);
    }

    #getTargetContainerSpecific(isPlayer, isResource, isFaction, isStage)
    {
        const area = isPlayer ? StagingArea.areaPlayer : StagingArea.areaOpponent;
        if (!isResource)
            return area.hazards();
        else if (isFaction)
            return area.factions();
        else if (isStage)
            return area.stage();
        else
            return area.resources();
    }

    static areaOpponent = {
        resources : function() { return document.getElementById("staging_area_resources_opponent"); },
        factions : function() { return document.getElementById("staging_area_factions_opponent"); },
        hazards : function() { return document.getElementById("staging_area_hazards_opponent"); },
        stage : function() { return document.getElementById("staging_area_stage_opponent"); }
    }
        
    static areaPlayer = {
        resources : function() { return document.getElementById("staging_area_resources_player"); },
        factions : function() { return document.getElementById("staging_area_factions_player"); },
        hazards : function() { return document.getElementById("staging_area_hazards_player"); },
        stage : function() { return document.getElementById("staging_area_stage_player"); }
    }

    revealCard(id)
    {
        const elem = document.getElementById(id);
        const img = elem === null ? null : elem.querySelector("img");
        if (img !== null)
            img.setAttribute("src", img.getAttribute("data-img-image"));
    }

    #insertNewCard(uuid, isPlayer, code, type, state, turn, token, secondary, stage)
    {
        let isResource;
        if (type === "hazard")
            isResource = false;
        else if (type === "resource")
            isResource = true;
        else
            return "";
        
        const id = "stagecard_" + uuid;
        if (document.getElementById(id) !== null)
            return "";

        const css = this.getCardStateCss(state);
        const res = this.createNewCard(uuid, code, type, id, css, turn, token, secondary);
        if (res === null)
            return "";

        const isFacion = isResource && secondary.toLowerCase() === "faction";
        const isStage = !isFacion && stage === true;
        const container = this.#getTargetContainer(isPlayer, isResource, isFacion, isStage);
        if (container === null)
            return "";

        if (isFacion)
            container.append(res);
        else
            container.prepend(res);
        return id;
    }

    /**
     * Add a card to the staging area
     * 
     * @param {boolean} bIsMe
     * @param {String} uuid 
     * @param {String} target
     * @param {String} code
     * @param {String} type
     * @param {String} state
     * @param {Boolean} revealed
     * @param {Number} turn
     * @param {Number} token
     * @param {String} secondary
     * @param {Boolean} stage
     * @returns {String} ID of card container
     */
    onAddCardToStagingArea(bIsMe, uuid, code, type, state, revealed, turn, token, secondary, stage)
    {
        if (uuid === "" || code === "" || type === "")
            return "";

        const id = this.#insertNewCard(uuid, bIsMe, code, type, state, turn === undefined ? 1 : turn, token, secondary, stage);
        if (id === "")
            return "";
    
        this.CardPreview.addHover(id, true, bIsMe);
        
        if (revealed === undefined || revealed !== false)
            this.revealCard(id);

        this.markCard(id);
        document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: id, type: "generic" }} ));
        return id;
    }

    markCard(id)
    {
        CheckForCardsPlayed.markCard(id);
    }
}
