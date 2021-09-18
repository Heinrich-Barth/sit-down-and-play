

class ChatBox {

    constructor() {
        
    }

    static getTimeString(lTime)
    {
        return lTime < 10 ? "0" + lTime : "" + lTime;
    }

    static getTimer()
    {
        const pDate = new Date();
        const sHo = ChatBox.getTimeString(pDate.getHours());
        const sMi = ChatBox.getTimeString(pDate.getMinutes());
        const sSe = ChatBox.getTimeString(pDate.getSeconds());
        return "<span>(" + sHo + ":" + sMi + ":" + sSe + ")</span>";
    }

    create()
    {
        if (document.getElementById("chatbox") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "chatbox blue-box");
        div.setAttribute("id", "chatbox");
        document.body.appendChild(div);
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
        text.innerHTML = "<b>" + ChatBox.getTimer() + sFrom + ":</b> " + this.ensureLength(sText, 200);
        let objDiv = document.getElementById("chatbox");
        objDiv.appendChild(text);

        this.reduceMessages(objDiv);
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    reduceMessages(div)
    {
        const maxLen = 15;
        const list = div.querySelectorAll("div");
        if (list !== null && list.length > maxLen && div.firstChild)
            div.removeChild(div.firstChild);
    }

    isValidInput(sText) 
    {
        return sText.indexOf("<") === -1 && sText.indexOf(">") === -1;
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


