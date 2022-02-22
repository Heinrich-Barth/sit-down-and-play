
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

    createNewCard(uuid, code, type, id, cssState, turn, token, secondary)
    {
        if (uuid === "")
            return null;
        
        let jDiv = document.createElement("div");
        jDiv.setAttribute("class", "card " + cssState);
        jDiv.setAttribute("id", id);

        let safeCode = this.CardList.getSafeCode(code);

        jDiv.setAttribute("data-uuid", uuid);
        jDiv.setAttribute("data-card-code", safeCode);
        jDiv.setAttribute("data-card-type", type);
        jDiv.setAttribute("draggable", "true");
        jDiv.setAttribute("data-revealed", true);
        jDiv.setAttribute("title", safeCode + ", since turn " + turn);
        jDiv.setAttribute("data-turn", turn);
        jDiv.setAttribute("data-secondary", secondary === undefined ? "" : secondary.toLowerCase());
        if (token !== undefined && token > 0)
            jDiv.setAttribute("data-token", token);

        let jImage = document.createElement("img");
        jImage.setAttribute("class", "card-icon");
        jImage.setAttribute("src", "/media/assets/images/cards/backside.jpg");

        jImage.setAttribute("data-image-backside", this.CardList.getFlipSide(code));
        jImage.setAttribute("data-image-path", "");
        jImage.setAttribute("data-uuid", uuid);
        jImage.setAttribute("decoding", "async");
        jImage.setAttribute("data-revealed", true);
        jImage.setAttribute("data-img-image", this.CardList.getImage(code));

        jDiv.appendChild(jImage);
        return jDiv;
    }

    getTargetContainer(isPlayer, isResource)
    {
        const area = isPlayer ? StagingArea.areaPlayer : StagingArea.areaOpponent;
        return isResource ? area.resources() : area.hazards();
    }

    static areaOpponent = {
        resources : function() { return document.getElementById("staging_area_resources_opponent"); },
        hazards : function() { return document.getElementById("staging_area_hazards_opponent"); }
    }
        
    static areaPlayer = {
        resources : function() { return document.getElementById("staging_area_resources_player"); },
        hazards : function() { return document.getElementById("staging_area_hazards_player"); }
    }

    revealCard(id)
    {
        const elem = document.getElementById(id);
        const img = elem === null ? null : elem.querySelector("img");
        if (img !== null)
            img.setAttribute("src", img.getAttribute("data-image-path") + img.getAttribute("data-img-image"));
    }

    insertNewCard(uuid, isPlayer, code, type, state, turn, token, secondary)
    {
        let isResource;
        if (type === "hazard")
            isResource = false;
        else if (type === "resource")
            isResource = true;
        else
            return "";
        
        const id = "stagecard_" + uuid;
        const css = this.getCardStateCss(state);
        const res = this.createNewCard(uuid, code, type, id, css, turn, token, secondary);
        if (res === null)
            return "";

        this.getTargetContainer(isPlayer, isResource).prepend(res);
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
     * @returns {String} ID of card container
     */
    onAddCardToStagingArea(bIsMe, uuid, code, type, state, revealed, turn, token, secondary)
    {
        if (uuid === "" || code === "" || type === "")
            return "";

        const id = this.insertNewCard(uuid, bIsMe, code, type, state, turn === undefined ? 1 : turn, token, secondary);
        if (id === "")
            return "";
    
        this.CardPreview.addHover(id, true, bIsMe);
        
        if (revealed === undefined || revealed !== false)
            this.revealCard(id);

        this.markCard(id);
        document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: id }} ));
        return id;
    }

    markCard(id)
    {
        CheckForCardsPlayed.markCard(id);
    }
}
