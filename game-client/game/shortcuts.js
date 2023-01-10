
if (document.body.getAttribute("data-is-watcher") !== "true")
{
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
                MapWindow.close();
                break;

            /* R */
            case "r":
                document.getElementById("playercard_hand").querySelector(".card-dice").dispatchEvent(new Event("click"));
                break;

            /* D */
            case "d":
                document.getElementById("draw_card").click();
                break;

            default:
                break;
        }

    }, false);
}