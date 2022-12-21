
const GameStandard = require("./GameStandard");

class GameArda extends GameStandard
{
    constructor(_MeccgApi, _Chat, _playboardManager)
    {
        super(_MeccgApi, _Chat, _playboardManager)
        
        this.reycled = {
            minors : false,
            characters: false,
            ready : false,
        };
    }

    isArda()
    {
        return true;
    }
    
    assignOpeningChars7()
    {
        const players = this.getDeckManager().getPlayers();
        if (players.length === 0)
            return;

        for (let userid of players)
        {
            const deck = this.getDeckManager().getPlayerDeck(userid);
            if (deck === null)
                continue;
                
            const uuid1 = deck.drawOpeningCharacterMind7();
            const uuid2 = deck.drawOpeningCharacterMind7();

            if (uuid1 !== "")
                this.drawSingleCard(userid);

            if (uuid2 !== "")
                this.drawSingleCard(userid);
        }

        let pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null)
            pAdminDeck.mergeCharacterListsOnce();
    }

    assignOpeningChars(nCount)
    {
        const players = this.getDeckManager().getPlayers();
        for (let userid of players)
        {
            const deck = this.getDeckManager().getPlayerDeck(userid);
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
                this.drawSingleCard(userid);
        }

        let pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null)
        {
            pAdminDeck.addSpecialCharacers();
            pAdminDeck.shuffleCharacterDeck();
        }
    }

    onShuffle(userid, _socket, obj)
    {
        const deck = this.getDeckManager().getAdminDeck();
        if (deck === null)
            return;

        if (obj.target === "minor")
        {
            deck.shuffleMinorItems();
            this.publishChat(userid, "shuffled minor items deck");
        }
        else if (obj.target === "mps")
        {
            deck.shuffleMPs();
            this.publishChat(userid, "shuffled marshalling points deck");
        }
    }

    onTradeStart(userid, _socket, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second,
            cards: {
                first: this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(obj.first)),
                second: this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(obj.second))
            }
        }

        this.publishToPlayers("/game/arda/trade/start", userid, data);
    }

    onTradeCancel(userid, _socket, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second
        }

        this.publishToPlayers("/game/arda/trade/cancel", userid, data);
        this.publishChat(userid, "cancelled a trade.");
    }

    onTradeRemove(userid, _socket, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        }

        this.publishToPlayers("/game/arda/trade/remove", userid, data);
    }

    onTradeOffer(userid, _socket, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        }

        this.publishToPlayers("/game/arda/trade/offer", userid, data);
    }

    onTradeAccept(userid, _socket, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second
        }

        this.publishToPlayers("/game/arda/trade/accept", userid, data);
        this.publishChat(userid, "accepted a card trade.");
    }

    onTradeSuccess(userid, obj)
    {
        const data = {
            first: obj.first,
            second: obj.second
        }
        this.publishToPlayers("/game/arda/trade/success", userid, data);
        this.publishChat(userid, "completed a card trade.");
    }

    onTradePerformMoveToDeck(traderIds, traderCounts, obj)
    {
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck === null || traderIds.length !== 2)
            return false;

        let _moved = false;

        /** move all trading cards to playdeck to simply draw again */
        for (let _id of traderIds)
        {
            const deck = this.getDeckManager().getPlayerDeck(_id);
            if (deck === null)
            {
                console.warn("Could not obtain trading deck #" + _id);
                continue;
            }

            /** the opposite trader draws equal to the number of cards this current player removes from his hand */
            let _oppositeTraderId = traderIds[0] === _id ? traderIds[1] : traderIds[0];
            traderCounts[_oppositeTraderId] = obj.cards[_id].length;

            for (let _cardUuid of obj.cards[_id])
            {
                if (deck.pop().fromHandMps(_cardUuid))
                {
                    pAdminDeck.push().toPlaydeck(_cardUuid);
                    _moved = true;
                }
            }
        }

        return _moved;
    }

    onTradePerform(userid, _socket, obj)
    {
        /** trading did not work */
        const traderIds = Object.keys(obj.cards);
        const traderCounts = { };

        if (!this.onTradePerformMoveToDeck(traderIds, traderCounts, obj))
        {
            this.onTradeCancel(userid, null, obj);
            return;
        }

        /** now each player draws cards again based on the number of discarded cards of the other player */
        for (let _id of traderIds)
        {
            /** only draw, the update will be sent later from each player on success signal */
            const deck = this.getDeckManager().getPlayerDeck(_id);
            if (deck !== null && traderCounts[_id] !== undefined)
            {
                for (let i = 0; i < traderCounts[_id]; i++)
                    deck.drawCardMarshallingPoints();
            }
        }

        this.onTradeSuccess(userid, obj);
    }
    
    onRecycle(userid, socket, obj)
    {
        const deck = this.getDeckManager().getAdminDeck();
        if (deck === null)
            return;

        let isMinor = false;

        if (obj.type === "minor")
        {
            deck.recycleMinorItems();
            this.publishChat(userid, "recycled all minor items");
            this.reycled.minors = true;
            isMinor = true;
        }
        else if (obj.type === "charackters")
        {
            this.clearPlayerHand();

            deck.recycleCharacter();
            this.publishChat(userid, "recycled all characters");
            this.reycled.characters = true;
        }
        else
            return;

        for (let i = 0; i < 4; i++)
        {
            const uuid = isMinor ? deck.drawCardMinorItems() : deck.drawCardCharacter();
            if (uuid === "")
                continue;
                
            const card = this.getDeckManager().getFullPlayerCard(uuid);
            if (card !== null)
            {
                const data = {uuid:uuid, code:card.code, hand:obj.type, clear : i == 0};
                this.publishToPlayers("/game/arda/draw", userid, data);
                this.publishChat(userid, "drew common card " + card.code);
            }
        }

        this.drawOpeningHand();
        this.publishToPlayers("/game/arda/hand/show", userid, {});
        this.onCheckDraft(userid, socket);
    }

    drawOpeningHand()
    {
        if (!this.reycled.characters || !this.reycled.minors)
            return;

        const players = this.getDeckManager().getPlayers();
        for (let userid of players)
            this.drawCardsFromPlaydeck(userid, 8);
    }

    clearPlayerHand()
    {
        let count = 0;
        const pAdminDeck = this.getDeckManager().getAdminDeck();
        const players = this.getDeckManager().getPlayers();
        for (let userid of players)
        {
            const deck = this.getDeckManager().getPlayerDeck(userid);
            if (deck === null)
                continue;

            let move = [];
            for (let uuid of deck.getCardsInHand())
                move.push(uuid);

            count += move.length;
            for (let uuid of move)
            { 
                if (deck.pop().fromAnywhere(uuid))
                    pAdminDeck.push().toPlaydeck(uuid);
            }
        }
        
        this.publishChat(this.getHost(), count + " card(s) moved from hand into playdeck.");
        this.publishToPlayers("/game/hand/clear", this.getHost(), {});
    }

    onAssignCharacters(userid, socket)
    {
        this.assignOpeningChars7();
        this.assignOpeningChars(8);

        this.reycled.ready = true;
        this.onCheckDraft(userid, socket);
    }

    onViewCards(userid, socket, obj)
    {
        const type = obj.type;
        const pile = obj.pile;
        
        let _list = null;
        if (type === "minor")
        {
            if (pile === "playdeck")
                _list = this.getDeckManager().getCards().playdeckMinor(userid);
            else if (pile === "discard")
                _list = this.getDeckManager().getCards().discardPileMinor(userid);
        }
        else if (type === "mps")
        {
            if (pile === "playdeck")
                _list = this.getDeckManager().getCards().playdeckMPs(userid);
            else if (pile === "discard")
                _list = this.getDeckManager().getCards().discardPileMPs(userid);
        }
        else if (type === "charackters")
        {
            if (pile === "playdeck")
                _list = this.getDeckManager().getCards().playdeckCharacters(userid);
            else if (pile === "discard")
                _list = this.getDeckManager().getCards().discardPileCharacters(userid);
        }
                
        if (_list !== null)
        {
            this.publishChat(userid, " views " + type + " cards in " + pile);
            this.replyToPlayer("/game/arda/view", socket, {type: type, pile:pile, list: this.getCardList(_list) });
        }
    }
  
    onDrawCard(userid, _socket, obj)
    {
        const deck = this.getDeckManager().getPlayerDeck(userid);
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

                this.publishToPlayers("/game/notification", userid, { type: "warning", message: sDeck } );
            return;
        }
        
        const card = this.getDeckManager().getFullPlayerCard(uuid);
        if (card === null)
            return;

        this.updateCardOwnership(userid, card);

        const data = {uuid:uuid, code:card.code, hand:obj.type, clear : false};
        this.publishToPlayers("/game/arda/draw", userid, data);
        this.publishChat(userid, "drew 1 " + obj.type + " item card");
    }

    onCheckDraft(_userid, socket)
    {
        let data = {
            characters: this.reycled.characters,
            minoritems: this.reycled.minors,
            ready: this.reycled.ready
        };

        this.replyToPlayer("/game/arda/checkdraft", socket, data);
    }

    refreshAllHandsOfAllPlayers(userid, socket)
    {
        super.refreshAllHandsOfAllPlayers(userid, socket);

        for (let id of this.getPlayerIds())
        {
            const listMP = this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(id));
            this.publishToPlayers("/game/arda/hand/marshallingpoints", id, {list: listMP});
        }

        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null)
        {
            let list = this.getCardList(pAdminDeck.getHandCharacters());
            this.publishToPlayers("/game/arda/hand/characters", userid, {list: list});

            list = this.getCardList(pAdminDeck.getHandMinorItems());
            this.publishToPlayers("/game/arda/hand/minor", userid, {list: list});
        }
    }

    onGetHandMinorItems(userid)
    {
        const listMinor = this.getCardList(this.getDeckManager().getCards().handMinorItems(userid));
        this.publishToPlayers("/game/arda/hand/minor", userid, {list: listMinor});

        const listMP = this.getCardList(this.getDeckManager().getCards().handMarshallingPoints(userid));
        this.publishToPlayers("/game/arda/hand/marshallingpoints", userid, {list: listMP});

        const pAdminDeck = this.getDeckManager().getAdminDeck();
        if (pAdminDeck !== null)
        {
            const listChars = this.getCardList(pAdminDeck.getHandCharacters());
            this.publishToPlayers("/game/arda/hand/characters", userid, {list: listChars});
        }
    }

    onMoveArdaHandCard(userid, socket, obj)
    {
        if (obj.to !== "hand" && obj.to !== "discardpile")
            return;

        const uuid = obj.uuid;
        const deck = this.getDeckManager().getPlayerDeck(userid);
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

        const card = this.getDeckManager().getFullPlayerCard(uuid);
        if (card === null)
            return;

        /** this is essential, otherwise a card will not be removed from the respective hand */
        this.updateCardOwnership(userid, card);

        this.publishToPlayers("/game/arda/hand/card/remove", userid, { uuid: obj.uuid });
        if (obj.to === "hand")
        {
            deck.push().toPlaydeckSpecific(uuid);
            this.drawSingleCard(userid, socket, {});
            this.publishChat(userid, "moved 1 arda " + obj.type + " item card to their hand");
        }
        else if (obj.to === "discardpile")
        {
            deck.push().toDiscardpile(uuid);
            this.publishChat(userid, "discarded 1 card from arda hand " + obj.type);
        }
    }

    init()
    {
        super.init();

        this.getMeccgApi().addListener("/game/arda/hands", this.onGetHandMinorItems.bind(this));
        this.getMeccgApi().addListener("/game/arda/checkdraft", this.onCheckDraft.bind(this));
        this.getMeccgApi().addListener("/game/arda/from-hand", this.onMoveArdaHandCard.bind(this));
        this.getMeccgApi().addListener("/game/arda/draw", this.onDrawCard.bind(this));
        this.getMeccgApi().addListener("/game/arda/recycle", this.onRecycle.bind(this));
        this.getMeccgApi().addListener("/game/arda/assign-characters", this.onAssignCharacters.bind(this));
        this.getMeccgApi().addListener("/game/arda/view", this.onViewCards.bind(this));
        this.getMeccgApi().addListener("/game/arda/shuffle", this.onShuffle.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/start", this.onTradeStart.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/cancel", this.onTradeCancel.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/remove", this.onTradeRemove.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/offer", this.onTradeOffer.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/accept", this.onTradeAccept.bind(this));
        this.getMeccgApi().addListener("/game/arda/trade/perform", this.onTradePerform.bind(this));
    }
}

module.exports = GameArda;