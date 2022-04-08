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
        this.getMeccgApi().addListener("/game/company/highlight", this.onGameCompanyHighlight.bind(this));
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
        this.getMeccgApi().publish("/game/card/draw", playerid, {code: code, uuid: uuid, count: count, type: type, owner: ""});
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

        var userid = this.getCurrentPlayerId();
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
            this.publishChat(userid, " holds " + size.hand + " card(s)");
    }

    startPoolPhase()
    {
        for (let id of this.getPlayerIds())
            this.startPoolPhaseByPlayer(id);

        this.sendCurrentPhase();
    }

    onStagingAreaAddCard(userid, socket, data)
    {
        let _uuid = data.uuid;

        if (!this.getPlayboardManager().MoveCardToStagingArea(_uuid, userid, userid))
        {
            this.publishChat(userid, "Cannot move card to staging area");
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
        this.publishChat(userid, "added " + card.code + " to staging area");
    }

    onGameCardStateReveal(userid, socket, data)
    {
        const uuid = data.uuid;
        const rev = this.getPlayboardManager().FlipCard(uuid);

        this.publishToPlayers("/game/card/reveal", userid, {uuid: uuid, reveal: rev});

        if (rev)
            this.publishChat(userid, " reveals " + data.code);
        else
            this.publishChat(userid, " hides a card");
    }

    onGameCardStateSet(userid, socket, data)
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

        this.publishChat(userid, message + data.code);
    }

    onGameStateGlow(userid, socket, data)
    {
        this.publishToPlayers("/game/card/state/glow", userid, data);
        this.publishChat(userid, "marks/unmarks " + data.code);
    }

    onCardDraw(userid, socket, obj)
    {
        let _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            this.drawCard(userid, card.uuid, card.code, card.type, 1);

        this.updateHandCountersPlayer(userid);

        if (_list.length === 1)
            this.publishChat(userid, "drew 1 card");
        else if (_list.length > 1)
            this.publishChat(userid, "drew " + _list.length + " cards");
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
        this.publishChat(userid, "drew " + nCards + " card(s)");
    }

    onCardDrawSingle(userid, socket, obj)
    {
        let _card = this.getPlayboardManager().DrawCard(userid, false);
        if (_card === null)
            return;

        this.updateHandCountersPlayer(userid);
        this.drawCard(userid, _card.uuid, _card.code, _card.type, 1);
        this.publishChat(userid, "drew 1 card");
    }

    onGetTopCardFromHand(userid, socket, nCount)
    {
        if (nCount < 1)
            return;

        const _cards = this.getPlayboardManager().GetTopCards(userid, nCount);
        for (let _card of _cards)
        {
            this.drawCard(userid, _card.uuid, _card.code, _card.type, nCount);
            this.publishChat(userid, "drew 1 card");
        }

        this.updateHandCountersPlayer(userid);
    }

    onCardStore(userid, socket, obj)
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

            this.publishChat(userid, "Stores " + card.code);
            if (nDiscarded > 0)
                this.publishChat(userid, "... and discarded " + nDiscarded + " card(s)");
        } 
        else
            this.publishChat(userid, "Could not store " + card.code);

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

    onCardMove(userid, socket, obj)
    {
        const drawTop = obj.drawTop;
        const bShufflePlaydeck = obj.shuffle !== undefined && obj.shuffle === true && "playdeck" === obj.target;
        const card = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        let list = [];
        let affectedCompanyUuid;
        if (card.type !== "character" || obj.source !== "inplay")
        {
            /**
             * the victory pile is different: usually, the target of your deck pils is always the card owner,
             * yet the victory condition allows to take ownership of cards
             */
            const _targetPlayer = this.identifyCardOwnerWhenMoving(userid, card.owner, obj.target);
            if (this.getPlayboardManager().MoveCardTo(obj.uuid, _targetPlayer, obj.target))
                list.push(obj.uuid);
        } 
        else
        {
            affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(obj.uuid);
            list = this.getPlayboardManager().MoveCardCharacterTo(obj.uuid, card.owner, obj.target);
        }

        if (list.length > 0)
        {
            if (drawTop)
                this.onGetTopCardFromHand(card.owner, socket, list.length);

            this.updateHandCountersPlayer(userid);

            let listCodes = [];
            for (let _uid of list)
            {
                const _card = this.getPlayboardManager().GetCardByUuid(_uid);
                if (_card !== null)
                    listCodes.push({code: _card.code, owner: _card.owner});
            }

            this.publishToPlayers("/game/event/cardmoved", userid, {list: listCodes, target: obj.target, source: obj.source});
        }

        if (bShufflePlaydeck)
            this.getPlayboardManager().ShufflePlaydeck(userid);

        // now we have to remove the cards from the board again
        this.publishToPlayers("/game/card/remove", userid, list);
        if (bShufflePlaydeck)
            this.publishChat(userid, "Shuffled " + list.length + " card(s) into playdeck");
        else
            this.publishChat(userid, "Moved " + list.length + " card(s) to top of " + obj.target);
        this.onRedrawCompany(userid, affectedCompanyUuid);
    }

    onCardToken(userid, socket, data)
    {
        const nCount = data.uuid !== undefined ? this.getPlayboardManager().getDecks().updateToken(data.uuid, data.add !== false) : 0;
        if (nCount != -1)
        {
            this.publishToPlayers("/game/card/token", userid, {uuid: data.uuid, count: nCount });
            this.publishChat(userid, "updates token of " + data.code + " to " + nCount);
        }
    }

    onCardInHand(userid, socket)
    {
        let res = [];
        const _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: ""} );

        this.replyToPlayer("/game/card/hand", socket, { cards: res });
    }

    onCardDiscard(userid, socket, data)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card === null)
            return false;

        const affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(data.uuid);
        if (!this.getPlayboardManager().MoveCardTo(data.uuid, card.owner, "discardpile"))
            return false;

        this.updateHandCountersPlayer(card.owner);
        this.publishChat(userid, "Discarded 1 card.");
        this.onRedrawCompany(userid, affectedCompanyUuid);
        return true;
    }

    scoreShow(userid, socket, data)
    {
        this.replyToPlayer("/game/score/show", socket, this.getScoring().getScoreSheets());
        this.replyToPlayer("/game/score/show-pile", socket, this._getList(userid, "victory"));
        this.publishChat(userid, " looks at score sheet");
    }

    scoreUpdate(userid, socket, data)
    {
        const total = this.getScoring().updateScore(userid, data);
        if (total !== -1)
            this.publishChat(userid, " updates score to a total of " + total + " point(s)");
    }

    scoreAdd(userid, socket, data)
    {
        const total = this.getScoring().update(userid, data.type, data.points);
        if (total !== -1)
            this.publishChat(userid, " updated " + data.type + " score by " + data.points + " point(s) to a total of " + total + " MPs.");
    }

    onGameDrawCompany(userid, socket, data)
    {
        var pCompany = this.getPlayboardManager().GetFullCompanyByCompanyId(data);
        if (pCompany !== null)
        {
            this.publishToPlayers("/game/player/draw/company", userid, pCompany);
            this.removeEmptyCompanies();
        }
    }

    onGameDrawCompanies(userid, socket, data)
    {
        for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
            this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(_company));
    }

    onCharacterHostCard(userid, socket, obj)
    {
        var uuid = obj.uuid;
        var company = obj.companyId;
        var character = obj.characterUuid;
        var bFromHand = obj.fromHand;

        if (!this.getPlayboardManager().CharacterHostCard(company, character, uuid, bFromHand, userid))
        {
            console.log("character cannot host card.");
            return false;
        }

        var card = this.getPlayboardManager().GetCardByUuid(uuid);

        this.publishToPlayers("/game/remove-card-from-hand", "", uuid);
        this.publishToPlayers("/game/remove-card-from-board", "", uuid);
        this.updateHandCountersPlayer(userid);

        {
            let cardChar = this.getPlayboardManager().GetCardByUuid(character);
            if (cardChar === null || cardChar.revealed === false)
                this.publishChat(userid, " character hosts " + card.code);
            else
                this.publishChat(userid, cardChar.code + " hosts " + card.code);
        }

        return true;
    }

    onCharacterReceiveCard(userid, socket, obj)
    {
        return false;
    }

    onCharacterJoinCharacter(userid, socket, data)
    {
        var cardUuid = data.uuid;
        var targetcharacter = data.targetcharacter;
        var targetCompany = data.companyId;
        var isFromHand = data.fromHand;

        if (isFromHand)
        {
            if (this.getPlayboardManager().removeCardFromDeckOrCompany(userid, cardUuid))
                this.updateHandCounterOnlyPlayer(userid);
        }

        const sWho = this.getCardCode(cardUuid, "Character") + " ";
        if (!this.getPlayboardManager().JoinCharacter(cardUuid, targetcharacter, targetCompany, userid))
        {
            this.publishChat(userid, sWho + "cannot join under direct influence")
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
            this.publishChat(userid, sWho + "joined " + sChar + " under direct influence");
        }
    }

    onCharacterJoinCompany(userid, socket, data)
    {
        var _uuid = data.uuid;
        var _source = data.source;
        var _companyId = data.companyId;

        if (_uuid === "" || _source === "" || _companyId === "")
            return;

        if (!this.getPlayboardManager().JoinCompany(_uuid, _source, _companyId, userid))
        {
            console.log("Character " + _uuid + " cannot join the company " + _companyId);
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
            let sCompanyCharacter = this.getFirstCompanyCharacterCode(_companyId, "");
            if (sCompanyCharacter === "")
                sWho += " a company";
            else
                sWho += " the company of " + sCompanyCharacter;

            this.publishChat(userid, sWho);
        }
    }

    onGameCompanyCreate(userid, socket, data)
    {
        var _uuid = data.uuid;
        var _source = data.source;

        if (_uuid === "" || _source === "")
            return false;

        var _id = this.getPlayboardManager().CreateNewCompany(_uuid, _source, userid);
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

        {
            let sCode = this.getCardCode(_uuid, "");
            if (sCode !== "")
                this.publishChat(userid, sCode + " created a new company");
            else
                this.publishChat(userid, "New company created");
        }

        return true;
    }

    onRedrawCompany(userid, companyId)
    {
        if (userid !== undefined && userid !== "" && companyId !== undefined && companyId !== "")
            this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(companyId));
    }

    onGameCompanyHighlight(userid, socket, jData)
    {
        if (typeof jData.company === "undefined")
            return;

        let company = jData.company;
        if (company !== "")
        {
            this.publishToPlayers("/game/company/highlight", userid, {company: company});

            let sCompanyCharacter = this.getFirstCompanyCharacterCode(company, "");
            if (sCompanyCharacter !== "")
                this.publishChat(userid, "marks company of " + sCompanyCharacter);
        }
    }

    onGameCompanyArrives(userid, socket, jData)
    {
        if (typeof jData.company === "undefined" || jData.company === "")
            return;

        this.getPlayboardManager().CompanyArrivedAtDestination(jData.company);
        this.publishToPlayers("/game/company/arrive", userid, {company: jData.company});

        let sCompanyCharacter = this.getFirstCompanyCharacterCode(jData.company, "");
        if (sCompanyCharacter !== "")
            this.publishChat(userid, "The company of " + sCompanyCharacter + " arrives");
        else
            this.publishChat(userid, "The company arrives");
    }

    onGameCompanyLocationSetLocation(userid, socket, obj)
    {
        this.getPlayboardManager().SetCompanyStartSite(obj.companyUuid, obj.start, obj.regions, obj.destination);
        let res = this.getPlayboardManager().GetCompanyAttachedLocationCards(obj.companyUuid);
        let result = {
            company: obj.companyUuid, 
            start: res.current, 
            regions: res.regions, 
            target: res.target, 
            revealed: false, 
            attached: res.attached,
            current_tapped : res.current_tapped,
            target_tapped : res.target_tapped
        };
        
        this.publishToPlayers("/game/player/draw/locations", userid, result);
        this.publishChat(userid, " organises locations.");
    }

    onGameCompanyLocationAttach(userid, socket, data)
    {
        var _uuid = data.uuid;
        const targetCompanyUuid = data.companyUuid;
        const revealOnDrop = data.reveal;

        var card = this.getPlayboardManager().PopCardFromHand(_uuid);
        if (card === null)
        {
            this.publishChat(userid, "Cannot add foreign card to location threats");
            return;
        }

        if (!this.getPlayboardManager().AddHazardToCompanySite(_uuid, targetCompanyUuid))
        {
            this.publishChat(userid, "cannot add hazard to company.");
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
            this.publishChat(userid, " attached " + card.code + " to site/region");
        else
            this.publishChat(userid, " played an on guard card");
    }

    onGameCompanyLocationReveal(userid, socket, data)
    {
        this.getPlayboardManager().RevealCompanyDestinationSite(data.companyUuid);
        this.publishToPlayers("/game/company/location/reveal", userid, {company: data.companyUuid});
        this.publishChat(userid, " revealed locations.");
    }

    globalSaveGame(userid, socket)
    {
        this.replyToPlayer("/game/save", socket, this.save() );
    }

    onDiscardOpenly(userid, socket, data)
    {
        var card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card !== null)
        {
            this.publishChat(userid, " discards " + card.code);
            this.publishToPlayers("/game/discardopenly", userid, {
                code: card.code,
                owner : card.owner,
                uuid : data.uuid
            });
        }
    }
    
    rollDices(userid, socket, obj)
    {
        const n1 = obj.r1;
        const n2 = obj.r2;
        const nRes = n1 + n2;
        const pDices = this.getPlayerDices();
        const dice = pDices.getDice(userid);
        pDices.saveRoll(userid, nRes);

        this.publishToPlayers("/game/dices/roll", userid, {first: n1, second: n2, total: nRes, user: userid, dice: dice });
        this.publishChat(userid, " rolls " + nRes + " (" + n1 + ", " + n2 + ")");
    }

    setDices(userid, socket, obj)
    {
        this.updateDices(userid, obj.type);
    }

    
    phase(userid, socket, sPhase) 
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

            this.publishChat(userid, " ends turn after " + lTime + "mins. Active player is " + this.getCurrentPlayerName());

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
            this.publishChat(this.getCurrentPlayerId(), " starts turn no. " + nNewTurn);
        else
            this.publishChat(this.getCurrentPlayerId(), " is now in " + sPhase + " phase");
    }

    onCardImport(userid, socket, data)
    {
        if (this.importCardDuringGame(userid, data.code, data.type === "character"))
            this.onGetTopCardFromHand(userid, null, 1);
    }

    onGameAddCardsToGame(userid, socket, data)
    {
        let count = this.addCardsToGameDuringGame(userid, data.cards);
        if (count < 1)
        {
            this.publishChat(userid, "could not add new cards to sideboard");
            return;
        }

        if (count === 1)
            this.publishChat(userid, "just added 1 card to their sideboard");
        else
            this.publishChat(userid, "just added " + count + " cards to their sideboard");

        this.updateHandCountersPlayer(userid);

    }

    viewReveal(userid, socket, obj)
    {
        this.publishToPlayers("/game/view-cards/reveal/list", userid, {type: obj, list: this._getList(userid, obj) });
        this.publishChat(userid, " offers to show cards in " + obj);
    }

    viewList(userid, socket, obj)
    {
        const list = this._getList(userid, obj);
        this.publishToPlayers("/game/view-cards/list", userid, {type: obj, list: list});
        this.publishChat(userid, " views cards in " + obj);
    }

    viewCloseList(userid, socket, obj)
    {
        if (typeof obj.offered === "undefined")
            return;

        if (!obj.offered)
        {
            this.publishChat(userid, " closes card offering");
            this.publishToPlayers("/game/view-cards/list/close", userid, { });
        }
        else
            this.publishChat(userid, " closes card offer");
    }

    viewShuffle(userid, socket, obj)
    {
        if (obj.target === "playdeck")
        {
            this.getPlayboardManager().ShufflePlaydeck(userid);
            this.publishChat(userid, " shuffles playdeck");
        }
        else if (obj.target === "discardpile")
        {
            this.getPlayboardManager().ShuffleDiscardpile(userid);
            this.publishChat(userid, " shuffles discardpile");
        }
    }
    
    viewOfferReveal(userid, socket, obj)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
        {
            this.publishChat(userid, " shows a card");
            this.publishToPlayers("/game/view-cards/reveal/reveal", userid, {uuid: sUuid});
        }
    }
    
    drawSingleCard(userid)
    {
        /** this is the callback, so we better wrap this method call to stay independent */
        this.onCardDrawSingle(userid);
    }

    viewOfferRemove(userid, socket, obj)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
            this.publishToPlayers("/game/view-cards/reveal/remove", userid, {uuid: sUuid});
    }

    saveGameCheckPlayers(assignments)
    {
        if (this.players.ids.length !== Object.keys(assignments).length)
        {
            console.log("Player count missmatch");
            return false;
        }
        
        let success = true;

        /** check that the player ids to be used are really in this game */
        for (let id of Object.keys(assignments))
        {
            if (!this.players.ids.includes(assignments[id]) || assignments[id] === "")
            {
                console.log("Expected player id is not part of this room: " + assignments[id]);
                success = false;
            }
        }

        return success;
    }


    globalRestoreGame(userid, socket, data)
    {
        const pEval = new SaveGameEvaluation(data.assignments);
        data.game = pEval.evaluate(data.game, this.isArda());
        if (data.game === null)
        {
            let message = pEval.getMessageString();
            console.log(message);
            this.publishChat(userid, " savegame is invalid");
            this.publishChat(userid, message);
            
            return;
        }

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
                    console.log("Cannot find owner " + key + " in siteMap");
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
                    console.log("Cannot find owner " + key + " in deck");
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
                    console.log("Cannot find owner " + key + " in stagingarea");
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
                    console.log("Cannot find owner " + key + " in scoring");
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
                    console.log("Cannot find owner " + key + " in companies");
                    error = true;
                }
                else
                    playboard.companies[key].playerId = newkey;
            });

            if (error)
                throw new Error("Could not update ownership");
            else if (!this.restore(playboard, data.game.scoring))
                throw new Error("Cannot restore game playboard");
            
            this.restorePlayerPhase(data.game.meta.phase, data.game.meta.players.turn, data.game.meta.players.current)
            this.publishToPlayers("/game/restore", userid, { success : true });
        }
        catch (err)
        {
            console.log(err);

            if (this._fnEndGame !== null)
                this._fnEndGame();
        }
    }

}

module.exports = GameStandard;
