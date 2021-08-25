
function createStagingArea(_CardList, _CardPreview)
{
    var CardList = _CardList;
    var CardPreview = _CardPreview;
       
    const stagingarea = {
        
        opponent : {
            resources : function() { return document.getElementById("staging_area_resources_opponent"); },
            hazards : function() { return document.getElementById("staging_area_hazards_opponent"); }
        },
        
        player : {
            resources : function() { return document.getElementById("staging_area_resources_player"); },
            hazards : function() { return document.getElementById("staging_area_hazards_player"); }
        }
    };
    
    function getCardStateCss(nState)
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

    function createNewCard(uuid, code, type, id, cssState, turn)
    {
        if (uuid === "")
            return null;
        
        let jDiv = document.createElement("div");
        jDiv.setAttribute("class", "card " + cssState);
        jDiv.setAttribute("id", id);

        let safeCode = CardList.getSafeCode(code);

        jDiv.setAttribute("data-uuid", uuid);
        jDiv.setAttribute("data-card-code", safeCode);
        jDiv.setAttribute("data-card-type", type);
        jDiv.setAttribute("draggable", "true");
        jDiv.setAttribute("data-revealed", true);
        jDiv.setAttribute("title", safeCode + ", since turn " + turn);

        let jImage = document.createElement("img");
        jImage.setAttribute("class", "card-icon");
        jImage.setAttribute("src", "/media/assets/images/cards/backside.jpg");

        jImage.setAttribute("data-image-backside", CardList.getFlipSide(code)); /*"/media/assets/images/cards/backside.jpg");*/
        jImage.setAttribute("data-image-path", "");
        jImage.setAttribute("data-uuid", uuid);
        jImage.setAttribute("decoding", "async");
        jImage.setAttribute("data-revealed", true);
        jImage.setAttribute("data-img-image", CardList.getImage(code));

        jDiv.appendChild(jImage);
        return jDiv;
    }
    
    function getTargetContainer(isPlayer, isResource)
    {
        const area = isPlayer ? stagingarea.player : stagingarea.opponent;
        return isResource ? area.resources() : area.hazards();
    }
    
    return {
        
        revealCard : function(id)
        {
            var img = document.getElementById(id).querySelector("img");
            img.setAttribute("src", img.getAttribute("data-image-path") + img.getAttribute("data-img-image"));
        },
        
        insertNewCard : function(uuid, isPlayer, code, type, state, turn)
        {
            var isResource;
            if (type === "hazard")
                isResource = false;
            else if (type === "resource")
                isResource = true;
            else
                return "";
            
            var id = "stagecard_" + uuid;
            var css = getCardStateCss(state);
            const res = createNewCard(uuid, code, type, id, css, turn);
            if (res === null)
                return "";

            getTargetContainer(isPlayer, isResource).prepend(res);
            return id;
        },
        
        /**
         * Add a card to the staging area
         * 
         * @param {boolean} bIsMe
         * @param {String} uuid 
         * @param {String} target
         * @param {String} code
         * @param {String} type
         * @param {String} state
         * @returns {String} ID of card container
         */
        onAddCardToStagingArea : function(bIsMe, uuid, target, code, type, state, revealed, turn)
        {
            if (uuid === "" || code === "" || type === "")
                return "";

            if (turn === undefined)
                turn = 1;
            
            const id = this.insertNewCard(uuid, bIsMe, code, type, state, turn);
            if (id === "")
                return "";
           
            CardPreview.addHover(id, true, bIsMe);
            
            if (revealed)
                this.revealCard(id);

            CheckForCardsPlayed.markCard(id);
    
            document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: id }} ));
            return id;
        }
    };
}

