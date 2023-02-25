
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
        const div = document.createElement("div");
        div.setAttribute("id", "score-type-choose");
        div.setAttribute("class", "score-type");
        
        this._props.forEach(function(entry)
        {
            let _ch = entry.default ? 'checked="checked"' : "";
            if (entry.default)
                div.setAttribute("default-id", entry.id);

            let elem = document.createElement("div");
            elem.setAttribute("class", "score_label");
            elem.innerHTML = `<input type="radio" name="score_type" id="${entry.id}" value="${entry.value}" ${_ch}> <label id="${entry.id}_label" for="${entry.id}">${entry.label}</label>`;
            div.appendChild(elem);
        });

        return div;
    }

    createScoreCardPoints()
    {
        const jChoose_score_type = document.createElement("div");
        jChoose_score_type.setAttribute("id", "score-points-choose");
        jChoose_score_type.setAttribute("class", "score-type");
        jChoose_score_type.setAttribute("default-id", "score_0");

        for (let i = this._points_min; i <= this._points_max; i++)
        {
            const _id = i < 0 ? ("score_m" + (i * -1)) : "score_" + i;
            const _label  = i + " " + (i === 1 || i === -1 ? "Point" : "Points");

            const div = document.createElement("div");
            div.setAttribute("class", "score_label");
            div.innerHTML = `<input type="radio" name="score_points" id="${_id}" value="${i}"> <label for="${_id}" id="${_id}_points">${_label}</label>`;
            jChoose_score_type.appendChild(div);
        }

        
        return jChoose_score_type;
    }
    
    createScoreCard()
    {
        if (document.getElementById("scoring-card") !== null)
            return;

        const jContainer = document.createElement("div");
        jContainer.setAttribute("id", "scoring-card");
        jContainer.setAttribute("class", "hidden scoring-card");
        jContainer.innerHTML = '<div class="menu-overlay"></div>';

        let div = document.createElement("div");
        div.setAttribute("class", "view-score-card fl");
        div.innerHTML = `<img src="/data/backside" data-image-path="" data-image-backside="/data/backside">`;

        let view_score_container = document.createElement("div");
        view_score_container.setAttribute("class", "view-score-container blue-box");
        view_score_container.appendChild(div);
        
        let jContainerData = document.createElement("div");
        jContainerData.setAttribute("class", "container-data fl");

        {
            const _temp = document.createElement("h2");
            _temp.innerHTML = "Score Card";
            jContainerData.appendChild(_temp);
        }
        
        jContainerData.appendChild(this.createScoreCardTypes());
        jContainerData.appendChild(this.createScoreCardPoints());
       
        {
            const _temp = document.createElement("input");
            _temp.setAttribute("type", "button");
            _temp.setAttribute("class", "button");
            _temp.setAttribute("value", "Score card");
            jContainerData.appendChild(_temp);
        }      
        
        view_score_container.appendChild(jContainerData);

        {
            const _temp = document.createElement("div");
            _temp.setAttribute("class", "clear");
            view_score_container.appendChild(_temp);
        }
        
        jContainer.appendChild(view_score_container);

        document.body.appendChild(jContainer);

    }

    createScoreSheetEntries()
    {
        let jBody = document.createElement("tbody");
        this._props.forEach(function(entry)
        {
            const tr = document.createElement("tr");
            tr.setAttribute("data-score-type", entry.value);
            tr.innerHTML = `
                <th>${entry.label}</th>
                <td data-player="self">
                    <a href="#" data-score-action="increase" title="increase"><i class="fa fa-plus-circle" title="increase" aria-hidden="true"></i></a>
                    <span>0</span>
                    <a href="#" data-score-action="decrease" title="decrease"><i class="fa fa-minus-circle" title="decrease" aria-hidden="true"></i></a>
                </td>`;

            jBody.appendChild(tr);
        });
        return jBody;
    }

    createScoreSheetTable()
    {
        let jTable = document.createElement("table");

        {
            let thead = document.createElement("thead");
            thead.innerHTML = "<tr><th></th><th>You</th></tr>";
            jTable.appendChild(thead)
        }
        
        jTable.appendChild(this.createScoreSheetEntries());

        {
            let tfoot = document.createElement("tfoot");
            tfoot.innerHTML = `<tr data-score-type="total" class="score-total">
                                    <th>Total</th>
                                    <th class="score-total" data-player="self">0</th>
                                </tr>
                                <tr>
                                    <th colspan="2" class="text-right">
                                        <input type="button" class="button buttonCancel" value="Cancel">
                                        <input type="button" class="button buttonUpdate" value="Update score">
                                    </th>
                                </tr>`;
            jTable.appendChild(tfoot);
        }
        
        return jTable;
    }

    createVictoryContainer()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "view-score-victory-container")
        div.setAttribute("id", "view-score-sheet-card-list");
        div.innerHTML = `<div class="view-card-list-container blue-box">
                            <div class="container-title-bar">
                                <div class="container-title-bar-title text-center smallCaps">Your Victory Pile</div>
                                <div class="clear"></div>
                            </div>
                            <div class="container-data"></div>
                            <div class="clear"></div>
                        </div>`;
        return div;
    }

    createScoreSheetContainer()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "view-score-container blue-box")
        div.appendChild(this.createScoreSheetTable());
        return div;
    }

    createScoreSheet()
    {
        if (document.getElementById("scoring-sheet") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "scoring-sheet");
        div.setAttribute("class", "hidden scoring-sheet");

        const _temp = document.createElement("div");
        _temp.setAttribute("class", "menu-overlay hidden");
        div.appendChild(_temp);
        div.appendChild(this.createScoreSheetContainer());       
        div.appendChild(this.createVictoryContainer());

        div.addEventListener("meccg-scoretable-close", SCORING.hideScoringSheet, false);

        document.body.appendChild(div);
    }
}

