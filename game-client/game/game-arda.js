

let Arda = {

    _ready : false,

    addCss : function()
    {
        /** add CSS  */
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href","/media/assets/css/game-arda.css");
        document.head.appendChild(link);
    },

    init : function()
    {
        if (this._ready)
            return;

        this.addCss();
        this.insertArdaContainer();
        this.createContainer("arda_mps", "mps", "Marshalling Points").classList.remove("hidden");

        this._ready = true;
    },

    insertArdaContainer : function()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "arda-hand-wrapper");
        div.setAttribute("id", "arda-hand-wrapper");

        this.insertMp(div, "fa-users", "Roving Characters", "charackters", "arda_characters");
        this.insertMp(div, "fa-shield", "Minor Item Offerings", "minor", "arda_minors");
        this.insertMp(div, "fa-trophy", "Marshalling Points", "mps", "arda_mps");

        document.body.appendChild(div);
    },

    insertMp : function(parent, html, title, dataType, playerId)
    {
        const div = document.createElement("div");
        const a = document.createElement("i");

        a.setAttribute("data-type", dataType);
        a.setAttribute("data-player", playerId);
        a.setAttribute("title", title);
        a.setAttribute("class", "fa " + html);
        a.setAttribute("aria-hidden", "true");
        a.onclick = Arda.toogleView;

        div.setAttribute("class", "blue-box arda-hand-container");
        div.appendChild(a);
        parent.appendChild(div);
    },

    toogleView : function(e)
    {
        const playerId = e.target.getAttribute("data-player");
        const dataType = e.target.getAttribute("data-type");
        const title = e.target.getAttribute("title");

        const elem = Arda.createContainer(playerId, dataType, title);
        if (elem !== null)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
            else
                elem.classList.add("hidden");
        }

        e.preventDefault();
        return false;
    },

    createContainer : function(playerid, dataType, title)
    {
        const id = playerid + "_hand";
        let elem = document.getElementById(id);
        if (elem !== null)
            return elem;

        const div = document.createElement("div");
        div.setAttribute("class", "arda-card-hands blue-box hidden arda-card-hand-" + dataType);
        div.setAttribute("data-player", playerid);
        div.setAttribute("id", id);
        div.innerHTML = `<div class="arda-card-hands-sizer"><strong>${title}</strong> &dash; Always resolve to <strong>4</strong> cards</div>
                        <div class="arda-inline arda-hand-card-actions">
                            <div class="arda-inline arda-card-hand cursor-pointer card-dice" title="Click to roll the dice"></div>
                            <div class="arda-inline arda-card-draw">
                                <a href="#" class="arda-card-icon" id="arda-draw-card" data-player="${playerid}" data-type="${dataType}" title="Draw a new card">&nbsp;</a>
                                <div class="hidden" class="arda-draw_onlyGetTopCard"></div>
                            </div>
                        </div>
                        <div class="arda-inline" id="${playerid}_hand_container">
                        <div class="card-hand ui-draggable ui-draggable-handle" id="card_icon_nr_39217efe-c43b-419c-b6fb-fc018a3302e2_2" data-uuid="39217efe-c43b-419c-b6fb-fc018a3302e2_2" data-card-type="character" draggable="true" data-location="hand"><img decoding="async" src="https://cardnum.net/img/cards/METW/metw_gandalf.jpg" data-id="Gandalf [H] (TW)" class="card-icon" data-view-left="true" data-view-top="true" data-view-always="false"></div><div class="card-hand ui-draggable ui-draggable-handle" id="card_icon_nr_39217efe-c43b-419c-b6fb-fc018a3302e2_3" data-uuid="39217efe-c43b-419c-b6fb-fc018a3302e2_3" data-card-type="character" draggable="true" data-location="hand"><img decoding="async" src="https://cardnum.net/img/cards/METW/metw_pallando.jpg" data-id="Pallando [H] (TW)" class="card-icon" data-view-left="true" data-view-top="true" data-view-always="false"></div><div class="card-hand ui-draggable ui-draggable-handle" id="card_icon_nr_39217efe-c43b-419c-b6fb-fc018a3302e2_4" data-uuid="39217efe-c43b-419c-b6fb-fc018a3302e2_4" data-card-type="character" draggable="true" data-location="hand"><img decoding="async" src="https://cardnum.net/img/cards/METW/metw_radagast.jpg" data-id="Radagast [H] (TW)" class="card-icon" data-view-left="true" data-view-top="true" data-view-always="false"></div><div class="card-hand ui-draggable ui-draggable-handle" data-uuid="39217efe-c43b-419c-b6fb-fc018a3302e2_5" data-card-type="character" draggable="true" data-location="hand"><img decoding="async" src="https://cardnum.net/img/cards/METW/metw_saruman.jpg" data-id="Saruman [H] (TW)" class="card-icon" data-view-left="true" data-view-top="true" data-view-always="false"></div>
                        </div>`;
        
        document.body.appendChild(div);
        return document.getElementById(id);
    },
};

if (document.location.pathname.startsWith("/arda/") ||
    document.location.href.indexOf("/arda") !== -1)
{
    document.body.addEventListener("meccg-api-connected", () => Arda.init(), false);
}
else
    Arda = null;


