
class ScoringContainers {

    constructor(props, points_min, points_max)
    {
        this._props = props;
        this._points_min = points_min;
        this._points_max = points_max;
    }

    create()
    {
        this.createScoreCard();
        this.createScoreSheet();
    }

    createScoreCardTypes()
    {
        let jChoose_score_type = jQuery("<div/>", { class : "score-type", id: "score-type-choose" });
        
        this._props.forEach(function(entry)
        {
            let _ch = entry.default ? 'checked="checked"' : "";
            if (entry.default)
                jChoose_score_type.attr("default-id", entry.id);

            jChoose_score_type.append(`<div class="score_label"><input type="radio" name="score_type" id="${entry.id}" value="${entry.value}" ${_ch}> <label for="${entry.id}">${entry.label}</label></div>`)
        });

        return jChoose_score_type;
    }

    createScoreCardPoints()
    {
        let jChoose_score_type = jQuery("<div/>", { class : "score-type", id: "score-points-choose" });

        for (let i = this._points_min; i <= this._points_max; i++)
        {
            let _id = i < 0 ? ("score_m" + (i * -1)) : "score_" + i;
            let _label  = i + " " + (i === 1 || i === -1 ? "Point" : "Points");
            jChoose_score_type.append(`<div class="score_label"><input type="radio" name="score_points" id="${_id}" value="${i}"> <label for="${_id}">${_label}</label></div>`)
        };

        jChoose_score_type.attr("default-id", "score_0");
        return jChoose_score_type;
    }
    
    createScoreCard()
    {
        if (jQuery("#scoring-card").length === 1)
            return;

        let jContainer = jQuery("<div/>", {
            id: "scoring-card",
            class: "hidden scoring-card"
        });

        jContainer.append('<div class="menu-overlay"></div>');

        let view_score_container = jQuery("<div/>", { class: "view-score-container blue-box" });
        view_score_container.append('<div class="view-score-card fl"><img src="/media/assets/images/cards/backside.jpg" data-image-path="" data-image-backside="backside.jpg"></div>');;
        
        let jContainerData = jQuery("<div/>", {
            class: "container-data fl"
        });

        jContainerData.append('<h2>Score Card</h2>');

        jContainerData.append(this.createScoreCardTypes());
        jContainerData.append(this.createScoreCardPoints());
       
        jContainerData.append('<input type="button" class="button" value="Score card">');
        
        view_score_container.append(jContainerData);
        view_score_container.append('<div class="clear"></div>');
        jContainer.append(view_score_container);

        jQuery("body").append(jContainer);
    }

    createScoreSheetEntries()
    {
        let jBody = jQuery("<tbody/>");
        this._props.forEach(function(entry)
        {
            jBody.append(`<tr data-score-type="${entry.value}">
                <th>${entry.label}</th>
                <td data-player="self">
                    <a href="#" data-score-action="increase" title="increase"><i class="fa fa-plus-circle" title="increase" aria-hidden="true"></i></a>
                    <span>0</span>
                    <a href="#" data-score-action="decrease" title="decrease"><i class="fa fa-minus-circle" title="decrease" aria-hidden="true"></i></a>
                </td>
            </tr>`);
        });
        return jBody;
    }

    createScoreSheetTable()
    {
        let jTable = jQuery("<table/>");
    
        jTable.append("<thead><tr><th></th><th>You</th></tr></thead>");
        jTable.append(this.createScoreSheetEntries());
        jTable.append(`<tfoot>
                            <tr data-score-type="total" class="score-total">
                                <th>Total</th>
                                <th class="score-total" data-player="self">0</th>
                            </tr>
                            <tr>
                                <th colspan="2" class="text-right">
                                    <input type="button" class="button buttonCancel" value="Cancel">
                                    <input type="button" class="button buttonUpdate" value="Update score">
                                </th>
                            </tr>
                        </tfoot>`);
        
        return jTable;
    }

    createVictoryContainer()
    {
        return `<div class="view-score-victory-container" id="view-score-sheet-card-list">
                    <div class="view-card-list-container blue-box">
                        <div class="container-title-bar">
                            <div class="container-title-bar-title text-center">Your Victory Pile</div>
                            <div class="clear"></div>
                        </div>
                        <div class="container-data"></div>
                        <div class="clear"></div>
                    </div>
                </div>`;
    }

