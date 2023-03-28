const TurnTimer = require("./TurnTimer");

const GamePlayers = require("./GamePlayers");
const SaveGameEvaluation = require("./SaveGameEvaluation");

class GameStandard extends GamePlayers
{
    constructor(_MeccgApi, _Chat, _playboardManager)
    {
        super(_MeccgApi, _Chat, _playboardManager)

        this._fnEndGame = null;
        this._timeTimer = new TurnTimer();
    }

    setCallbackOnRestoreError(fn)
    {
        if (fn !== undefined && typeof fn === "function")
            this._fnEndGame = fn;
    }

    init()
    {
        super.init();

        this.getMeccgApi().addListener("/game/card/state/set", this.onGameCardStateSet.bind(this)); 
        this.getMeccgApi().addListener("/game/card/state/glow", this.onGameStateGlow.bind(this));
        this.getMeccgApi().addListener("/game/card/state/reveal", this.onGameCardStateReveal.bind(this));
        this.getMeccgApi().addListener("/game/card/draw", this.onCardDraw.bind(this));
        this.getMeccgApi().addListener("/game/card/draw/single", this.onCardDrawSingle.bind(this));

        this.getMeccgApi().addListener("/game/card/store", this.onCardStore.bind(this));
        this.getMeccgApi().addListener("/game/card/move", this.onCardMove.bind(this));
        this.getMeccgApi().addListener("/game/card/discard", this.onCardDiscard.bind(this));
        this.getMeccgApi().addListener("/game/card/hand", this.onCardInHand.bind(this));
        this.getMeccgApi().addListener("/game/card/token", this.onCardToken.bind(this));
        this.getMeccgApi().addListener("/game/card/add", this.onGameAddCardsToGame.bind(this)); /* add a list of cards to the sideboard */
        this.getMeccgApi().addListener("/game/card/import", this.onCardImport.bind(this));
        
        this.getMeccgApi().addListener("/game/stagingarea/add/card", this.onStagingAreaAddCard.bind(this));

        this.getMeccgApi().addListener("/game/save", this.globalSaveGame.bind(this));
        this.getMeccgApi().addListener("/game/restore", this.globalRestoreGame.bind(this));
        
        this.getMeccgApi().addListener("/game/dices/roll", this.rollDices.bind(this));
        this.getMeccgApi().addListener("/game/dices/set", this.setDices.bind(this));

        this.getMeccgApi().addListener("/game/phase/set", this.phase.bind(this)); /* Set the current phase of the game turn */
        
        this.getMeccgApi().addListener("/game/view-cards/reveal-pile", this.viewReveal.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/list", this.viewList.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/list/close", this.viewCloseList.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/shuffle", this.viewShuffle.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/offer-reveal", this.viewOfferReveal.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/offer-remove", this.viewOfferRemove.bind(this));
        

        this.getMeccgApi().addListener("/game/company/create", this.onGameCompanyCreate.bind(this));
        this.getMeccgApi().addListener("/game/company/arrive", this.onGameCompanyArrives.bind(this));
        this.getMeccgApi().addListener("/game/company/returntoorigin", this.onGameCompanyReturnsToOrigin.bind(this));
        this.getMeccgApi().addListener("/game/company/highlight", this.onGameCompanyHighlight.bind(this));
        this.getMeccgApi().addListener("/game/company/markcurrently", this.onGameCompanyMarkAsCurrent.bind(this));
        this.getMeccgApi().addListener("/game/company/location/set-location", this.onGameCompanyLocationSetLocation.bind(this));
        this.getMeccgApi().addListener("/game/company/location/reveal", this.onGameCompanyLocationReveal.bind(this));
        this.getMeccgApi().addListener("/game/company/location/attach", this.onGameCompanyLocationAttach.bind(this));

        this.getMeccgApi().addListener("/game/score/show", this.scoreShow.bind(this));
        this.getMeccgApi().addListener("/game/score/update", this.scoreUpdate.bind(this));
        this.getMeccgApi().addListener("/game/score/add", this.scoreAdd.bind(this));

        this.getMeccgApi().addListener("/game/draw/company", this.onGameDrawCompany.bind(this)); /* draw a single company by its id */
        this.getMeccgApi().addListener("/game/draw/companies", this.onGameDrawCompanies.bind(this));

        this.getMeccgApi().addListener("/game/character/host-card", this.onCharacterHostCard.bind(this));
        this.getMeccgApi().addListener("/game/character/receive-card", this.onCharacterReceiveCard.bind(this));
        this.getMeccgApi().addListener("/game/character/join/character", this.onCharacterJoinCharacter.bind(this));
        this.getMeccgApi().addListener("/game/character/join/company", this.onCharacterJoinCompany.bind(this));

        this.getMeccgApi().addListener("/game/discardopenly", this.onDiscardOpenly.bind(this));

        this.getMeccgApi().addListener("/game/watch/hand", this.onWatchUpdateHand.bind(this));
        this.getMeccgApi().addListener("/game/watch/victory", this.onWatchUpdateVictory.bind(this));
        
    }

    /**
     * Send a new card to the FRONTEND GUI hand list
     * @param {String} player
     * @param {String} uuid
     * @param {String} code
     * @param {String} type
     * @param {Integer} count
     */
    drawCard(playerid, uuid, code, type, count)
    {
        this.getMeccgApi().publish("/game/card/draw", playerid, {code: code, uuid: uuid, count: count, type: type, owner: "", playerid: playerid});
    }

    updateHandCountersPlayerAll()
    {
        for (let id of this.getPlayerIds())
            this.updateHandCounterPlayerOnly(id);
    }

    updateHandCounterPlayerOnly(player)
    {
        const size = this.getPlayboardManager().Size(player);
        if (size === null)
            return;
            
        const nScore = this.getPlayerScore(player);
        this.publishToPlayers("/game/update-deck-counter/player/generics", player, {
            playdeck: size.playdeck,
            sideboard: size.sideboard,
            discard: size.discard,
            hand: size.hand,
            victory: nScore,
            player: player
        });
    }

    updateHandCountersPlayer(player)
    {
        if (typeof player === "undefined")
            player = this.getCurrentPlayerId();

        this.updateHandCounterPlayerOnly(player);
        this.updateHandCounterOnlyPlayer(player);
    }

    updateHandCounterOnlyPlayer(player)
    {
        let size = this.getPlayboardManager().Size(player);
        if (size === null)
            return;

        const nScore = this.getPlayerScore(player);
        this.publishToPlayers("/game/update-deck-counter/player/hand", player, {
            hand: size.hand, 
            playdeck: size.playdeck,
            score : nScore,
            player: player
        });
    }

    removeEmptyCompanies()
    {
        const keys = this.getPlayboardManager().removeEmptyCompanies();
        if (keys.length === 0)
            return false;

        this.publishToPlayers("/game/remove-empty-companies", "", keys);
        this.updateHandCountersPlayerAll();
        return true;
    }

    createEmptyBoardData()
    {
        const _data = this.getPlayboardManager().GetData();
        return {
            player: {
                companies: [],
                stage_hazards: [],
                stage_resources: []
            },
            opponent: {
                companies: [],
                stage_hazards: [],
                stage_resources: []
            },

            data : _data
        };
    }

    getCurrentBoardCompanies(_dataTarget, _playerId)
    {
        for (let _elem of this.getPlayboardManager().GetCompanyIds(_playerId))
        {
            const _temp = this.getPlayboardManager().GetFullCompanyByCompanyId(_elem);
            if (_temp !== null)
                _dataTarget.companies.push(_temp);
        }
    }

    getCurrentBoardStaging(_dataTarget, _playerId, bResources)
    {
        for (let _elem of this.getPlayboardManager().GetStagingCards(_playerId, bResources))
        {
            let card = this.getPlayboardManager().GetCardByUuid(_elem);
            if (card !== null)
            {
                _dataTarget.push({uuid: card.uuid, 
                    target: "", 
                    code: card.code, 
                    type: card.type.toLowerCase(), 
                    state: card.state, 
                    revealed: card.revealed, 
                    owner: card.owner, 
                    token: card.token === undefined ? 0 : card.token,
                    secondary : card.secondary
                });
            }
        }
    }

    getCurrentBoard(id)
    {
        const data = this.createEmptyBoardData();

        let _dataTarget;
        for (let _playerId of this.getPlayerIds())
        {
            _dataTarget = _playerId === id ? data.player : data.opponent;
            this.getCurrentBoardCompanies(_dataTarget, _playerId);
            this.getCurrentBoardStaging(_dataTarget.stage_resources, _playerId, true);
            this.getCurrentBoardStaging(_dataTarget.stage_hazards, _playerId, false);
            this.updateHandCountersPlayer(_playerId);
        }

        this.sendCurrentPhase();
        return data;
    }


    sendCurrentPhase()
    {
        super.sendPlayerList();

        const userid = this.getCurrentPlayerId();
        const data = {
            phase: this.getPhase(),
            currentplayer: userid,
            players: this.getPlayerIds()
        };

        this.publishToPlayers("/game/set-phase", userid, data);
    }

    startPoolPhaseByPlayer(id)
    {
        const _list = this.getPlayboardManager().GetCardsInHand(id);
        for (let card of _list)
            this.drawCard(id, card.uuid, card.code, card.type, 1);

        this.updateHandCountersPlayer(id);
    }

    sendCurrentHandSize()
    {
        const userid = this.getCurrentPlayerId();
        const size = this.getPlayboardManager().Size(userid);
        if (size !== null)
            this.publishChat(userid, " holds " + size.hand + " card(s)", false);
    }

    startPoolPhase()
    {
        for (let id of this.getPlayerIds())
            this.startPoolPhaseByPlayer(id);

        this.sendCurrentPhase();
    }

    onStagingAreaAddCard(userid, _socket, data)
    {
        let _uuid = data.uuid;

        if (!this.getPlayboardManager().MoveCardToStagingArea(_uuid, userid, userid))
        {
            this.publishChat(userid, "Cannot move card to staging area", false);
            return false;
        }

        let card = this.getPlayboardManager().GetCardByUuid(_uuid);
        card.turn = this.getCurrentTurn();

        this.publishToPlayers("/game/remove-card-from-hand", "", _uuid);
        this.publishToPlayers("/game/add-to-staging-area", userid, {
            uuid: _uuid, 
            target: "", 
            code: card.code, 
            type: card.type, 
            state: card.state, 
            revealed: card.revealed, 
            owner: card.owner, 
            turn: card.turn,
            secondary : card.secondary
        });
        this.updateHandCountersPlayer(userid);
        this.publishChat(userid, "added " + card.code + " to staging area", true);
    }

    onGameCardStateReveal(userid, _socket, data)
    {
        const uuid = data.uuid;
        const rev = this.getPlayboardManager().FlipCard(uuid);

        this.publishToPlayers("/game/card/reveal", userid, {uuid: uuid, reveal: rev});

        if (rev)
            this.publishChat(userid, " reveals " + data.code, true);
        else
            this.publishChat(userid, " hides a card", true);
    }

    onGameCardStateSet(userid, _socket, data)
    {
        if (data.uuid === "_site")
        {
            data.tapped = data.state === 90;
            data.ownerId = userid;

            this.getPlayboardManager().SetSiteState(userid, data.code, data.state);
            this.publishToPlayers("/game/card/state/set-site", userid, data);
        }
        else
        {
            this.getPlayboardManager().SetCardState(data.uuid, data.state);
            this.publishToPlayers("/game/card/state/set", userid, data);
        }

        const nState = data.state;
        let message = "turns ";
        if (nState === 0)
            message = "untaps ";
        else if (nState === 90)
            message = "taps ";
        else if (nState === 91)
            message = "fixed ";
        else if (nState === 180)
            message = "wounds ";

        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card !== null && card.revealed === true)
            this.publishChat(userid, message + data.code, true);
        else 
            this.publishChat(userid, message + "a card", true);
    }

