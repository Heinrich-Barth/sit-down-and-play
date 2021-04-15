
function createStagingArea(_CardList, _CardPreview, _ContextMenu)
{
    var CardList = _CardList;
    var CardPreview = _CardPreview;
    var ContextMenu = _ContextMenu;
       
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

    function createNewCard(uuid, code, type, id, cssState)
    {
        if (uuid === "")
            return "";
        
        let jDiv = jQuery("<div>", {
            class : "card " + cssState,
            id : id
        });

        jDiv.attr("data-uuid", uuid);
        jDiv.attr("data-card-code", CardList.getSafeCode(code));
        jDiv.attr("data-card-type", type);
        jDiv.attr("draggable", "true");
        jDiv.attr("data-revealed", true);

        let jImage = jQuery("<img>", {
            class: "card-icon",
            src: "/media/assets/images/cards/backside.jpg"
        });

        jImage.attr("data-image-backside", CardList.getFlipSide(code)); /*"/media/assets/images/cards/backside.jpg");*/
        jImage.attr("data-image-path", "");
        jImage.attr("data-uuid", uuid);
        jImage.attr("decoding", "async");
        jImage.attr("data-revealed", true);
        jImage.attr("data-img-image", CardList.getImage(code));

        jDiv.append(jImage);
        return jDiv;
    }
    
    function getTargetContainer(isPlayer, isResource)
    {
        var area = isPlayer ? stagingarea.player : stagingarea.opponent;
        return isResource ? area.resources() : area.hazards();
    }
    
    
    return {
        
        revealCard : function(id)
        {
            var img = jQuery("#" + id + " img");
            img.attr("src", img.attr("data-image-path") + img.attr("data-img-image"));
        },
        
        insertNewCard : function(uuid, isPlayer, code, type, state)
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
            jQuery(getTargetContainer(isPlayer, isResource)).prepend(createNewCard(uuid, code, type, id, css));
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
        onAddCardToStagingArea : function(bIsMe, uuid, target, code, type, state, revealed)
        {
            if (uuid === "" || code === "" || type === "")
                return "";
            
            var id = this.insertNewCard(uuid, bIsMe, code, type, state);
            if (id === "")
                return "";
           
            CardPreview.addHover(id, true, bIsMe);
            
            if (revealed)
                this.revealCard(id);

            CheckForCardsPlayed.markCard(id);
    
            ContextMenu.initContextMenuGeneric(document.getElementById(id));
            return id;
        }
    };
}

