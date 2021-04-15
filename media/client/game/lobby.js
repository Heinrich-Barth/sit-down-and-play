
const Lobby = {

    _room : g_sRoom,
    _token : g_sLobbyToken,  
    _isReady : false,  

    _hide : function()
    {
        jQuery("#lobby").addClass("hide");
        jQuery("#lobby .lobby-list").empty();
    },

    _loadList : function()
    {
        if (Lobby._room !== "" && Lobby._token !== "")
            jQuery.get("/play/" + Lobby._room + "/waiting/" + Lobby._token).done(Lobby.updateList);
    },

    sendDecision : function(userId, bAllow)
    {
        const sAction = bAllow ? "invite" : "reject";
        jQuery.post("/play/" + Lobby._room + "/" + sAction + "/" + userId + "/" + Lobby._token).done(function() { Lobby._hide(); });
    },

    reduceLength : function(input)
    {
        if (input.length < 30)
            return input;
        else
            return input.substring(0, 29);
    },
    
    updateList : function(data)
    {
        let sHtml = "";
        let nLen = data.length;
        let _entry;
        for (let i = 0; i < nLen; i++)
        {
            _entry = data[i];
            if (_entry.name.indexOf("<") === -1 && _entry.id.indexOf("<") === -1)
            {
                let _temp = Lobby.reduceLength(_entry.name);
                sHtml += `<p><i data-id="${_entry.id}"  class="fa fa-user-times" aria-hidden="true" title="Reject player"></i> 
                <i data-id="${_entry.id}" class="fa fa-user-plus" aria-hidden="true" title="Add to game"></i> ${_temp}`;
            }
        }
        
        if (sHtml !== "")
        {
            jQuery("#lobby .lobby-list").html(sHtml);
            jQuery("#lobby .lobby-list i").click(function()
            {
                let jThis = jQuery(this);
                Lobby.sendDecision(jQuery(this).attr("data-id"), jThis.hasClass("fa-user-plus"));
            });
            jQuery("#lobby").removeClass("hide");
        }
    },

    init : function()
    {
        if (Lobby._room === "" || Lobby._token === "" || Lobby._isReady)
            return;
            
        jQuery("body").append(`<div id="lobby-wrapper" class="lobby-wrapper blue-box cursor-pointer">
                <div class="icons" id="">
                    <i class="fa fa-user-circle" aria-hidden="true"></i>
                </div>
            </div>
            <div id="lobby" class="hide">
                <div class="menu-overlay lobby-overlay"></div>
                <div class="lobby-requests blue-box">
                    <h3>Users requesting to join</h3>
                    <div class="lobby-list"></div>
                </div>
            </div>
        `);

        jQuery("#loblobby .menu-overlay").click(Lobby._hide);
        jQuery("#lobby-wrapper").click(Lobby._loadList);
        jQuery("#interface").addClass("is-admin");
        Lobby._isReady = true;
    },
};

jQuery(document).ready(Lobby.init);