    onGameStateGlow(userid, _socket, data)
    {
        this.publishToPlayers("/game/card/state/glow", userid, data);
        this.publishChat(userid, "marks/unmarks " + data.code, false);
    }

    onCardDraw(userid, _socket, _obj)
    {
        let _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            this.drawCard(userid, card.uuid, card.code, card.type, 1);

        this.updateHandCountersPlayer(userid);

        if (_list.length === 1)
            this.publishChat(userid, "drew 1 card", false);
        else if (_list.length > 1)
            this.publishChat(userid, "drew " + _list.length + " cards", false);
    }

    drawCardsFromPlaydeck(userid, nCards)
    {
        if (userid === "" || userid === undefined || nCards === undefined || nCards < 1)
            return;
            
        for (let i = 0; i < nCards; i++)
        {
            const _card = this.getPlayboardManager().DrawCard(userid, false);
            if (_card !== null)
                this.drawCard(userid, _card.uuid, _card.code, _card.type, 1);
        }

        this.updateHandCountersPlayer(userid);
        this.publishChat(userid, "drew " + nCards + " card(s)", false);
    }

    onCardDrawSingle(userid, _socket, _obj)
    {
        let _card = this.getPlayboardManager().DrawCard(userid, false);
        if (_card === null)
            return;

        this.updateHandCountersPlayer(userid);
        this.drawCard(userid, _card.uuid, _card.code, _card.type, 1);
        this.publishChat(userid, "drew 1 card", false);
    }

