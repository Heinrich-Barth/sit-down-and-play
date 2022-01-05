
class Question {

    constructor()
    {
        this.callbackOk = null;
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

    insertTemplate(title, message, labelOk)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "hidden");
        div.setAttribute("id", "question_box");
        div.setAttribute("data-game", "");
        div.innerHTML = `<div class="blue-box question-game">
            <div class="question-question question-question-icon"><h3>${title}</h3><p class="bold">${message}</p></div>
            <div class="question-answers">
                <input type="button" name="deck" id="q_ok" class="w100" value="${labelOk}" />
                <input type="button" name="deck" id="q_cancel" class="w100 cancel" value="Cancel" />
            </div>
        </div>`;
        
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

    show(sTitle, sInfo, sLabelOk)
    {
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
