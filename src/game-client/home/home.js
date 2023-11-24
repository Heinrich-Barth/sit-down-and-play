
const emptyNode = function(parent)
{
    if (parent !== null)
    {
        while (parent.firstChild) 
            parent.removeChild(parent.firstChild);
    }
};

const isInvalid = function(name)
{
    return name === "" || name.indexOf("<") !== -1 || name.indexOf(">") !== -1;
};

const randomNumber = function(max)
{
    return max <= 1 ? 0 : Math.floor(Math.random() * max);
};


const g_jsonRoomImages = { };

const loadSampleRooms = function()
{
    if (document.getElementById("enter_room").value !== "" || SampleRoomApp.isEmpty())
        return;

    const filtered = SampleRoomApp.getAvailable();
    if (filtered.length === 0)
        return;

    let name = "";
    let image = "";

    const _index = randomNumber(filtered.length);
    const randomRoom = filtered[_index];
    if (typeof randomRoom === "string") /** cache might be a problem, so allow backward compatibility */
    {
        name = randomRoom;
    }
    else
    {
        name = randomRoom.name;
        image = randomRoom.image;
    }

    document.getElementById("enter_room").value = name;
    SampleRoomApp.setImage(image);
}

const toNumberString = function(nValue)
{
    return (nValue < 10 ? "0" : "") + nValue;
};

const getGameTypeDuration = function(isArda, lTime)
{
    const pDate = new Date(Date.now() - lTime);

    let lMins = ((pDate.getHours()-1) * 60 +  pDate.getMinutes());
    if (lMins > 0)
        lMins += "min";
    else
        lMins = "now";

    return (isArda ? "Arda, " : "") + "" + lMins 
}

const addGameType = function(value, isArda)
{
    const _room = value.room;
    const _players = value.players.sort().join(", ");
    const _context = isArda ? "arda" : "play";

    const since = getGameTypeDuration(isArda, value.time);
    
    const _tr = document.createElement("div");
    _tr.setAttribute("class", "room-image-wrapper");

    {   
        const tdImage = document.createElement("div");
        _tr.appendChild(tdImage);
        tdImage.setAttribute("class", "room-image");
    
        const _img = document.createElement("img");
        _img.setAttribute("src", SampleRoomApp.getRoomImage(_room));
        tdImage.appendChild(_img);
    }
    
    const tdRoom = document.createElement("div");
    tdRoom.setAttribute("class", "room-text");
    _tr.appendChild(tdRoom);

    tdRoom.innerHTML = `<h3>${_room.toUpperCase()} <span class="game-duration fa fa-clock-o"> ${since}</span></h3>
    <p>${_players}</p>`;

    if (value.jitsi)
    {
        const _a = document.createElement("a");
        _a.setAttribute("href", "https://meet.jit.si/" + _room);
        _a.setAttribute("title", "Click to join audio chat");
        _a.setAttribute("class", "fa fa-microphone audio");
        _a.innerText = " Jitsi";
        tdRoom.append(_a);
    }
    else
    {
        const _a = document.createElement("div");
        _a.setAttribute("class", "fa fa-microphone audio");
        _a.innerText = " Discord";
        tdRoom.append(_a);
    }

    const span = document.createElement("span");
    if (isArda)
    {
        span.setAttribute("class", "deck-label-green")
        span.innerText = "Arda";
    }
    else
    {
        span.setAttribute("class", "deck-label-blue")
        span.innerText = "Standard | DC";
    }
    
    const label = document.createElement("div");
    label.setAttribute("class", "deck-label");
    label.appendChild(span);
    tdRoom.appendChild(label);

    if (value.accessible || value.visitors)
    {
        tdRoom.classList.add("space-right");

        const actions = document.createElement("div");
        _tr.append(actions);
        actions.setAttribute("class", "actions");
        
        const _r = [];
        if (value.accessible)
            _r.push(`<a href="/${_context}/${_room}" title="Click to join" class="fa fa-plus-square"> play</a>`);
        
        if (value.visitors)
            _r.push(`<a href="/${_context}/${_room}/watch" title="Click to watch" class="fa fa-eye"> watch</a>`);

        actions.innerHTML= _r.join("");
    }

    return _tr;
}

const addGameTypes = function(container, data, isArda, existing)
{
    for (let value of data)
    {
        if (isArda === value.arda)
        {
            container.appendChild(addGameType(value, isArda));
            SampleRoomApp.addRoomTaken(value.room);
        }
    }
};

