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
    fetch("/data/samplerooms").then((response) => response.json().then((_rooms) => 
    {
        const filtered = _rooms.filter((candidate) => !existing.includes(candidate));
        if (filtered.length > 0)
            document.getElementById("enter_room").value = filtered[randomNumber(filtered.length)];
    }));
}

const onResult = function(data)
{
    if (data === undefined || data.length === 0)
    {
        loadSampleRooms([]);
        document.getElementById("no_games").classList.remove("hidden");
        return;
    }

    data.sort(function(a, b) { return a.room.toLowerCase().localeCompare(b.room.toLowerCase()); });
    
    let existing = [];

    let sHtml = "";
    data.forEach(function (value)
    {
        let _room = value.room;
        let _players = value.players.sort().join(", ");
        let _context = value.arda ? "arda" : "play";

        sHtml += `<li><a href="/${_context}/${_room}" title="Click to join this game">${_room}</a> (${_players})</li>`;
        existing.push(_room);
    });

    document.getElementById("game_list").innerHTML = "<ol>"+sHtml+"</ol>";
    document.getElementById("active_games").classList.remove("hidden");

    loadSampleRooms(existing);
};

const isAlphaNumeric = function(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};


(function()
{
    document.getElementById("login").classList.remove("hidden");

    document.getElementById("start_game").onclick = function()
    {
        try
        {
            const sVal = document.getElementById("enter_room").value;
            if (sVal === "")
                throw "Please provide a game name.";
            else if (!isAlphaNumeric(sVal))
                throw "The room name has to be alphanumeric.";
            else if (sVal.indexOf(" ") !== -1 || sVal.indexOf("/") !== -1)
                throw "Invalid name.";
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

})();

fetch("/data/games").then((response) => response.json().then(onResult))
.catch((err) => 
{
    console.log(err);
    document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch game list." }));
});