    onGetTopCardFromHand(userid, _socket, nCount)
    {
        if (nCount < 1)
            return;

        const _cards = this.getPlayboardManager().GetTopCards(userid, nCount);
        for (let _card of _cards)
        {
            this.drawCard(userid, _card.uuid, _card.code, _card.type, nCount);
            this.publishChat(userid, "drew 1 card", false);
        }

        this.updateHandCountersPlayer(userid);
    }

    onCardStore(userid, _socket, obj)
    {
        let card = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        this.getPlayboardManager().UpdateOwnership(userid, card);

        let nStored = 0, nDiscarded = 0;
        let list = [];
        let affectedCompanyUuid = "";
        if (card.type === "character")
        {
            let _remove = [];
            
            affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(obj.uuid);

            list = this.getPlayboardManager().PopCharacterAndItsCards(obj.uuid);

            for (let _uuid of list)
            {
                if (_uuid === obj.uuid)
                {
                    if (this.getPlayboardManager().AddToPile(_uuid, card.owner, "victory"))
                    {
                        nStored++;
                        _remove.push(_uuid);
                    }
                } 
                else if (this.getPlayboardManager().AddToPile(_uuid, card.owner, "discard"))
                {
                    nDiscarded++;
                    _remove.push(_uuid);
                }
            }

            list = _remove;
        }

        if (list.length === 0 || card.type !== "character" )
        {
            if (this.getPlayboardManager().MoveCardTo(obj.uuid, card.owner, "victory"))
            {
                nStored++;
                list = [obj.uuid];
            }
        } 

        if (nStored !== 0)
        {
            this.publishToPlayers("/game/card/remove", userid, list);
            this.updateHandCountersPlayerAll();

            this.publishChat(userid, "Stores " + card.code, true);
            if (nDiscarded > 0)
                this.publishChat(userid, "... and discarded " + nDiscarded + " card(s)", true);

            this.publishToPlayers("/game/event/score", userid, {owner: card.owner, code: card.code });
        } 
        else
            this.publishChat(userid, "Could not store " + card.code, false);

        /** update the company */
        this.onRedrawCompany(userid,affectedCompanyUuid);
    }