    createScoreSheetContainer()
    {
        let jSheet = jQuery("<div/>", { class: "view-score-container blue-box" });
        jSheet.append(this.createScoreSheetTable());
        return jSheet;
    }


    createScoreSheet()
    {
        if (jQuery("#scoring-sheet").length === 1)
            return;

        let jContainer = jQuery("<div/>", {
            id: "scoring-sheet",
            class: "hidden scoring-sheet"
        });

        jContainer.append('<div class="menu-overlay"></div>');
        jContainer.append(this.createScoreSheetContainer());       
        jContainer.append(this.createVictoryContainer());

        jQuery("body").append(jContainer);
    }

}


function createScoringApp(_MeccgApi, _CardList, _TaskBar)
{
    const MeccgApi = _MeccgApi;
    const CardList = _CardList;
    const TaskBar = _TaskBar;
       
    const SCORING = {
        
        stats : { },
        
        _resetStats : function()
        {
            for (let k in SCORING.stats)
            {
                if (SCORING.stats.hasOwnProperty(k))
                    SCORING.stats[k] = 0;
            }
        },

        _createStatsMap : function(categories)
        {
            categories.forEach(function(entry)
            {
                SCORING.stats[entry.value] = 0;
            });
        },

        _init : function(categories, min, max)
        {
            new ScoringContainers(categories, min, max).create();
            this._createStatsMap(categories);

            if (jQuery("#scoring-card").length === 1)
            {
                jQuery("#scoring-card .menu-overlay")[0].onclick = SCORING.hideScoringCard;
                jQuery("#scoring-card .button")[0].onclick = SCORING.onStoreCard;
            }

            if (jQuery("#scoring-sheet").length === 1)
            {
                jQuery("#scoring-sheet .menu-overlay")[0].onclick = SCORING.hideScoringSheet;
                jQuery("#scoring-sheet .buttonUpdate")[0].onclick = SCORING.onStoreSheet;
                jQuery("#scoring-sheet .buttonCancel")[0].onclick = SCORING.hideScoringSheet;
                
                jQuery("#scoring-sheet table tbody tr a").each(function()
                {
                    this.onclick = SCORING.onChangeScoreValue;
                });
            }
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
        
        onStoreCard : function()
        {
            let sType = SCORING.getCurrentSelectValue("score_type");
            let nPoints = parseInt(SCORING.getCurrentSelectValue("score_points"));
            
            SCORING.hideScoringCard();
            MeccgApi.send("/game/score/add", { type: sType, points: nPoints });
        },
        
        getCurrentSelectValue : function(sName)
        {
            return jQuery('#scoring-card input[name="' + sName + '"]:checked').val()
        },
        
        scoreCard : function(sCardCode)
        {
            if (sCardCode === "" || typeof sCardCode === "undefined")
                return;
            
            this.displayCard(sCardCode);
            this._clickDefault("score-type-choose");
            this._clickDefault("score-points-choose");
            
            jQuery("#scoring-card").removeClass("hidden");
        },

        _clickDefault : function(id)
        {
            let elem = document.getElementById(id);
            if (elem === null)
                return;

            let sId1 = jQuery(elem).attr("default-id");
    
            if (sId1 !== undefined && sId1 !== "")
                jQuery(document.getElementById(sId1)).click();
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
                jQuery("#scoring-sheet .menu-overlay")[0].onclick = () => { return false; };
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
            if (typeof points !== "undefined" && SCORING.stats[type] !== undefined)
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
        
        onChangeScoreValue : function(e)
        {
            let jLink = jQuery(this);
            let bAdd = jLink.attr("data-score-action") === "increase";
            let jSpan = jLink.siblings("span"); 
            let nCount = parseInt(jSpan.html()) + (bAdd ? 1 : -1);
            jSpan.html(nCount);
            
            jSpan = jQuery("#scoring-sheet th.score-total");
            nCount = parseInt(jSpan.html()) + (bAdd ? 1 : -1);
            jSpan.html(nCount);

            e.preventDefault();
            e.stopPropagation();
            console.log("no po")
            return false;
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

    jQuery.get("/data/scores", { }, function(data)
    {
        if (typeof data !== "undefined" && typeof data.categories !== "undefined" && typeof data.points !== "undefined")
            SCORING._init(data.categories, data.points.min, data.points.max);
    });

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