const SCORING = {
        
    stats : { },

    cardList : null,
    
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
        categories.forEach((entry) => SCORING.stats[entry.value] = 0);
    },

    _init : function(categories, min, max)
    {
        new ScoringContainers(categories, min, max).create();
        this._createStatsMap(categories);

        if (document.getElementById("scoring-card") !== null)
        {
            const elem = document.getElementById("scoring-card");
            elem.querySelector(".menu-overlay").onclick = SCORING.hideScoringCard;
            elem.querySelector(".button").onclick = SCORING.onStoreCard;
        }

        if (document.getElementById("scoring-sheet") !== null)
        {
            const elem = document.getElementById("scoring-sheet");
            elem.querySelector(".menu-overlay").onclick = SCORING.hideScoringSheet;
            elem.querySelector(".buttonUpdate").onclick = SCORING.onStoreSheet;
            elem.querySelector(".buttonCancel").onclick = SCORING.hideScoringSheet;
            
            ArrayList(elem).find("table tbody tr a").each((_elem) => _elem.onclick = SCORING.onChangeScoreValue);
        }
    },
    
    hideScoringCard : function()
    {
        document.getElementById("scoring-card").classList.add("hidden");
        ArrayList(document.getElementById("view-score-sheet-card-list")).findByClassName(".container-data").each(DomUtils.empty);
        ArrayList(document.getElementById("scoring-card")).findByClassName(".score-type").each((_elem) => _elem.classList.remove("req"));
        ArrayList(document.getElementById("scoring-card")).findByClassName(".score-points").each((_elem) => _elem.classList.remove("req"));
    },
    
    hideScoringSheet : function()
    {
        const sheet = document.getElementById("scoring-sheet");
        if (!sheet.classList.contains("final-score"))
        {
            sheet.classList.add("hidden");
            ArrayList(sheet).find("span").each((_el) => _el.innerHTML = "0");
        }
    },
    
    displayCard : function(sCode)
    {
        const elem = document.getElementById("scoring-card").querySelector("img");
        const sSrc = elem.getAttribute("data-image-path") + SCORING.cardList.getImage(sCode);
        elem.setAttribute("src", sSrc);
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
        let val = "";

        ArrayList(document.getElementById("scoring-card")).find('input[name="' + sName + '"]').each((_el) => {

            if (_el.checked)
                val = _el.value;
        })
        
        return val === null ? "" : val;
    },

    sendScoreCard : function(sCardCode, isDefault)
    {
        fetch("/data/marshallingpoints?code=" + encodeURI(sCardCode) + "&standard=" + isDefault).then((response) => 
        {
            response.json().then((data) => 
            {
                let elem;
                const points = data.points && data.points >= 0 ? data.points : 0;
                elem = document.getElementById("score_" + points + "_points");
                if (elem !== null)
                    elem.click();

                const kat = data.type && data.type !== "" ? data.type : "misc";
                elem = document.getElementById("score_" + kat + "_label");
                if (elem !== null)
                    elem.click();
            });
        })
        .catch(() => { /** ignore error */});
    },
    
    scoreCard : function(sCardCode)
    {
        if (sCardCode === "" || typeof sCardCode === "undefined")
            return;
        
        this.displayCard(sCardCode);
        this._clickDefault("score-type-choose");
        this._clickDefault("score-points-choose");
        
        document.getElementById("scoring-card").classList.remove("hidden");

        const isDefault = document.body.getAttribute("data-game-arda") !== "true" ? "true" : "false";
        this.sendScoreCard(sCardCode, isDefault);
    },

    _clickDefault : function(id)
    {
        let elem = document.getElementById(id);
        if (elem === null)
            return;

        const sId1 = elem.getAttribute("default-id");
        if (sId1 !== null && sId1 !== "")
            document.getElementById(sId1).dispatchEvent(new Event("click"));
    },

    _getTargetCell(jTable, type, player)
    {
        if (type === undefined || player === undefined || type === "" || player === "" || player === null || type === null)
            return null;
    
        const elem = jTable.querySelector('tr[data-score-type="'  + type + '"]');
        if (elem === null)
        {
            console.log("Cannot obtain cell of type " + type);
            return null;
        }
        
        const cell = elem.querySelector('td[data-player="'+player+'"]');
        if (cell === null)
        {
            console.log("Cannot obtain cell of type " + type + " for player " + player);
            return null;
        }
        else
            return cell;
    },

    scoreSheetUpdateTyble(jData, jTable)
    {
        if (jTable === null)
            return;

        let _elem;
        let player;
        let total;

        for (let key in jData)
        {
            total = 0;
            player = MeccgPlayers.isChallenger(key) ? "self" : key;
            for (let type in jData[key])
            {
                _elem = this._getTargetCell(jTable, type, player);
                if (_elem !== null && player === "self")
                    _elem = _elem.querySelector("span");
                
                if (_elem !== null)
                {
                    _elem.innerText = jData[key][type];
                    total += jData[key][type];
                }
            }

            document.getElementById("scoring-sheet").querySelector("tr.score-total").querySelector('th[data-player="'+player+'"]').innerHTML = total;
        }
    },
    
    _showScoreSheet : function(jData, bAllowUpdate)
    {
        if (typeof jData === "undefined")
            return;
            
        const jTable = document.getElementById("scoring-sheet").querySelector("tbody");
        this.scoreSheetUpdateTyble(jData, jTable);

        if (!bAllowUpdate)
            this.removeUpdateFunctionality();
        
        document.getElementById("scoring-sheet").classList.remove("hidden");
    },

    removeUpdateFunctionality()
    {
        const elem = document.getElementById("scoring-sheet");
        if (elem === null)
            return;

        elem.classList.add("final-score");
        DomUtils.remove(document.getElementById("view-score-sheet-card-list"));

        const overlay = elem.querySelector(".menu-overlay");
        overlay.classList.remove("hidden");
        overlay.onclick = () => { return false; };

        const table = elem.querySelector(".view-score-container");
        if (table === null || table.querySelector(".return-to-lobby") !== null)
            return;

        const a = document.createElement("a");
        a.setAttribute("href", "/");
        a.setAttribute("title", "Leave game and return to lobby");
        a.innerText = "Return to lobby."

        const p = document.createElement("p");
        p.appendChild(a);
        p.classList.add("center");
        p.classList.add("return-to-lobby");

        table.appendChild(p);
    },
    
    showScoreSheetCards : function(listCards)
    {
        if (typeof listCards !== "undefined" && listCards.length > 0)
            document.body.dispatchEvent(new CustomEvent("meccg-show-victory-sheet", { "detail": listCards }));
    },

    showScoreSheet : function(jData)
    {
        this._showScoreSheet(jData, true);
    },
    
    showFinalScore : function(jData, stats)
    {
        this._showScoreSheet(jData, false);        
        document.body.dispatchEvent(new CustomEvent("meccg-dice-stats", { "detail": stats }));
    },

    showScoreSheetWatch : function(jData)
    {
        this._showScoreSheet(jData, false); 
        document.getElementById("scoring-sheet").querySelector(".menu-overlay").onclick = function()
        {
            const sheet = document.getElementById("scoring-sheet");
            sheet.classList.add("hidden");
            ArrayList(sheet).find("span").each((_el) => _el.innerHTML = "0");
        }
    },

    _updateStats : function(type, points)
    {
        if (typeof points !== "undefined" && SCORING.stats[type] !== undefined)
            SCORING.stats[type] = points;
    },
    
    onStoreSheet : function()
    {
        SCORING._resetStats();
        
        const sheet = document.getElementById("scoring-sheet");
        ArrayList(sheet).find('td[data-player="self"]').each((elem) =>
        {
            const nScore = parseInt(elem.querySelector("span").innerHTML);
            const type = elem.parentNode.getAttribute("data-score-type");
            SCORING._updateStats(type, nScore);
        });
        
        SCORING.hideScoringSheet();
        MeccgApi.send("/game/score/update", SCORING.stats);
    },
    
    onChangeScoreValue : function(e)
    {
        let bAdd = this.getAttribute("data-score-action") === "increase";
        let jSpan = this.parentNode.querySelector("span"); 
        let nCount = parseInt(jSpan.innerHTML) + (bAdd ? 1 : -1);
        jSpan.innerHTML = nCount;
        
        jSpan = document.getElementById("scoring-sheet").querySelector("th.score-total");
        nCount = parseInt(jSpan.innerHTML) + (bAdd ? 1 : -1);
        jSpan.innerHTML = nCount;

        e.preventDefault();
        e.stopPropagation();
        return false;
    },
    
    addPlayers : function(sMyId, jMap)
    {
        for (let _playerId in jMap)
        {
            if (sMyId !== _playerId)
                SCORING.addPlayer(_playerId, jMap[_playerId]);
        }
    },

    isAvailable : function(sPlayerId, jTable)
    {
        if (jTable === null || sPlayerId === null || sPlayerId === "")
            return false;

        let tRow = jTable.querySelector("thead tr");
        if (tRow === null)
            return false;
        else
            return tRow.querySelector('th[data-player="'+sPlayerId+'"]') !== null;
    },
    
    addPlayer : function(sPlayerId, sName)
    {
        let jTable = document.getElementById("scoring-sheet").querySelector("table");

        if (SCORING.isAvailable(sPlayerId, jTable))
            return;
        
        let th = document.createElement("th");
        th.setAttribute("data-player", sPlayerId);
        th.innerHTML = sName;
        jTable.querySelector("thead tr").appendChild(th);

        ArrayList(jTable.querySelector("tbody")).find("tr").each(function(_tr)
        {
            const elem = document.createElement("td");
            elem.setAttribute("data-player", sPlayerId);
            elem.innerHTML = "0";
            _tr.appendChild(elem)
        });

        th = document.createElement("th");
        th.setAttribute("data-player", sPlayerId);
        th.innerHTML = "0";
        jTable.querySelector("tfoot").querySelector("tr.score-total").appendChild(th);
    },
};

