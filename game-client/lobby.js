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

    fetch("/play/" + sRoom + "/status/" + sId).then((response) => response.json().then(onResult)).catch(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Could not fetch status." })));
};

setInterval(checkAdmission, 3000);