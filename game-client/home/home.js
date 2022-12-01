
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

        const since = (isArda ? "Arda, " : "") + "since " + lMins 
        
        const _tr = document.createElement("tr");
        _tr.innerHTML = `
                        <td class="action"><a href="/${_context}/${_room}/watch" title="Click to watch" class="fa fa-eye"> watch</a></td>
                        <td class="action"><a href="/${_context}/${_room}" title="Click to join this game" class="fa fa-sign-in"> join</a></td>
                        <td class="name">${_room} (${since})</td>
                        <td class="players">${_players}</td>`.trim();
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

    console.log("HALLO");
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

const fetchAndUpdateGames = function()
{
    fetch("/data/games").then((response) => response.json().then(onResult)).catch(showFetchError);
};

(function()
{
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/media/client/home/home.css");
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
        if (e.which === 13) 
        {
            document.getElementById("start_game").dispatchEvent(new Event('click'));
            e.preventDefault();
            return false;
        }
    }


    document.getElementById("enter_room").focus();

    fetchAndUpdateGames();
})();

setInterval(fetchAndUpdateGames, 10 * 1000);
