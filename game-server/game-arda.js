
class Arda { 

    constructor(game)
    {
        this.game = game;
        this.reycled = {
            minors : false,
            characters: false,
        };
    }

    assignOpeningChars7()
    {
        const players = this.game._playboardManager.decks.getPlayers();
        if (players.length === 0)
            return;

        for (let userid of players)
        {
            const deck = this.game._playboardManager.decks.getPlayerDeck(userid);
            if (deck === null)
                continue;
                
            const uuid1 = deck.drawOpeningCharacterMind7();
            const uuid2 = deck.drawOpeningCharacterMind7();

            if (uuid1 !== "")
                this.game.callbacks.card.onCardDrawSingle(userid);

            if (uuid2 !== "")
                this.game.callbacks.card.onCardDrawSingle(userid);
        }

        this.game._playboardManager.decks.getAdminDeck().mergeCharacterListsOnce();
    }

    assignOpeningChars(nCount)
    {
        const players = this.game._playboardManager.decks.getPlayers();
        for (let userid of players)
        {
            const deck = this.game._playboardManager.decks.getPlayerDeck(userid);
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
                this.game.callbacks.card.onCardDrawSingle(userid);
        }

        this.game._playboardManager.decks.getAdminDeck().addSpecialCharacers();
        this.game._playboardManager.decks.getAdminDeck().shuffleCharacterDeck();
    }

    onShuffle(userid, socket, obj)
    {
        const deck = this.game._playboardManager.decks.getAdminDeck();

        if (obj.target === "minor")
        {
            deck.shuffleMinorItems();
            this.game.apis.chat.send(userid, "shuffled minor items deck");
        }
        else if (obj.target === "mps")
        {
            deck.shuffleMPs();
            this.game.apis.chat.send(userid, "shuffled marshalling points deck");
        }
    }

    onRecycle(userid, socket, obj)
    {
        const deck = this.game._playboardManager.decks.getAdminDeck();
        let isMinor = false;

        if (obj.type === "minor")
        {
            deck.recycleMinorItems();
            this.game.apis.chat.send(userid, "recycled all minor items");
            this.reycled.minors = true;
            isMinor = true;
        }
        else if (obj.type === "charackters")
        {
            deck.recycleCharacter();
            this.reycled.characters = true;
            this.game.apis.chat.send(userid, "recycled all characters");
        }
        else
            return;

        for (let i = 0; i < 4; i++)
        {
            const uuid = isMinor ? deck.drawCardMinorItems() : deck.drawCardCharacter();
            if (uuid === "")
                continue;
                
            const card = this.game._playboardManager.decks.getFullPlayerCard(uuid);
            if (card !== null)
            {
                const data = {uuid:uuid, code:card.code, hand:obj.type, clear : i == 0};
                this.game.apis.meccgApi.publish("/game/arda/draw", userid, data);
                this.game.apis.chat.send(userid, "drew common card " + card.code);
            }
        }

        this.game.apis.meccgApi.publish("/game/arda/hand/show", userid, {});
    }

    onAssignCharacters(userid)
    {
        this.assignOpeningChars7();
        this.assignOpeningChars(8);
    }

    onViewCards(userid, socket, obj)
    {
        const type = obj.type;
        const pile = obj.pile;
        
        let _list = null;
        if (type === "minor")
        {
            if (pile === "playdeck")
                _list = this.game._playboardManager.decks.getCards().playdeckMinor(userid);
            else if (pile === "discard")
                _list = this.game._playboardManager.decks.getCards().discardPileMinor(userid);
        }
        else if (type === "mps")
        {
            if (pile === "playdeck")
                _list = this.game._playboardManager.decks.getCards().playdeckMPs(userid);
            else if (pile === "discard")
                _list = this.game._playboardManager.decks.getCards().discardPileMPs(userid);
        }
        
        if (_list !== null)
        {
            Game.apis.chat.send(userid, " views " + type + " cards in " + pile);
            Game.apis.meccgApi.reply("/game/arda/view", socket, {type: type, pile:pile, list: this.game._playboardManager.getCardList(_list) });
        }
    }
  