    identifyCardOwnerWhenMoving(userid, cardOwner, target)
    {
        if (target === "victory" || target === "hand")
            return userid;
        else
            return cardOwner;
    }

    onCardMoveDoMove(userid, obj, card)
    {
        let result = {
            codes: [],
            uuids : [],
            countMoved : 0,
            affectedCompanyUuid : "",
            isEmpty : true
        };

        if (card.type !== "character" || obj.source !== "inplay")
        {
            /**
             * the victory pile is different: usually, the target of your deck pils is always the card owner,
             * yet the victory condition allows to take ownership of cards
             */
            const _targetPlayer = this.identifyCardOwnerWhenMoving(userid, card.owner, obj.target);
            if (this.getPlayboardManager().MoveCardTo(obj.uuid, _targetPlayer, obj.target))
                result.uuids.push(obj.uuid);
        } 
        else
        {
            result.affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(obj.uuid);
            result.uuids = this.getPlayboardManager().MoveCardCharacterTo(obj.uuid, card.owner, obj.target);
        }

        for (let _uid of result.uuids)
        {
            const _card = this.getPlayboardManager().GetCardByUuid(_uid);
            if (_card !== null)
                result.codes.push({code: _card.code, owner: _card.owner, uuid: _uid});
        }

        result.countMoved = result.uuids.length;
        result.isEmpty = result.countMoved === 0;

        return result;
    }


