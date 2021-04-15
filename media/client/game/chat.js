

const ChatBox = {

    _isReady : false,

    isValidInput : function(sText)
    {
        return sText.indexOf("<") === -1 && sText.indexOf(">") === -1;
    },

    ensureLength : function(sText, nLen)
    {
        if (sText.length > nLen)
            return sText.substr(0, nLen - 1) + "...";
        else
            return sText;
    },

    message : function(sFrom, sText)
    {
        if (!ChatBox.isValidInput(sFrom) || !ChatBox.isValidInput(sText) || sText === "")
            return;
    
        let jText = jQuery('.chatmessages');
        jText.append("<br><b>" + sFrom + ":</b> " + ChatBox.ensureLength(sText, 200));
        jText.scrollTop(jText.height());

        let objDiv = jText.get(0);
        objDiv.scrollTop = objDiv.scrollHeight;
    },

    onKeyPress : function (e)
    {
        if (e.which === 13)
        {
            const jThis = jQuery('.chattext');
            const sText = jThis.val().trim().replace("<", "").replace(">", "");
            jThis.val("");
            
            if (sText !== "")
                MeccgApi.send("/game/chat/message", sText);
            
            return false;
        }
    },

    init : function()
    {
        if (ChatBox._isReady)
            return;

        jQuery("body").append(`<div class="chatbox-wrapper" id="chatbox">
            <div class="chatbox">
                <div class="chatmessages blue-box"></div>
                <input type="text" class="chattext" maxlength="200" placeholder="Type message (max 200 chars)">
            </div>
        </div>`);

        jQuery('.chattext').keypress(ChatBox.onKeyPress);

        ChatBox._isReady = true;
    },

    toggleView : function(e)
    {
        if (e.detail)
            jQuery("#chatbox").removeClass("hidden");
        else
            jQuery("#chatbox").addClass("hidden");
    }
};

document.body.addEventListener("meccg-chat-view", ChatBox.toggleView, false);

MeccgApi.addListener("/game/chat/message", function(bIsMe, jData)
{
    ChatBox.message(MeccgApi.getUserName(jData.userid), jData.message);
});


jQuery(document).ready(ChatBox.init);