document.body.addEventListener("meccg-players-updated", (e) => SCORING.addPlayers(e.detail.challengerId, e.detail.map), false);
document.body.addEventListener("meccg-score-card", (e) => SCORING.scoreCard(e.detail), false);

function createScoringApp(_CardList)
{
    SCORING.cardList = _CardList;
       
    const extractCategories = function(categories)
    {
        const isExtended = "true" === document.body.getAttribute("data-game-arda");
        let res = [];

        for (let _item of categories)
        {
            if (!_item.extended || (isExtended && _item.extended))
                res.push(_item);
        }
    
        return res;
    };

    fetch("/data/scores").then((response) => 
    {
        if (response.status === 200)
        {
            response.json().then((data) => {
                if (typeof data !== "undefined" && typeof data.categories !== "undefined" && typeof data.points !== "undefined")
                    SCORING._init(extractCategories(data.categories), data.points.min, data.points.max);
            });
        }
    })
    .catch((err) => 
    {
        MeccgUtils.logError(err);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch scores." }));
    });

    return {

        addPlayers: function(sMyId, jNameMap)
        {
            SCORING.addPlayers(sMyId, jNameMap);
        },

        showScoreSheet : function(jData)
        {
            SCORING.showScoreSheet(jData);
        },

        showScoreSheetWatch : function(jData)
        {
            SCORING.showScoreSheetWatch(jData);
        },

        showScoreSheetCards : function(jData)
        {
            SCORING.showScoreSheetCards(jData);
        },

        showFinalScore: function(score, stats)
        {
            SCORING.showFinalScore(score, stats);
        }
    };
}

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/media/client/game/score/score.css?t=" + Date.now());
    document.head.appendChild(styleSheet);
})();