const hideContainer = function(id)
{
    const elem = document.getElementById(id);
    if (elem !== null && !elem.classList.contains("hidden"))
        elem.classList.add("hidden");
};

const showContainer = function(id)
{
    const elem = document.getElementById(id);
    if (elem?.classList?.contains("hidden"))
        elem.classList.remove("hidden");
};

const requireFooter = function()
{
    let footer = document.querySelector("footer");
    if (footer === null)
    {
        footer = document.createElement("footer");
        document.body.appendChild(footer);
    } 

    return footer;
}

const onAddFooterTime = function(data)
{
    const footer = requireFooter();
    footer.innerText = "";

    const gameCount = data.games;
    const text = document.createDocumentFragment();
    text.appendChild(document.createTextNode(data.startup));
    
    if (gameCount === 1)
        text.appendChild(document.createTextNode(", 1 game so far."));
    else if (gameCount > 1)
        text.appendChild(document.createTextNode(", " + gameCount + " games so far."));

    footer.appendChild(text);
    return data;
}

const onAddUptimeNotification = function(data)
{
    const hrs = typeof data.uptime !== "number" ? 0 : (data.uptime /  1000 / 60 / 60).toFixed(2);
    if (hrs < 22 || data.autoRestart !== true)
        return;

    const elem = document.getElementById("login");
    if (elem === null)
        return;

    let p = document.getElementById("time-restart-information");
    if (p === null)
    {
        p = document.createElement("p");
        p.setAttribute("class", "center time-restart-information");
        p.setAttribute("id", "time-restart-information");
        elem.appendChild(p);
    }

    while (p.firstChild)
        p.removeChild(p.firstChild);

    const i = document.createElement("i");
    i.setAttribute("class", "fa fa-clock-o");
    p.append(i, document.createTextNode("Server restarts approx. every 24hrs. Server has been running for " +  hrs + "h now."));
}

