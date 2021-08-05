
const ID_CHARACTERS = "arda_characters";
const ID_MP = "arda_mps";
const ID_MINORS = "arda_minors";


exports.setupArdaSpecials = function(Game)
{
    Game.callbacks.arda = { 
      
        onDrawMinor : function(userid, socket, obj)
        {
            var _card = Game._playboardManager.DrawCard(ID_MINORS, false);
            if (_card === null)
                return;

            Game.drawCard(ID_MINORS, _card.uuid, _card.code, _card.type, 1);
            Game.apis.chat.send(ID_MINORS, "drew 1 card");
        }
    };

    Game.apis.meccgApi.addListener("/game/arda/minor/draw", Game.callbacks.arda.onDrawMinor);
}