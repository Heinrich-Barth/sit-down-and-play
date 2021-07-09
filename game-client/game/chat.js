

class ChatBox {

    constructor() {
        
    }

    create()
    {
        if (document.getElementById("chatbox") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "chatbox-wrapper");
        div.setAttribute("id", "chatbox");
        div.innerHTML = `<div class="chatbox">
                <div class="chatmessages blue-box"></div>
                <input type="text" class="chattext" maxlength="200" placeholder="Type message (max 200 chars)">
            </div>`;

        document.body.appendChild(div);
        document.getElementById("chatbox").querySelector(".chattext").onkeyup = ChatBox.OnKeyPress;
    }

    ensureLength(sText, nLen) 
    {
        if (sText.length > nLen)
            return sText.substr(0, nLen - 1) + "...";
        else
            return sText;
    }

    message(sFrom, sText) 
    {
        if (!this.isValidInput(sFrom) || !this.isValidInput(sText) || sText === "")
            return;

        const text = document.createElement("div");
        text.innerHTML = "<b>" + sFrom + ":</b> " + this.ensureLength(sText, 200);
        let objDiv = document.getElementById("chatbox").querySelector(".chatmessages");

        objDiv.appendChild(text);

        objDiv.scrollTop = objDiv.scrollHeight;
    }

    isValidInput(sText) 
    {
        return sText.indexOf("<") === -1 && sText.indexOf(">") === -1;
    }

    static OnKeyPress(e) 
    {
        if (e.which === 13) 
        {
            const jThis = document.getElementById("chatbox").querySelector(".chattext");
            const sText = jThis.value.trim().replace("<", "").replace(">", "");
            jThis.value = "";

            if (sText !== "")
                MeccgApi.send("/game/chat/message", sText);

            return false;
        }
    }

    static ToggleView(e) 
    {
        const elem = document.getElementById("chatbox");
        if (e.detail)
            elem.classList.remove("hidden");
        else
            elem.classList.add("hidden");
    }

    static OnChatMessageReceived(bIsMe, jData) 
    {
        new ChatBox().message(MeccgApi.getUserName(jData.userid), jData.message);
    }
}

document.body.addEventListener("meccg-chat-view", ChatBox.ToggleView, false);
document.body.addEventListener("meccg-init-ready", () => new ChatBox().create(), false);

MeccgApi.addListener("/game/chat/message", ChatBox.OnChatMessageReceived);


