const onResult = function(data)
{
    if (data.status === "denied")
        window.location.href = "/error/denied";
    else if (data.status === "ok")
        window.location.href = "/play/" + data.room;
};

const checkAdmission = function()
{
    let sRoom = document.getElementById("awaiting").getAttribute("data-room");
    let sId = document.getElementById("awaiting").getAttribute("data-id");

    fetch("/play/" + sRoom + "/status/" + sId).then((response) =>
    {
        if (response.status === 200)
            response.json().then(onResult);
        else
            throw "not possible";
    }).catch(() => 
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch status." }));
    });
};

(function()
{
    setInterval(checkAdmission, 3000);

    createQuestionBox(function()
    {
        let g_sRoom = document.getElementById("awaiting").getAttribute("data-room");
        window.open('https://meet.jit.si/' + g_sRoom, "_blank");
    }, 
    "Do you want to join the audio chat?", 
    "The chat will open in a new window and you have to actively confirm to join the meeting there.", 
    "Join audio", 
    "Do not join",
    "question-voice-icon").show("");
})();