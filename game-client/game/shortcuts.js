
document.body.addEventListener("keyup", function(ev)
{
    let code = "";
    if (ev.key !== undefined)
        code = ev.key;
    else if (ev.keyIdentifier !== undefined)
        code = ev.keyIdentifier;

    switch("" + code)
    {
        /* ESC */
        case "Escape":
        case "27":
            MapWindow.close();
            break;

        /* R */
        case "KeyR":
        case "r":
        case "82":
            document.getElementById("playercard_hand").querySelector(".card-dice").dispatchEvent(new Event("click"));
            break;

        /* D */
        case "KeyD":
        case "d":
        case "68":
            document.getElementById("draw_card").click();
            break;

        default:
            break;
    }

}, false);