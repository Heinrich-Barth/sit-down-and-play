
const Lobby = {

    _room : "",
    _token : "",

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/client/game/lobby/lobby.css?version=" + Date.now());
        document.head.appendChild(styleSheet);
    },

    onClickToggleUsers : function()
    {
        const elem = document.getElementById("lobby-wrapper");
        Lobby.onClickToggleElem(elem, "Players", "player");
    },

    onClickToggleVisitors : function()
    {
        const elem = document.getElementById("visitor-wrapper");
        Lobby.onClickToggleElem(elem, "Visitors", "visitor");
    },

    onClickToggleElem : function(elem, type, key)
    {
        const allow = elem !== null && elem.getAttribute("data-allow") !== "true";
        const sTitle = allow ? type + " may join this game" : type + " cannot join this game";

        Lobby.onClickToggleSetValue(elem, allow, sTitle);

        const options = {
            method: 'POST',
            body: ""
        }
        fetch("/play/" + Lobby._room + "/invite/" + Lobby._token + "/" + key + "/" + allow, options).then(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": sTitle })));
    },

    onClickToggleSetValue(elem, allow, title)
    {
        if (elem !== null)
        {
            elem.setAttribute("data-allow", allow);
            elem.setAttribute("title", title);
        }
    },

    init : function(sRoom, sLobbyToken)
    {
        if (document.getElementById("lobby-wrapper") === null)
            this.insertCss();

        if (sRoom === "" || sRoom === undefined || sLobbyToken === "" || sLobbyToken === undefined || document.getElementById("lobby-wrapper") !== null)
            return;

        Lobby._room = sRoom;
        Lobby._token = sLobbyToken;

        let div = document.createElement("div");
        div.setAttribute("id", "lobby-wrapper");
        div.setAttribute("class", "wrapper-topleft lobby-wrapper blue-box cursor-pointer");
        div.setAttribute("data-allow", "true");
        div.setAttribute("title", "Players can join this game");
        div.innerHTML =`<div class="icons"><i class="fa fa-user-circle" aria-hidden="true"></i></div>`;
        div.onclick = Lobby.onClickToggleUsers;
        document.body.appendChild(div);

        div = document.createElement("div");
        div.setAttribute("id", "visitor-wrapper");
        div.setAttribute("class", "wrapper-topleft visitor-wrapper blue-box cursor-pointer");
        div.setAttribute("data-allow", "true");
        div.setAttribute("title", "Visitors can join this game");
        div.innerHTML =`<div class="icons"><i class="fa fa-eye" aria-hidden="true"></i></div>`;
        div.onclick = Lobby.onClickToggleVisitors;
        document.body.appendChild(div);

        document.getElementById("interface").classList.add("is-admin");
        
        fetch("/play/" + Lobby._room + "/accessibility").then(response => response.json().then((Lobby.onUpdateAccessibility)));
    },

    onUpdateAccessibility : function(data)
    {
        if (data.player !== true)
        {
            const elem = document.getElementById("lobby-wrapper");
            Lobby.onClickToggleSetValue(elem, false, "Players cannot join this game");
        }

        if (data.visitor !== true)
        {
            const elem = document.getElementById("visitor-wrapper");
            Lobby.onClickToggleSetValue(elem, false, "Visitors cannot join this game");
        }
    },

    triggerLockRoom()
    {
        const elem = document.getElementById("lobby-wrapper");
        if (elem !== null && elem.hasAttribute("data-allow") && elem.getAttribute("data-allow") === "true")
            Lobby.onClickToggleUsers();
    }
};

setTimeout(() => Lobby.init(g_sRoom, g_sLobbyToken), 200);
