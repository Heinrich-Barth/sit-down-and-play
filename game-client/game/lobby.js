
const Lobby = {

    _room : g_sRoom,
    _token : g_sLobbyToken,  

    _hide : function()
    {
        const elem = document.getElementById("lobby");
        elem.classList.add("hide");
        Lobby._emptyLists();
    },

    _emptyLists : function()
    {
        const elem = document.getElementById("lobby");
        DomUtils.empty(elem.querySelector(".lobby-list"));
        DomUtils.empty(elem.querySelector(".player-list"));
    },

    _loadList : function()
    {
        if (Lobby._room !== "" && Lobby._token !== "")
        {
            fetch("/play/" + Lobby._room + "/waiting/" + Lobby._token).then((response) => 
            {
                if (response.status === 200)
                    response.json().then(Lobby.updateList);
            })
            .catch(MeccgUtils.logError);
        }
    },

    sendDecision : function(userId, bAllow)
    {
        const sAction = bAllow ? "invite" : "reject";
        jQuery.post("/play/" + Lobby._room + "/" + sAction + "/" + userId + "/" + Lobby._token).done(Lobby._hide);
    },

    removePlayer : function(userId)
    {
        jQuery.post("/play/" + Lobby._room + "/remove/" + userId + "/" + Lobby._token).done(Lobby._hide);
    },

    reduceLength : function(input)
    {
        return input.length < 30 ? input : input.substring(0, 29);
    },

    createWaitingList : function(data)
    {
        const nLen = data.length;
        if (nLen === 0)
            return false;

        const lobbyList = document.getElementById("lobby").querySelector(".lobby-list");
        if (lobbyList === null)
            return false;

        Lobby.insertH3(lobbyList, "Users requesting to join");

        let _entry;
        for (let i = 0; i < nLen; i++)
        {
            _entry = data[i];
            if (_entry.name.indexOf("<") === -1 && _entry.id.indexOf("<") === -1)
                Lobby.appendPlayer(lobbyList, _entry.name, _entry.id, _entry.time, true);
        }

        return true;
    },

    insertH3 : function(elem, text)
    {
        const h3 = document.createElement("h3");
        h3.innerHTML = text;
        elem.appendChild(h3);
    },

    appendPlayer : function(elem, name, id, time, bAdd)
    {
        let _temp = Lobby.reduceLength(name);
        const elemP = document.createElement("p");
        elemP.innerHTML = `<i data-id="${id}"  class="fa fa-trash" aria-hidden="true" title="Reject player"></i>` + 
        (bAdd ? `<i data-id="${id}" class="fa fa-user-plus" aria-hidden="true" title="Add to game"></i>` : "") +
        _temp + " (" + time + ")";

        elem.appendChild(elemP);
    },

    createPlayerList : function(data)
    {
        const nLen = data.length;
        if (nLen === 0)
            return false;

        const lobbyList = document.getElementById("lobby").querySelector(".player-list");
        if (lobbyList === null)
            return false;

        Lobby.insertH3(lobbyList, "Players at the table");

        let _entry;
        for (let i = 0; i < nLen; i++)
        {
            _entry = data[i];
            if (_entry.name.indexOf("<") === -1 && _entry.id.indexOf("<") === -1)
                Lobby.appendPlayer(lobbyList, _entry.name, _entry.id, _entry.time, false);
        }

        return true;
    },
    
    updateList : function(data)
    {
        Lobby._emptyLists();

        let b1 = Lobby.createWaitingList(data.waiting);
        let b2 = Lobby.createPlayerList(data.players);

        if (!b1 && !b2)
            return;

        ArrayList(document.getElementById("lobby").querySelector(".lobby-list")).find("i").each((el) => el.onclick = function()
        {
            Lobby.sendDecision(this.getAttribute("data-id"), this.classList.contains("fa-user-plus"));
        });

        ArrayList(document.getElementById("lobby").querySelector(".player-list")).find("i").each((el) => el.onclick = function()
        {
            Lobby.removePlayer(this.getAttribute("data-id"));
        });

        document.getElementById("lobby").classList.remove("hide");
    },

    init : function()
    {
        if (Lobby._room === "" || Lobby._token === "" || document.getElementById("lobby-wrapper") !== null)
            return;

        let div = document.createElement("div");
        div.setAttribute("id", "lobby-wrapper");
        div.setAttribute("class", "lobby-wrapper blue-box cursor-pointer");
        div.innerHTML =`<div class="icons" id=""><i class="fa fa-user-circle" aria-hidden="true"></i></div>`;
        document.body.appendChild(div);

        div = document.createElement("div");
        div.setAttribute("id", "lobby");
        div.setAttribute("class", "hide");
        div.innerHTML = `<div class="menu-overlay lobby-overlay"></div>
                        <div class="lobby-requests blue-box">
                            <div class="lobby-list"></div>
                            <div class="player-list"></div>
                        </div>`;
        document.body.appendChild(div);

        document.getElementById("lobby").querySelector(".lobby-overlay").onclick = Lobby._hide;
        document.getElementById("lobby-wrapper").onclick = Lobby._loadList;
        document.getElementById("interface").classList.add("is-admin");
    },
};

(function() { Lobby.init(); })();
