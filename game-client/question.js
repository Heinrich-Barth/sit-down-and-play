


function createQuestionBox(callbackOk, sTitle, sInfo, sLabelOk, sLabelCancel, sCss)
{
    let _callbackOk = callbackOk;
    
    if (typeof sTitle === "undefined")
        sTitle = "";

    if (typeof sInfo === "undefined")
        sInfo = "";

    if (typeof sLabelOk === "undefined")
        sLabelOk = "Ok";

    if (typeof sLabelCancel === "undefined")
        sLabelCancel = "Cancel";

    if (typeof sCss === "undefined" || sCss === "")
        sCss = "";

    const deleteDomNode = function(node)
    {
        if (node !== null)
            node.parentNode.removeChild(node);
    };

    const empty = function(parent) 
    {
        if (parent !== null)
        {
            while (parent.firstChild) 
                parent.removeChild(parent.firstChild);
        }
    }

    const removeAncClear = function(node)
    {
        empty(node);
        deleteDomNode(node);
    }


    const getTemplate = function(sTitle, sInfo, sLabelOk, sLabelCancel)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "hidden");
        div.setAttribute("id", "question_box");
        div.setAttribute("data-game", "");
        div.innerHTML = `<div class="blue-box question-game">
            <div class="question-question ${sCss}"><h3>${sTitle}</h3><p class="bold">${sInfo}</p></div>
            <div class="question-answers">
                <input type="button" name="deck" id="q_ok" class="w100" value="${sLabelOk}" />
                <input type="button" name="deck" id="q_cancel" class="w100 cancel" value="${sLabelCancel}" />
            </div>
        </div>`;
        
        return div;
    }

    let QuestionBox = {

        close : function()
        {
            let jBox = document.getElementById("question_box");
            jBox.setAttribute("data-game", "");
            jBox.classList.add("hidden");
        },

        remove : function()
        {
            removeAncClear(document.getElementById("q_ok"));
            removeAncClear(document.getElementById("q_cancel")); 
            removeAncClear(document.getElementById("question_box")); 
        },

        show : function(sData)
        {
            let jBox = document.getElementById("question_box");
            jBox.setAttribute("data-game", sData);
            jBox.classList.remove("hidden");
        },

        onOk : function()
        {
            let roomId = document.getElementById("question_box").getAttribute("data-game");
            QuestionBox.close();
            _callbackOk(roomId);
        }

    };

    if (typeof _callbackOk === "undefined")
        _callbackOk = QuestionBox.close;

    if (document.getElementById("question_box") !== null)
        removeAncClear(document.getElementById("question_box"));

    document.body.appendChild(getTemplate(sTitle, sInfo, sLabelOk, sLabelCancel));
    
    document.getElementById("question_box").onclick = QuestionBox.close;
    document.getElementById("q_cancel").onclick = QuestionBox.close;
    document.getElementById("q_ok").onclick = QuestionBox.onOk;

    return QuestionBox;
}

