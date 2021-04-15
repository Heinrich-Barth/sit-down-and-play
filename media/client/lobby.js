function onResult(data)
{
    if (data.status === "denied")
        window.location.href = "/error/denied";
    else if (data.status === "ok")
        window.location.href = "/play/" + data.room;
}

function checkAdmission()
{
    let sRoom = jQuery("#awaiting").attr("data-room");
    let sId = jQuery("#awaiting").attr("data-id");

    jQuery.get("/play/" + sRoom + "/status/" + sId, { }).done(onResult);
}

jQuery(document).ready(function()
{
    setInterval(checkAdmission, 3000);

    createQuestionBox(function()
    {
        let g_sRoom = jQuery("#awaiting").attr("data-room");
        window.open('https://meet.jit.si/' + g_sRoom, "_blank");
    }, 
    "Do you want to join the audio chat?", 
    "The chat will open in a new window and you have to actively confirm to join the meeting there.", 
    "Join audio", 
    "Do not join",
    "question-voice-icon").show("");
});