    refreshAllHandsOfAllPlayers(userid, socket)
    {
        let res = [];
        const _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: ""} );

        if (res.length > 0)
            this.replyToPlayer("/game/card/hand", socket, { cards: res });
    }

    onCardMove(userid, socket, obj)
    {
        const bShufflePlaydeck = obj.shuffle !== undefined && obj.shuffle === true && "playdeck" === obj.target;
        
        const card = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        const result = this.onCardMoveDoMove(userid, obj, card);

        if (!result.isEmpty)
        {
            if (obj.drawTop)
                this.refreshAllHandsOfAllPlayers(userid, socket);
        
            this.updateHandCountersPlayer(userid);
            this.publishToPlayers("/game/event/cardmoved", userid, {list: result.codes, target: obj.target, source: obj.source});
        }

        if (bShufflePlaydeck)
        {
            this.getPlayboardManager().ShufflePlaydeck(userid);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }

        /* now we have to remove the cards from the board */
        this.publishToPlayers("/game/card/remove", userid, result.uuids);

        if (bShufflePlaydeck)
            this.publishChat(userid, "Shuffled " + result.countMoved + " card(s) into playdeck", true);
        else
            this.publishChat(userid, "Moved " + result.countMoved + " card(s) to top of " + obj.target, true);

        this.onRedrawCompany(userid, result.affectedCompanyUuid);

        if (obj.target === "outofplay")
            this.publishToPlayers("/game/event/outofplay", userid, {code: card.code });
        else if (obj.target  === "discardpile")
            this.replyToPlayer("/game/event/discard", socket, {code: card.code, owner: card.owner});
    }

    onCardToken(userid, _socket, data)
    {
        const nCount = data.uuid !== undefined ? this.getPlayboardManager().getDecks().updateToken(data.uuid, data.add !== false) : 0;
        if (nCount != -1)
        {
            this.publishToPlayers("/game/card/token", userid, {uuid: data.uuid, count: nCount });
            this.publishChat(userid, "updates token of " + data.code + " to " + nCount, true);
        }
    }

    onWatchUpdateHand(_userid, socket)
    {
        let res = [];
        for (let id of this.getPlayerIds())
        {
            for (let card of this.getPlayboardManager().GetCardsInHand(id))
                res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: id} );
                
            for (let card of this.getPlayboardManager().GetCardsInHandMarshallingPoints(id))
                res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: id} );
        }

        this.replyToPlayer("/game/watch/hand", socket, { cards: res });
    }

    onWatchUpdateVictory(_userid, socket)
    {
        this.replyToPlayer("/game/score/watch", socket, this.getScoring().getScoreSheets());
    }

    onCardInHand(userid, socket)
    {
        let res = [];
        const _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: ""} );

        this.replyToPlayer("/game/card/hand", socket, { cards: res });
    }

    onCardDiscard(userid, _socket, data)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card === null)
            return false;

        const affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(data.uuid);
        if (!this.getPlayboardManager().MoveCardTo(data.uuid, card.owner, "discardpile"))
            return false;

        this.updateHandCountersPlayer(card.owner);
        this.publishChat(userid, "Discarded 1 card.", true);
        this.onRedrawCompany(userid, affectedCompanyUuid);
        return true;
    }

    scoreShow(userid, socket, _data)
    {
        this.replyToPlayer("/game/score/show", socket, this.getScoring().getScoreSheets());
        this.replyToPlayer("/game/score/show-pile", socket, this._getList(userid, "victory"));
        this.publishChat(userid, " looks at score sheet", false);
    }

    scoreUpdate(userid, _socket, data)
    {
        const total = this.getScoring().updateScore(userid, data);
        if (total !== -1)
            this.publishChat(userid, " updates score to a total of " + total + " point(s)", true);
    }

    scoreAdd(userid, _socket, data)
    {
        const total = this.getScoring().update(userid, data.type, data.points);
        if (total !== -1)
        {
            this.publishChat(userid, " updated " + data.type + " score by " + data.points + " point(s) to a total of " + total + " MPs.", true);
            this.publishToPlayers("/game/sfx", userid, { "type": "score" });
        }
    }

    onGameDrawCompany(userid, _socket, data)
    {
        const pCompany = this.getPlayboardManager().GetFullCompanyByCompanyId(data);
        if (pCompany !== null)
        {
            this.publishToPlayers("/game/player/draw/company", userid, pCompany);
            this.removeEmptyCompanies();
        }
    }

    onGameDrawCompanies(userid, _socket, _data)
    {
        for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
            this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(_company));
    }

    onCharacterHostCard(userid, _socket, obj)
    {
        const uuid = obj.uuid;
        const company = obj.companyId;
        const character = obj.characterUuid;
        const bFromHand = obj.fromHand;

        if (!this.getPlayboardManager().CharacterHostCard(company, character, uuid, bFromHand, userid))
        {
            console.info("character cannot host card.");
            return false;
        }

        const card = this.getPlayboardManager().GetCardByUuid(uuid);

        this.publishToPlayers("/game/remove-card-from-hand", "", uuid);
        this.publishToPlayers("/game/remove-card-from-board", "", uuid);
        this.updateHandCountersPlayer(userid);

        {
            const cardChar = this.getPlayboardManager().GetCardByUuid(character);
            if (cardChar === null || cardChar.revealed === false)
                this.publishChat(userid, " character hosts a card", true);
            else
                this.publishChat(userid, cardChar.code + " hosts " + card.code, true);
        }

        return true;
    }

    onCharacterReceiveCard(_userid, _socket, _obj)
    {
        return false;
    }

    onCharacterJoinCharacter(userid, _socket, data)
    {
        const cardUuid = data.uuid;
        const targetcharacter = data.targetcharacter;
        const targetCompany = data.companyId;
        const isFromHand = data.fromHand;

        if (isFromHand)
        {
            if (this.getPlayboardManager().removeCardFromDeckOrCompany(userid, cardUuid))
                this.updateHandCounterOnlyPlayer(userid);
        }

        const sWho = this.getCardCode(cardUuid, "Character") + " ";
        if (!this.getPlayboardManager().JoinCharacter(cardUuid, targetcharacter, targetCompany, userid))
        {
            this.publishChat(userid, sWho + "cannot join under direct influence", false)
        }
        else
        {
            this.removeEmptyCompanies();
            if (isFromHand)
            {
                const _code = this.getCharacterCode(targetcharacter, "");
                if (_code !== "")
                    this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
            }

            let sChar = this.getCharacterCode(targetcharacter, "a character");
            this.publishChat(userid, sWho + "joined " + sChar + " under direct influence", true);
        }
    }

    onCharacterJoinCompany(userid, _socket, data)
    {
        const _uuid = data.uuid;
        const _source = data.source;
        const _companyId = data.companyId;

        if (_uuid === "" || _source === "" || _companyId === "")
            return;

        if (!this.getPlayboardManager().JoinCompany(_uuid, _source, _companyId, userid))
        {
            console.info("Character " + _uuid + " cannot join the company " + _companyId);
            return;
        }

        if (_source === "hand")
        {
            this.updateHandCounterOnlyPlayer(userid);
            this.publishToPlayers("/game/remove-card-from-hand", userid, _uuid);
            const _code = this.getCardCode(_uuid, "");
            if (_code !== "")
                this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
        }

        this.removeEmptyCompanies();

        {
            let sWho = this.getCardCode(_uuid, "Character") + " joined";
            const sCompanyCharacter = this.getFirstCompanyCharacterCode(_companyId, "");
            if (sCompanyCharacter === "")
                sWho += " a company";
            else
                sWho += " the company of " + sCompanyCharacter;

            this.publishChat(userid, sWho, true);
        }
    }

    onGameCompanyCreate(userid, _socket, data)
    {
        const _uuid = data.uuid;
        const _source = data.source;

        if (_uuid === "" || _source === "")
            return false;

        const _id = this.getPlayboardManager().CreateNewCompany(_uuid, _source, userid);
        if (_id === "")
            return false;

        if (_source === "hand")
        {
            this.updateHandCounterOnlyPlayer(userid);
            this.publishToPlayers("/game/remove-card-from-hand", userid, _uuid);

            const _code = this.getCardCode(_uuid, "");
            if (_code !== "")
                this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
        }

        // draw the company
        this.onRedrawCompany(userid, _id);
        this.removeEmptyCompanies();

        const card = this.getPlayboardManager().GetCardByUuid(_uuid);
        if (card !== null && card.revealed !== false)
        {
            let sCode = this.getCardCode(_uuid, "");
            if (sCode !== "")
                this.publishChat(userid, sCode + " created a new company", true);
            else
                this.publishChat(userid, "New company created", true);
        }
        else
            this.publishChat(userid, "A character created a new company", true);

        return true;
    }

    onRedrawCompany(userid, companyId)
    {
        if (userid !== undefined && userid !== "" && companyId !== undefined && companyId !== "")
            this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(companyId));
    }

    onGameCompanyMarkAsCurrent(userid, _socket, jData)
    {
        if (typeof jData.uuid === "string")
            this.publishToPlayers("/game/company/markcurrently", userid, {uuid: jData.uuid});
    }

    onGameCompanyHighlight(userid, _socket, jData)
    {
        if (typeof jData.company === "undefined")
            return;

        let company = jData.company;
        if (company !== "")
        {
            this.publishToPlayers("/game/company/highlight", userid, {company: company});

            let sCompanyCharacter = this.getFirstCompanyCharacterCode(company, "");
            if (sCompanyCharacter !== "")
                this.publishChat(userid, "marks company of " + sCompanyCharacter, false);
        }
    }

    onGameCompanyArrives(userid, _socket, jData)
    {
        if (typeof jData.company === "undefined" || jData.company === "")
            return;

        this.getPlayboardManager().CompanyArrivedAtDestination(jData.company);
        this.publishToPlayers("/game/company/arrive", userid, {company: jData.company});

        let sCompanyCharacter = this.getFirstCompanyCharacterCode(jData.company, "");
        if (sCompanyCharacter !== "")
            this.publishChat(userid, "The company of " + sCompanyCharacter + " arrives", true);
        else
            this.publishChat(userid, "The company arrives", true);
    }

    onGameCompanyReturnsToOrigin(userid, _socket, jData)
    {
        if (typeof jData.company === "undefined" || jData.company === "")
            return;

        this.getPlayboardManager().CompanyReturnsToOrigin(jData.company);
        this.publishToPlayers("/game/company/returntoorigin", userid, {company: jData.company});

        let sCompanyCharacter = this.getFirstCompanyCharacterCode(jData.company, "");
        if (sCompanyCharacter !== "")
            this.publishChat(userid, "The company of " + sCompanyCharacter + " returns to site of origin", true);
        else
            this.publishChat(userid, "The company returns to site of origin", true);
    }

    onGameCompanyLocationSetLocation(userid, _socket, obj)
    {
        this.getPlayboardManager().SetCompanyStartSite(obj.companyUuid, obj.start, obj.regions, obj.destination);
        let res = this.getPlayboardManager().GetCompanyAttachedLocationCards(obj.companyUuid);
        let result = {
            company: obj.companyUuid, 
            start: res.current, 
            regions: res.regions, 
            target: res.target, 
            revealStart : obj.revealStart,
            revealed: false, 
            attached: res.attached,
            current_tapped : res.current_tapped,
            target_tapped : res.target_tapped
        };
        
        this.publishToPlayers("/game/player/draw/locations", userid, result);
        this.publishChat(userid, " organises locations.", false);
    }

    onGameCompanyLocationAttach(userid, _socket, data)
    {
        const _uuid = data.uuid;
        const targetCompanyUuid = data.companyUuid;
        const revealOnDrop = data.reveal;

        const card = this.getPlayboardManager().PopCardFromHand(_uuid);
        if (card === null)
        {
            this.publishChat(userid, "Cannot add foreign card to location threats", false);
            return;
        }

        if (!this.getPlayboardManager().AddHazardToCompanySite(_uuid, targetCompanyUuid))
        {
            this.publishChat(userid, "cannot add hazard to company.", false);
            return;
        }

        card.revealed = revealOnDrop;

        this.publishToPlayers("/game/remove-card-from-hand", "", _uuid);
        this.publishToPlayers("/game/add-onguard", userid, {
            uuid: _uuid,
            company: targetCompanyUuid,
            code: card.code,
            type: card.type,
            state: card.state,
            revealed: revealOnDrop,
            owner: card.owner
        });
        
        this.updateHandCountersPlayer(userid);

        if (revealOnDrop)
            this.publishChat(userid, " attached " + card.code + " to site/region", true);
        else
            this.publishChat(userid, " played an on guard card", true);
    }

    onGameCompanyLocationReveal(userid, _socket, data)
    {
        this.getPlayboardManager().RevealCompanyDestinationSite(data.companyUuid);
        this.publishToPlayers("/game/company/location/reveal", userid, {company: data.companyUuid});
        /** todo: send target location here */
        this.publishChat(userid, " revealed locations.", true);
    }

    globalSaveGame(_userid, socket)
    {
        const data = this.save();
        if (data !== null)
            this.replyToPlayer("/game/save", socket, data);
    }

    save()
    {
        try
        {
            const data = super.save();
            data.playboard.decks.cardMap = this.base64Encode(data.playboard.decks.cardMap)
            return data;
        }
        catch(err)
        {
            console.error(err);
        }

        return null;
    }


    onDiscardOpenly(userid, _socket, data)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card !== null)
        {
            this.publishChat(userid, " discards " + card.code, true);
            this.publishToPlayers("/game/discardopenly", userid, {
                code: card.code,
                owner : card.owner,
                uuid : data.uuid
            });
        }
    }
    
    rollDices(userid, _socket, obj)
    {
        const n1 = obj.r1;
        const n2 = obj.r2;
        const nRes = n1 + n2;
        const pDices = this.getPlayerDices();
        const dice = pDices.getDice(userid);
        pDices.saveRoll(userid, nRes);

        this.publishToPlayers("/game/dices/roll", userid, {first: n1, second: n2, total: nRes, user: userid, dice: dice });
        this.publishChat(userid, " rolls " + nRes + " (" + n1 + ", " + n2 + ")", true);
    }

    setDices(userid, _socket, obj)
    {
        this.updateDices(userid, obj.type);
    }

    
    phase(userid, _socket, sPhase) 
    {
        switch (sPhase)
        {
            case "organisation":
            case "movement":
            case "site":
            case "eotdiscard":
            case "longevent":
            case "eot":
                break;

            default:
                return;
        }

        let nCurrentTurn = this.getCurrentTurn();
        let nNewTurn = nCurrentTurn;

        if (sPhase === "site")
        {
            for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
                this.getPlayboardManager().CompanyArrivedAtDestination(_company);
        } 
        else if (sPhase === "eot")
        {
            sPhase = "organisation";
            userid = this.nextPlayersTurn();
            nNewTurn = this.getCurrentTurn();

            const lTime = this._timeTimer.pollElapsedMins();

            this.publishChat(userid, " ends turn after " + lTime + "mins. Active player is " + this.getCurrentPlayerName(), true);
            this.publishGameLogNextPlayer(this.getCurrentPlayerName() + " starts their turn.");

            this.sendCurrentHandSize();
            this.publishToPlayers("/game/set-turn", userid, { turn : nNewTurn })
        }

        if (sPhase === "organisation")
        {
            for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
                this.getPlayboardManager().ReadyCompanyCards(_company);

            this.publishToPlayers("/game/player/set-current", this.getCurrentPlayerId(), {name: this.getCurrentPlayerId(), displayname: this.getCurrentPlayerName()});
        }

        this.setPhase(sPhase);
        this.sendCurrentPhase();

        if (nNewTurn !== nCurrentTurn)
            this.publishChat(this.getCurrentPlayerId(), " starts turn no. " + nNewTurn, true);
        else
            this.publishChat(this.getCurrentPlayerId(), " is now in " + sPhase + " phase", true);
    }

    onCardImport(userid, _socket, data)
    {
        if (this.importCardDuringGame(userid, data.code, data.type === "character"))
            this.onGetTopCardFromHand(userid, null, 1);
    }

    onGameAddCardsToGame(userid, _socket, data)
    {
        let count = this.addCardsToGameDuringGame(userid, data.cards);
        if (count < 1)
        {
            this.publishChat(userid, "could not add new cards to sideboard", false);
            return;
        }

        if (count === 1)
            this.publishChat(userid, "just added 1 card to their sideboard", true);
        else
            this.publishChat(userid, "just added " + count + " cards to their sideboard", true);

        this.updateHandCountersPlayer(userid);

    }

    viewReveal(userid, _socket, obj)
    {
        this.publishToPlayers("/game/view-cards/reveal/list", userid, {type: obj, list: this._getList(userid, obj) });
        this.publishChat(userid, " offers to show cards in " + obj, false);
    }

    viewList(userid, _socket, obj)
    {
        const list = this._getList(userid, obj);
        this.publishToPlayers("/game/view-cards/list", userid, {type: obj, list: list});
        this.publishChat(userid, " views cards in " + obj, false);
    }

    viewCloseList(userid, _socket, obj)
    {
        if (typeof obj.offered === "undefined")
            return;

        if (!obj.offered)
        {
            this.publishChat(userid, " closes card offering", false);
            this.publishToPlayers("/game/view-cards/list/close", userid, { });
        }
        else
            this.publishChat(userid, " closes card offer", false);
    }

    viewShuffle(userid, _socket, obj)
    {
        if (obj.target === "playdeck")
        {
            this.getPlayboardManager().ShufflePlaydeck(userid);
            this.publishChat(userid, " shuffles playdeck", false);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }
        else if (obj.target === "discardpile")
        {
            this.getPlayboardManager().ShuffleDiscardpile(userid);
            this.publishChat(userid, " shuffles discardpile", false);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }
    }
    
    viewOfferReveal(userid, _socket, obj)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
        {
            this.publishChat(userid, " shows a card", false);
            this.publishToPlayers("/game/view-cards/reveal/reveal", userid, {uuid: sUuid});
        }
    }
    
    drawSingleCard(userid)
    {
        /** this is the callback, so we better wrap this method call to stay independent */
        this.onCardDrawSingle(userid);
    }

    viewOfferRemove(userid, _socket, obj)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
            this.publishToPlayers("/game/view-cards/reveal/remove", userid, {uuid: sUuid});
    }

    saveGameCheckPlayers(assignments)
    {
        if (this.players.ids.length !== Object.keys(assignments).length)
        {
            console.warn("Player count missmatch");
            return false;
        }
        
        let success = true;

        /** check that the player ids to be used are really in this game */
        for (let id of Object.keys(assignments))
        {
            if (!this.players.ids.includes(assignments[id]) || assignments[id] === "")
            {
                console.warn("Expected player id is not part of this room: " + assignments[id]);
                success = false;
            }
        }

        return success;
    }

    base64Encode(data)
    {
        const bufferObj = Buffer.from(JSON.stringify(data), "utf8");
        return bufferObj.toString("base64");
    }

    base64Decode(base64string)
    {
        try
        {
            let bufferObj = Buffer.from(base64string, "base64");
            return JSON.parse(bufferObj.toString("utf8"));
        }
        catch(err)
        {
            console.error(err);
        }
        
        return { };
    }

    restoreEncodedSavegame(data, userid)
    {
        try
        {
            if (typeof data.game.playboard.decks.cardMap === "string")
                data.game.playboard.decks.cardMap = this.base64Decode(data.game.playboard.decks.cardMap);
                
            return true;
        }
        catch(err)
        {
            console.error(err);
        }

        this.publishChat(userid, " savegame is invalid. Could not decode saved game.", false);
        return false;
    }

    evaluateSavedGame(data, userid)
    {
        const pEval = new SaveGameEvaluation(data.assignments);
        data.game = pEval.evaluate(data.game, this.isArda());
        if (data.game !== null)
            return true;

        this.publishChat(userid, " savegame is invalid. " + pEval.getMessageString(), false);
        return false;
    }


    globalRestoreGame(userid, _socket, data)
    {
        if (!this.restoreEncodedSavegame(data, userid) || !this.evaluateSavedGame(data, userid))
            return;

        let assignments = data.assignments; 
        if (!this.saveGameCheckPlayers(assignments))
            return;

        try
        {
            let playboard = data.game.playboard;
            let _map = playboard.decks.cardMap;
            for (let _cardId of Object.keys(_map))
            {
                const _formerOwner = _map[_cardId].owner;
                if (assignments[_formerOwner] === undefined)
                    throw new Error("Cannot find former owner " + _formerOwner + " of card " + _cardId + ". Cannot restore game.");
                else
                    _map[_cardId].owner = assignments[_formerOwner];
            }

            let error = false;
            let keys = Object.keys(playboard.decks.siteMap);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.warn("Cannot find owner " + key + " in siteMap");
                    error = true;
                }
                else
                {
                    playboard.decks.siteMap[newkey] = playboard.decks.siteMap[key];

                    /** 
                     * It might be, that the OLD and NEW ids are identical (immediate restoring)
                     * This would cause the player to be removed from the game; therefore
                     * make sure we do not remove a valid sitemap.
                     */
                    if (newkey !== key)
                        delete playboard.decks.siteMap[key];
                }
            });

            keys = Object.keys(playboard.decks.deck);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.warn("Cannot find owner " + key + " in deck");
                    error = true;
                }
                else
                {
                    playboard.decks.deck[newkey] = playboard.decks.deck[key];
                    if (newkey !== key)
                        delete playboard.decks.deck[key];
                }
            });

            keys = Object.keys(playboard.stagingarea);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.warn("Cannot find owner " + key + " in stagingarea");
                    error = true;
                }
                else
                {
                    playboard.stagingarea[newkey] = playboard.stagingarea[key];
                    if (newkey !== key)
                        delete playboard.stagingarea[key];    
                }
            });

            keys = Object.keys(data.game.scoring);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.warn("Cannot find owner " + key + " in scoring");
                    error = true;
                }
                else
                {
                    data.game.scoring[newkey] = data.game.scoring[key];
                    if (newkey !== key)
                        delete data.game.scoring[key];
                }
            });

            keys = Object.keys(playboard.companies);
            keys.forEach((key) => 
            {
                let newkey = assignments[playboard.companies[key].playerId];
                if (newkey === undefined)
                {
                    console.warn("Cannot find owner " + key + " in companies");
                    error = true;
                }
                else
                    playboard.companies[key].playerId = newkey;
            });

            if (error)
                throw new Error("Could not update ownership");
            else if (!this.restore(playboard, data.game.scoring, data.game.meta))
                throw new Error("Cannot restore game playboard");
            
            super.globalRestoreGame(userid, _socket, data);
            
            this.restorePlayerPhase(data.game.meta.phase, 
                                    data.game.meta.players.turn, 
                                    data.game.meta.players.current)
            this.publishToPlayers("/game/restore", userid, { success : true });
        }
        catch (err)
        {
            console.error(err);

            if (this._fnEndGame !== null)
                this._fnEndGame();
        }
    }

}

module.exports = GameStandard;