    onDrawCard(userid, socket, obj)
    {
        const deck = this.game._playboardManager.decks.getPlayerDeck(userid);
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
        else
            return;

        if (uuid === "")
        {
            let sDeck = "There are no cards left in the ";
            if (type === "mps")
                sDeck += "marshalling points deck";
            else if (type === "minor")
                sDeck += "minor items offering deck";
            else
                sDeck += "roving characters deck";

                this.game.apis.meccgApi.publish("/game/notification", userid, { type: "warning", message: sDeck } );
            return;
        }
            

        const card = this.game._playboardManager.decks.getFullPlayerCard(uuid);
        if (card === null)
            return;

            this.game._playboardManager.UpdateOwnership(userid, card);

        const data = {uuid:uuid, code:card.code, hand:obj.type, clear : false};
        this.game.apis.meccgApi.publish("/game/arda/draw", userid, data);
        this.game.apis.chat.send(userid, "drew 1 " + obj.type + " item card");
    }

    onCheckDraft(userid, socket)
    {
        let data = {
            characters: this.reycled.characters,
            minoritems: this.reycled.minors,
        };

        this.game.apis.meccgApi.reply("/game/arda/checkdraft", socket, data);
    }

    onGetHandMinorItems(userid)
    {
        const listMinor = this.game._playboardManager.getCardList(this.game._playboardManager.decks.getCards().handMinorItems(userid));
        this.game.apis.meccgApi.publish("/game/arda/hand/minor", userid, {list: listMinor});

        const listMP = this.game._playboardManager.getCardList(this.game._playboardManager.decks.getCards().handMarshallingPoints(userid));
        this.game.apis.meccgApi.publish("/game/arda/hand/marshallingpoints", userid, {list: listMP});

        const listChars = this.game._playboardManager.getCardList(this.game._playboardManager.decks.getAdminDeck().getHandCharacters());
        this.game.apis.meccgApi.publish("/game/arda/hand/characters", userid, {list: listChars});
    }

    onMoveArdaHandCard(userid, socket, obj)
    {
        if (obj.to !== "hand" && obj.to !== "discardpile")
            return;

        const uuid = obj.uuid;
        const deck = this.game._playboardManager.decks.getPlayerDeck(userid);
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

        const card = this.game._playboardManager.decks.getFullPlayerCard(uuid);
        if (card === null)
            return;

        /** this is essential, otherwise a card will not be removed from the respective hand */
        this.game._playboardManager.UpdateOwnership(userid, card);

        this.game.apis.meccgApi.publish("/game/arda/hand/card/remove", userid, { uuid: obj.uuid });
        if (obj.to === "hand")
        {
            deck.push().toPlaydeckSpecific(uuid);
            this.game.callbacks.card.onCardDrawSingle(userid, socket, {});
            this.game.apis.chat.send(userid, "moved 1 arda " + obj.type + " item card to their hand");
        }
        else if (obj.to === "discardpile")
        {
            deck.push().toDiscardpile(uuid);
            this.game.apis.chat.send(userid, "discarded 1 card from arda hand " + obj.type);
        }
    }
}

exports.setupArdaSpecials = function(Game)
{
    const pArda = new Arda(Game);
    Game.apis.meccgApi.addListener("/game/arda/hands", pArda.onGetHandMinorItems.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/checkdraft", pArda.onCheckDraft.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/from-hand", pArda.onMoveArdaHandCard.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/draw", pArda.onDrawCard.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/recycle", pArda.onRecycle.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/assign-characters", pArda.onAssignCharacters.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/view", pArda.onViewCards.bind(pArda));
    Game.apis.meccgApi.addListener("/game/arda/shuffle", pArda.onShuffle.bind(pArda));
};