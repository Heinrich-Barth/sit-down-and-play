

class ChatBox {

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


        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("type", "text/css");
        styleSheet.setAttribute("href", "/client/game/chat/chat.css?t=" + Date.now());
        document.head.appendChild(styleSheet);

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
        text.innerHTML = "<b>" + sFrom + "</b> " + this.ensureLength(sText, 200);
        let objDiv = document.getElementById("chatbox");
        objDiv.prepend(text);

        this.reduceMessages(objDiv);
        objDiv.scrollTop = 0;
    }

    reduceMessages(div)
    {
        const maxLen = 70;
        const list = div.querySelectorAll("div");
        if (list !== null && list.length > maxLen && div.lastChild)
            div.removeChild(div.lastChild);
    }

    isValidInput(sText) 
    {
        return sText !== undefined && sText.indexOf("<") === -1 && sText.indexOf(">") === -1;
    }

    static ToggleView(e) 
    {
        const elem = document.getElementById("chatbox");
        if (e.detail)
            elem.classList.remove("hidden");
        else
            elem.classList.add("hidden");
    }

    static OnChatMessageReceived(e) 
    {
        new ChatBox().message(e.detail.name, e.detail.message);
    }
}

new ChatBox().create();

document.body.addEventListener("meccg-chat-view", ChatBox.ToggleView, false);
document.body.addEventListener("meccg-chat-message", ChatBox.OnChatMessageReceived, false);