


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

    function getTemplate(sTitle, sInfo, sLabelOk, sLabelCancel)
    {
return '<div class="hidden" id="question_box" data-game=""> \
<div class="blue-box question-game"><div class="question-question '+sCss+'"><h3>'+sTitle+'</h3><p class="bold">'+sInfo+'</p></div> \
<div class="question-answers"><input type="button" name="deck" id="q_ok" class="w100" value="'+sLabelOk+'" /><input type="button" name="deck" id="q_cancel" class="w100 cancel" value="'+sLabelCancel+'" /></div></div></div>';
    }

    let QuestionBox = {

        close : function()
        {
            let jBox = jQuery("#question_box");
            jBox.attr("data-game", "");
            jBox.addClass("hidden");
        },

        remove : function()
        {
            jQuery("#q_ok").remove(); 
            jQuery("#q_cancel").remove(); 
            jQuery("#question_box").remove(); 
        },

        show : function(sData)
        {
            let jBox = jQuery("#question_box");
            jBox.attr("data-game", sData);
            jBox.removeClass("hidden");
        },

        onOk : function()
        {
            let roomId = jQuery("#question_box").attr("data-game");
            
            QuestionBox.close();

            _callbackOk(roomId);
        }

    };

    if (typeof _callbackOk === "undefined")
        _callbackOk = QuestionBox.close;

    if (jQuery("#question_box").length == 1)
    {
        jQuery("#question_box").empty();
        jQuery("#question_box").remove();
    }

    jQuery("body").append(getTemplate(sTitle, sInfo, sLabelOk, sLabelCancel));
    
    jQuery("#question_box").click(QuestionBox.close);
    jQuery("#q_cancel").click(QuestionBox.close);   
    jQuery("#q_ok").click(QuestionBox.onOk);

    return QuestionBox;
}

