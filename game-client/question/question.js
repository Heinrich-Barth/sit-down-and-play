
class Question {

    constructor(icon)
    {
        this.callbackOk = null;
        this.css = "";
        this.icon = icon === undefined || icon === "" ? "fa-question-circle" : icon;
    }

    static removeNode(node)
    {
        if (node !== null)
        {
            while (node.firstChild) 
                node.removeChild(node.firstChild);

            node.parentNode.removeChild(node)
        }
    }
    
    addClass(sClass)
    {
        if (sClass !== "")
        {
            if (this.css === "")
                this.css = sClass;
            else
                this.css += " " + sClass;
        }

        return this;
    }

    insertTemplate(title, message, labelOk)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "hidden");
        div.setAttribute("id", "question_box");
        div.setAttribute("data-game", "");

        const innerDiv = document.createElement("div");
        innerDiv.setAttribute("class", "blue-box question-game");
        innerDiv.innerHTML = `<div class="fa ${this.icon} question-icon"></div>
                              <div class="question-question">
                                <h3>${title}</h3><p class="bold">${message}</p>
                              </div>
                              <div class="question-answers">
                                <input type="button" name="deck" id="q_ok" class="w100" value="${labelOk}" />
                                <input type="button" name="deck" id="q_cancel" class="w100 cancel" value="Cancel" />
                              </div>`;

        if (this.css !== "")
        {
            const divCss = document.createElement("div");
            divCss.setAttribute("class", this.css);
            innerDiv.appendChild(divCss);
        }

        div.appendChild(innerDiv);
        
        document.body.appendChild(div);
    }

    close()
    {
        const jBox = document.getElementById("question_box");
        if (jBox !== null)
            jBox.classList.add("hidden");
        
        Question.removeNode(document.getElementById("q_ok"));
        Question.removeNode(document.getElementById("q_cancel")); 
        Question.removeNode(document.getElementById("question_box")); 
    }

    isVisible()
    {
        return document.getElementById("question_box") !== null;
    }

    show(sTitle, sInfo, sLabelOk)
    {
        if (this.isVisible())
            this.close();

        this.insertTemplate(sTitle, sInfo, sLabelOk);
    
        document.getElementById("question_box").onclick = this.close.bind(this);
        document.getElementById("q_cancel").onclick = this.close.bind(this);
        document.getElementById("q_ok").onclick = this.onClickOk.bind(this);
        
        const jBox = document.getElementById("question_box");
        jBox.setAttribute("data-game", "");
        jBox.classList.remove("hidden");
    }

    onClickOk()
    {
        this.close();

        if (this.callbackOk !== null)
            this.callbackOk();
    }

    onOk(callback)
    {
        this.callbackOk = callback;
        return this;
    }
}

(function(){
    const styleSheet = document.createElement("link")
    styleSheet.setAttribute("rel", "stylesheet");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("href", "/media/client/question/question.css");
    document.head.appendChild(styleSheet)
})();