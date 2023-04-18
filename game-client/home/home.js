
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

const loadSampleRooms = function(existing)
{
    if (document.getElementById("enter_room").value !== "")
        return;

    fetch("/data/samplerooms").then((response) => response.json().then((_rooms) => 
    {
        const filtered = _rooms.filter((candidate) => !existing.includes(candidate));
        if (filtered.length > 0)
            document.getElementById("enter_room").value = filtered[randomNumber(filtered.length)];
    }));
}

const toNumberString = function(nValue)
{
    return (nValue < 10 ? "0" : "") + nValue;
};

const addGameTypes = function(container, data, isArda, existing)
{
    for (let value of data)
    {
        if (isArda !== value.arda)
            continue;

        let _room = value.room;
        let _players = value.players.sort().join(", ");
        let _context = value.arda ? "arda" : "play";

        const pDate = new Date(new Date().getTime() - value.time);

        let lMins = ((pDate.getHours()-1) * 60 +  pDate.getMinutes());
        if (lMins > 0)
            lMins += "min";
        else
            lMins = "now";

        const since = (isArda ? "Arda, " : "") + "" + lMins 
        
        const _tr = document.createElement("tr");
        const tdRoom = document.createElement("td");
        _tr.appendChild(tdRoom);
        tdRoom.setAttribute("class", "name game-link");
        if (value.accessible)
            tdRoom.innerHTML = `<a href="/${_context}/${_room}" title="Click to join this game" class="fa fa-sign-in"> ${_room}</a> <span class="game-duration fa fa-clock-o"> ${since}</span>`;
        else
            tdRoom.innerHTML = `${_room} <span class="game-duration fa fa-clock-o"> ${since}</span>`;

        const tdJitsi = document.createElement("td");
        _tr.appendChild(tdJitsi);
        tdJitsi.setAttribute("class", "action");
        if (value.jitsi)
            tdJitsi.innerHTML = `<a href="https://meet.jit.si/${_room}" title="Click to join audio chat" class="fa fa-microphone" target="_blank"> via Jitsi</a> `;
        else
            tdJitsi.innerHTML = `<span class="fa fa-microphone"> via Discord</span> `;

        const tdWatch = document.createElement("td");
        _tr.appendChild(tdWatch);
        tdWatch.setAttribute("class", "action");
        if (value.visitors)
            tdWatch.innerHTML = `<a href="/${_context}/${_room}/watch" title="Click to watch" class="fa fa-eye"> watch</a>`;

        const tdPlayers = document.createElement("td");
        _tr.appendChild(tdPlayers);
        tdPlayers.setAttribute("class", "players");
        tdPlayers.innerText = _players;

        container.appendChild(_tr);
        existing.push(_room)
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
    if (elem !== null && elem.classList.contains("hidden"))
        elem.classList.remove("hidden");
};

const onResult = function(data)
{
    const pContainer = document.getElementById("game_list");
    if (pContainer === null)
        return;

    emptyNode(pContainer);

    if (data === undefined || data.length === 0)
    {
        hideContainer("active_games");
        showContainer("no_games");
        loadSampleRooms([]);
        return;
    }

    data.sort(function(a, b) { return a.room.toLowerCase().localeCompare(b.room.toLowerCase()); });

    const existing = [];
    const table = document.createElement("table")
    const container = document.createElement("tbody")

    addGameTypes(container, data, false, existing);
    addGameTypes(container, data, true, existing);

    table.appendChild(container);
    pContainer.appendChild(table);

    showContainer("active_games");
    hideContainer("no_games");
    loadSampleRooms(existing);
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

const showFetchError = function(err)
{
    console.log(err);
    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
};

let g_nCountFechGames = 0;

const fetchAndUpdateGames = function()
{
    g_nCountFechGames++;
    fetch("/data/games").then((response) => response.json().then(onResult)).catch(showFetchError);

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

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/media/client/home/home.css?version=" + Date.now());
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
            console.log(err);
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

    fetchAndUpdateGames();
})();

let g_fetchGamesInterval = setInterval(fetchAndUpdateGames, 10 * 1000);


