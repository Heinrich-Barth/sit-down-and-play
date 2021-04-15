function isInvalid(name)
{
    return name === "" || name.indexOf("<") !== -1 || name.indexOf(">") !== -1;
}

function onResult(data)
{
    if (data === undefined || data.length === 0)
    {
        jQuery("#no_games").removeClass("hidden");
        return;
    }

    data.sort(function(a, b) {
        return a.room.toLowerCase().localeCompare(b.room.toLowerCase());
    });
    
    let sHtml = "";
    data.forEach(function (value)
    {
        let _room = value.room;
        let _players = value.players.sort().join(", ");

        sHtml += `<li><a href="/play/${_room}" title="Click to join this game">${_room}</a> (${_players})</li>`;
    });

    jQuery("#active_games .game_list").html("<ol>"+sHtml+"</ol>");
    jQuery("#active_games").removeClass("hidden");
}

function isAlphaNumeric(sInput)
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};


jQuery(document).ready(function()
{
    jQuery("#start_game").click(function(evt)
    {
        let sVal = jQuery("#enter_room").val();

        if (sVal === "")
            Notify.error("Please provide a game name.");
        else if (!isAlphaNumeric(sVal))
            Notify.error("The room name has to be alphanumeric.");
        else if (sVal.indexOf(" ") !== -1 || sVal.indexOf("/") !== -1)
            Notify.error("Invalid name.");
        else
            window.location.href = "/play/" + sVal;
    });

    $("#enter_room").keypress(function (e) 
    {
        if (e.which == 13) 
        {
            $("#start_game").click();
            return false;
        }
    });

    jQuery.get("/games", { }).done(onResult);

    jQuery("#enter_room").focus();
});