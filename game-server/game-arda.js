

exports.setupArdaSpecials = function(Game)
{
    Game.ardaActions = { };

    Game.ardaActions.assignOpeningChars7 = function(Game)
    {
        const players = Game._playboardManager.decks.getPlayers();
        if (players.length === 0)
            return;

        for (let userid of players)
        {
            const deck = Game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                continue;
                
            const uuid1 = deck.drawOpeningCharacterMind7();
            const uuid2 = deck.drawOpeningCharacterMind7();

            if (uuid1 !== "")
                Game.callbacks.card.onCardDrawSingle(userid);

            if (uuid2 !== "")
                Game.callbacks.card.onCardDrawSingle(userid);
        }

        Game._playboardManager.decks.getAdminDeck().mergeCharacterListsOnce();
    };

    Game.ardaActions.assignOpeningChars = function(Game, nCount)
    {
        const players = Game._playboardManager.decks.getPlayers();
        for (let userid of players)
        {
            const deck = Game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                continue;

            let nDraw = 0;
            for (let i = 0; i < nCount; i++)
            { 
                const uuid = deck.drawOpeningCharacterToHand()
                if (uuid !== "")
                    nDraw++;
            }

            for (let i = 0; i < nDraw; i++)
                Game.callbacks.card.onCardDrawSingle(userid);
        }

        Game._playboardManager.decks.getAdminDeck().addSpecialCharacers();
        Game._playboardManager.decks.getAdminDeck().shuffleCharacterDeck();
    };

    Game.callbacks.arda = { 

        onAssignCharacters : function(userid)
        {
            Game.ardaActions.assignOpeningChars7(Game);
            Game.ardaActions.assignOpeningChars(Game, 8);

            for (let i = 0; i < 5; i++)
                Game._playboardManager.decks.getAdminDeck().drawCardCharacter();
                
            const listMinor = Game._playboardManager.getCardList(Game._playboardManager.decks.getAdminDeck().getHandCharacters());
            Game.apis.meccgApi.publish("/game/arda/hand/characters", userid, {list: listMinor});
        },
      
        onDrawCard : function(userid, socket, obj)
        {
            const deck = Game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                return;

            let uuid = "";
            const type = obj.type;
            if (type === "minor")
                uuid = deck.drawCardMinorItems();
            else if (type === "mps")
                uuid = deck.drawCardMarshallingPoints();
            else if (type === "charackters")
                uuid = deck.drawCardCharacter();

            if (uuid === "")
                return;

            const card = Game._playboardManager.decks.getFullPlayerCard(uuid);
            if (card === null)
                return;
            
            const data = {uuid:uuid, code:card.code, hand:obj.type};
            Game.apis.meccgApi.publish("/game/arda/draw", userid, data);
            Game.apis.chat.send(userid, "drew 1 " + obj.type + " item card");
        },

        onGetHandMinorItems : function(userid, socket, obj)
        {
            const listMinor = Game._playboardManager.getCardList(Game._playboardManager.decks.getCards().handMinorItems(userid));
            Game.apis.meccgApi.publish("/game/arda/hand/minor", userid, {list: listMinor});

            const listMP = Game._playboardManager.getCardList(Game._playboardManager.decks.getCards().handMarshallingPoints(userid));
            Game.apis.meccgApi.publish("/game/arda/hand/marshallingpoints", userid, {list: listMP});

            const listChars = Game._playboardManager.getCardList(Game._playboardManager.decks.getAdminDeck().getHandCharacters());
            Game.apis.meccgApi.publish("/game/arda/hand/characters", userid, {list: listChars});
        },

        onMoveArdaHandCard: function(userid, socket, obj)
        {
            if (obj.to !== "hand" && obj.to !== "discardpile")
                return;

            const uuid = obj.uuid;
            const deck = Game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
            {
                console.log("Cannot find deck of player " + userid);
                return;
            }

            let bOk = false;

            if (obj.type === "minor")
                bOk = deck.pop().fromHandMinor(uuid)
            else if (obj.type === "mps")
                bOk = deck.pop().fromHandMps(uuid)
            else if (obj.type === "charackters")
                bOk = deck.pop().fromHandCharacters(uuid)

            if (!bOk)
                return;

            Game.apis.meccgApi.publish("/game/arda/hand/card/remove", userid, { uuid: obj.uuid });
            if (obj.to === "hand" && bOk)
            {
                deck.push().toPlaydeck(uuid);
                Game.callbacks.card.onCardDrawSingle(userid, socket, {});
                Game.apis.chat.send(userid, "moved 1 arda " + obj.type + " item card to their hand");
            }
            else if (obj.to === "discardpile" && bOk)
            {
                deck.push().toDiscardpile(uuid);
                Game.apis.chat.send(userid, "discarded 1 card from arda hand " + obj.type);
            }
        }
    };

    Game.apis.meccgApi.addListener("/game/arda/hands", Game.callbacks.arda.onGetHandMinorItems);
    Game.apis.meccgApi.addListener("/game/arda/from-hand", Game.callbacks.arda.onMoveArdaHandCard);
    Game.apis.meccgApi.addListener("/game/arda/draw", Game.callbacks.arda.onDrawCard);
    Game.apis.meccgApi.addListener("/game/arda/assign-characters", Game.callbacks.arda.onAssignCharacters);
    
}