const onResult = function(data)
{
    const pContainer = document.getElementById("game_list");
    if (pContainer === null)
        return;

    if (!pContainer.classList.contains("game_list-grid"))
        pContainer.classList.add("game_list-grid");

    emptyNode(pContainer);

    if (data === undefined || data.length === 0)
    {
        hideContainer("active_games");
        showContainer("no_games");
        loadSampleRooms();
        return;
    }

    data.sort(function(a, b) { return a.room.toLowerCase().localeCompare(b.room.toLowerCase()); });

    SampleRoomApp.clearTaken();

    const table = document.createDocumentFragment();

    addGameTypes(table, data, false);
    addGameTypes(table, data, true);

    pContainer.appendChild(table);

    showContainer("active_games");
    hideContainer("no_games");
    loadSampleRooms();
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

const showFetchError = function(err)
{
    console.error(err);
    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
};

let g_nCountFechGames = 0;

const fetchAndUpdateGames = function()
{
    g_nCountFechGames++;
    fetch("/data/games").then((response) => response.json()).then(onResult).catch(showFetchError);
    fetch("/health").then(response => response.json()).then(onAddFooterTime).then(onAddUptimeNotification).catch(showFetchError);
    if (g_nCountFechGames === 60)
    {
        clearInterval(g_fetchGamesInterval);
        g_fetchGamesInterval = setInterval(fetchAndUpdateGames, 60 * 1000);
        g_nCountFechGames = 0;

        const elem = document.getElementById("game-list-counter");
        if (elem !== null)
        {
            elem.classList.remove("line-countdown-10s");
            elem.classList.add("line-countdown-60s");
        }
    }
};

const SampleRoomApp = 
{
    g_jsonRoomNames: [],
    g_jsonRoomImages: {},
    g_listRoomsTaken : [],

    getRoomImage : function(room)
    {
        const val = this.g_jsonRoomImages[room.toLowerCase()];
        return typeof val !== "string" ? "/data/backside" : val;
    },

    isEmpty : function()
    {
        return this.g_jsonRoomNames.length === 0;
    },

    setImage : function(image)
    {
        if (image !== "")
            document.getElementById("enter_room_image")?.setAttribute("src", image);
    },

    clearTaken : function()
    {
        if (SampleRoomApp.g_listRoomsTaken.length > 0)
            SampleRoomApp.g_listRoomsTaken.splice(0, SampleRoomApp.g_listRoomsTaken.length);
    },

    getAvailable: function()
    {
        return this.g_jsonRoomNames.filter((candidate) => !SampleRoomApp.isTaken(candidate.name));
    },

    isTaken : function(room)
    {
        return this.g_listRoomsTaken.includes(room.toLowerCase());
    },

    addRoomTaken : function(room)
    {
        if (room !== "")
            this.g_listRoomsTaken.push(room);
    },

    load : function(rooms)
    {
        rooms.forEach(_e => {
            SampleRoomApp.g_jsonRoomNames.push(_e);
            SampleRoomApp.g_jsonRoomImages[_e.name.toLowerCase()] = _e.image;
        });

        const _img = document.getElementById("enter_room_image");
        if (_img === null)
            return;

        const div = _img.parentElement;
        div.setAttribute("title", "Click to change room name");
        div.onclick = this.onChangeRoom.bind(this);
    },

    requireDialog : function()
    {
        const elem = document.getElementById("choose-room-dialog");
        if (elem !== null)
            return this.clearContainer(elem);

        const dialog = document.createElement("dialog");
        dialog.setAttribute("id", "choose-room-dialog");
        dialog.setAttribute("class", "choose-room-dialog");
        dialog.onclose = this.closeDialog.bind(this);
        document.body.append(dialog);
        return dialog;
    },

    clearContainer : function(parent)
    {
        while (parent.firstChild)
            parent.removeChild(parent.firstChild);

        return parent;
    },

    onChangeRoom : function()
    {
        const listAvail = this.getAvailable();
        if (listAvail.length === 0)
            return;

        const docList = document.createDocumentFragment();
        docList.append(
            this.createElement("h2", "Choose your game room"),
            this.createElement("p", "Click on a room or pres ESC to close"),
        )
        for (let obj of listAvail)
        {
            const img = document.createElement("img");
            img.setAttribute("data-room", obj.name.toLowerCase());
            img.setAttribute("src", obj.image);
            img.setAttribute("title", "Click to change room to " + obj.name);
            img.setAttribute("loading", "lazy");
            img.onclick = this.onChooseRoom.bind(this);

            const elem = document.createElement("div");
            elem.appendChild(img);
            docList.append(elem);
        }
        
        const dialog = this.requireDialog();
        dialog.onclick = this.closeDialog.bind(this);
        dialog.append(docList);
        dialog.showModal();
    },

    createElement : function(type, text)
    {
        const h2 = document.createElement(type);
        h2.innerText = text;
        return h2;
    },

    closeDialog : function()
    {
        const elem = document.getElementById("choose-room-dialog");
        if (elem !== null)
        {
            this.clearContainer(elem);
            elem.close();
            elem.parentElement.removeChild(elem);
        }
    },

    onChooseRoom : function(e)
    {
        const room = e.target?.getAttribute("data-room");
        const src = e.target?.getAttribute("src");
        if (typeof room !== "string" || typeof src !== "string")
        {
            this.closeDialog();
            return;
        }

        document.getElementById("enter_room").value = room;
        this.setImage(e.target?.getAttribute("src"));
        this.closeDialog();
    }
};

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/client/home/home.css?version=" + Date.now());
    document.head.appendChild(styleSheet);

    document.getElementById("login").classList.remove("hidden");

    document.getElementById("start_game").onclick = function()
    {
        try
        {
            const sVal = document.getElementById("enter_room").value;
            if (sVal === "")
                throw new Error("Please provide a game name.");
            else if (!isAlphaNumeric(sVal))
                throw new Error("The room name has to be alphanumeric.");
            else if (sVal.indexOf(" ") !== -1 || sVal.indexOf("/") !== -1)
                throw new Error("Invalid name.");
            else
                window.location.href = "/play/" + sVal;
        }
        catch(err)
        {
            console.error(err);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": err }));
        }
    }


    document.getElementById("enter_room").onkeyup = function (e) 
    {
        let code = "";
        if (e.key !== undefined)
            code = e.key;
        else if (e.keyIdentifier !== undefined)
            code = e.keyIdentifier;

        if (code === "Enter")
        {
            document.getElementById("start_game").dispatchEvent(new Event('click'));
            e.preventDefault();
            return false;
        }
    }

    document.getElementById("enter_room").focus();

    fetch("/data/samplerooms")
    .then(response => response.json())
    .then(SampleRoomApp.load.bind(SampleRoomApp))
    .catch(console.error)
    .finally(fetchAndUpdateGames);
})();

let g_fetchGamesInterval = setInterval(fetchAndUpdateGames, 10 * 1000);


