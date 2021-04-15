

function createScoringApp(_MeccgApi, _CardList, _TaskBar)
{
    const MeccgApi = _MeccgApi;
    const CardList = _CardList;
    const TaskBar = _TaskBar;
       
    const SCORING = {
        
        stats : { },
        
        _resetStats : function()
        {
            SCORING.stats = {
                stage: 0,
                character : 0, 
                ally : 0,
                item : 0,
                faction : 0,
                kill : 0,
                misc : 0
            };  
        },
        
        _init : function()
        {
            this._resetStats();
            
            jQuery("#scoring-card .menu-overlay").click(SCORING.hideScoringCard);
            jQuery("#scoring-card .button").click(SCORING.onStoreCard);
            jQuery("#scoring-sheet .menu-overlay").click(SCORING.hideScoringSheet);
            jQuery("#scoring-sheet .buttonUpdate").click(SCORING.onStoreSheet);
            jQuery("#scoring-sheet .buttonCancel").click(SCORING.hideScoringSheet);
            
            jQuery("#scoring-sheet table tbody tr a").click(function(e)
            {
                SCORING.onChangeScoreValue(jQuery(this));
                e.preventDefault();
                return false;
            });
        },
        
        hideScoringCard : function()
        {
            jQuery("#scoring-card").addClass("hidden");
            jQuery("#view-score-sheet-card-list .container-data").empty();

            jQuery("#scoring-card .score-type").removeClass("req");
            jQuery("#scoring-card .score-points").removeClass("req");
        },
        
        hideScoringSheet : function()
        {
            if (!jQuery("#scoring-sheet").hasClass("final-score"))
            {
                jQuery("#scoring-sheet").addClass("hidden");
                jQuery("#scoring-sheet span").each(function() 
                {
                    this.innerHTML = "0";
                });
            }
        },
        
        displayCard : function(sCode)
        {
            let jImg = jQuery("#scoring-card .view-score-card img");
            let sSrc = jImg.attr("data-image-path") + CardList.getImage(sCode);
            jImg.attr("src", sSrc);
        },

        checkRequired : function(sType, nPoints)
        {
            let jContainer = jQuery("#scoring-card");

            if (sType === "")
                jContainer.find(".score-type").addClass("req");
            else
                jContainer.find(".score-type").removeClass("req");

            if (nPoints === 0)
                jContainer.find(".score-points").addClass("req");
            else
                jContainer.find(".score-points").removeClass("req");

            return sType !== "" && nPoints !== 0;
        },
        
        onStoreCard : function()
        {
            let sType = SCORING.getCurrentSelectValue("score-type");
            let nPoints = parseInt(SCORING.getCurrentSelectValue("score-points"));
            
            if (SCORING.checkRequired(sType, nPoints))
            {
                SCORING.hideScoringCard();
                MeccgApi.send("/game/score/add", { type: sType, points: nPoints });
            }
        },
        
        getCurrentSelectValue : function(sClass)
        {
            return jQuery("#scoring-card ." + sClass).val();
        },
        
        scoreCard : function(sCardCode)
        {
            if (sCardCode === "" || typeof sCardCode === "undefined")
                return;
            
            this.displayCard(sCardCode);
            jQuery("#scoring-card").removeClass("hidden");
        },
        
        _showScoreSheet : function(jData, bAllowUpdate)
        {
            if (typeof jData === "undefined")
                return;
                
            let jTable = jQuery("#scoring-sheet table tbody");
            let _elem;
            let player;
            let points, total;

            for (var key in jData)
            {
                total = 0;
                player = MeccgApi.isMe(key) ? "self" : key;
                for (var type in jData[key])
                {
                    points = jData[key][type];
                    _elem = jTable.find('tr[data-score-type="'  + type + '"] td[data-player="'+player+'"]');
                    if (player === "self")
                        _elem = _elem.find("span");
                    
                    _elem.html(points);
                    
                    if (type !== "stage")
                        total += points;
                }
                
                jQuery('#scoring-sheet table tfoot tr.score-total th[data-player="'+player+'"]').html(total);
            }

            if (!bAllowUpdate)
            {
                jQuery("#scoring-sheet").addClass("final-score");
                jQuery("#view-score-sheet-card-list").remove();
                jQuery("#scoring-sheet .menu-overlay").removeClass("hidden");
                jQuery("#scoring-sheet .menu-overlay").click(function(e)
                {
                    /* avoid close on click - the game has finally ended! */
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });

            }
            
            jQuery("#scoring-sheet").removeClass("hidden");
        },
        
        showScoreSheetCards : function(listCards)
        {
            if (typeof listCards !== "undefined" && listCards.length > 0)
                TaskBar.onShowVictorySheet(listCards);
        },

        showScoreSheet : function(jData)
        {
            this._showScoreSheet(jData, true);
        },
        
        showFinalScore : function(jData)
        {
            this._showScoreSheet(jData, false);
        },
        
        _updateStats : function(type, points)
        {
            switch(type)
            {
                case "stage":
                case "character":
                case "ally":
                case "item":
                case "faction":
                case "kill":
                case "misc":
                    break;
                default: 
                    return;
            }
            
            if (typeof points !== "undefined")
                SCORING.stats[type] = points;
        },
        
        onStoreSheet : function()
        {
            SCORING._resetStats();
            
            jQuery('#scoring-sheet table tbody td[data-player="self"]').each(function()
            {
                let jThis = jQuery(this);
                let nScore = parseInt(jThis.find("span").html());
                let type = jThis.closest("tr").attr("data-score-type");
                SCORING._updateStats(type, nScore);
            });
            
            SCORING.hideScoringSheet();
            MeccgApi.send("/game/score/update", SCORING.stats);
            
        },
        
        onChangeScoreValue : function(jLink)
        {
            let bAdd = jLink.attr("data-score-action") === "increase";
            let jSpan = jLink.siblings("span"); 
            let nCount = parseInt(jSpan.html()) + (bAdd ? 1 : -1);
            jSpan.html(nCount);
            
            jSpan = jQuery("#scoring-sheet th.score-total");
            nCount = parseInt(jSpan.html()) + (bAdd ? 1 : -1);
            jSpan.html(nCount);
        },
        
        addPlayers : function(sMyId, jMap)
        {
            for (var _playerId in jMap)
            {
                if (sMyId !== _playerId)
                    SCORING.addPlayer(_playerId, jMap[_playerId]);
            }
        },
        
        addPlayer : function(sPlayerId, sName)
        {
            let jTable = jQuery("#scoring-sheet table");
            
            jTable.find("thead tr").append("<th>" + sName + "</th>");
            jTable.find("tbody tr").each(function()
            {
                jQuery(this).append("<td data-player=\"" + sPlayerId + "\">0</td>");
            });
            jTable.find("tfoot tr.score-total").append("<th data-player=\"" + sPlayerId + "\">0</th>");
        },
    };

    SCORING._init();

    return {

        addPlayers: function(sMyId, jNameMap)
        {
            SCORING.addPlayers(sMyId, jNameMap);
        },

        scoreCard : function(sCardCode)
        {
            SCORING.scoreCard(sCardCode);
        },

        showScoreSheet : function(jData)
        {
            SCORING.showScoreSheet(jData);
        },

        showScoreSheetCards : function(jData)
        {
            SCORING.showScoreSheetCards(jData);
        },

        showFinalScore: function(jData)
        {
            SCORING.showFinalScore(jData);
        }
    };
}
