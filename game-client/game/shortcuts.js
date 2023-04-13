
const clickProgressionLink = function(sPhase)
{
    const elem = MeccgPlayers.isMyTurn() ? document.getElementById("progression-phase-box") : null;
    if (elem === null)
        return;

    const link = elem.querySelector('a[data-phase="' + sPhase + '"]');
    if (link !== null && !link.classList.contains("act"))
        link.click();      
}

const ShotcutManager = 
{
    clickProgressionLink: function(sPhase)
    {
        const elem = MeccgPlayers.isMyTurn() ? document.getElementById("progression-phase-box") : null;
        if (elem === null)
            return;

        const link = elem.querySelector('a[data-phase="' + sPhase + '"]');
        if (link !== null && !link.classList.contains("act"))
            link.click();      
    },

    getKey: function(ev)
    {
        let code = "";
        if (ev.key !== undefined)
            code = ev.key;
        else if (ev.keyIdentifier !== undefined)
            code = ev.keyIdentifier;

        return "" + code;
    },

    onKeyUp : function(evt)
    {
        const code = this.getKey(evt);
        switch(code)
        {
            /* ESC */
            case "Escape":
                MapWindow.close();
                break;

            case "r":
                if (CardPreview.currentCharacterId !== undefined && CardPreview.currentCharacterId !== "")
                    document.getElementById(CardPreview.currentCharacterId).querySelector(".card-dice").dispatchEvent(new Event("click"));
                else
                    document.getElementById("playercard_hand").querySelector(".card-dice").dispatchEvent(new Event("click"));
                break;

            case "d":
                document.getElementById("draw_card").click();
                break;

            case "e":
                this.clickProgressionLink("eotdiscard");
                break;

            case "q":
                this.clickProgressionLink("eot");
                break;

            case "s":
                this.clickProgressionLink("site");
                break;

            default:
                break;
        }
    },

    init()
    {
        document.body.addEventListener("keyup", ShotcutManager.onKeyUp.bind(ShotcutManager), false);

        const elem = document.getElementById("playercard_hand");
        if (elem !== null)
        {
            const icons = elem.querySelector(".icons");
            if (icons !== null)
                icons.setAttribute("id", "progression-phase-box");
        }
    }
}

if (document.body.getAttribute("data-is-watcher") !== "true")
    ShotcutManager.init();