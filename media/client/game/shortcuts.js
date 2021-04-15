
const ShotcutActions = {


    onDrawEvent : function()
    {
        jQuery("#draw_card").click();
    },

    onRollDice : function()
    {
        jQuery("#playercard_hand .card-dice").click();
    },

    onKeyUp : function(ev)
    {
        switch(ev.which)
        {
            /* ESC */
            case 27:
                MapWindow.close();
                break;

            /* R */
            case 82:
                ShotcutActions.onRollDice();
                break;

            /* D */
            case 68:
                ShotcutActions.onDrawEvent();
                break;

            default:
                break;
        }

    },

    init : function(pBody)
    {
        pBody.addEventListener("keyup", ShotcutActions.onKeyUp, false);
    }
};

ShotcutActions.init(document.body);