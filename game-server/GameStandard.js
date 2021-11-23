const TurnTimer = require("./turnTimer");
const Scores = require("./scores");

const GamePlayers = require("./GamePlayers");

class GameStandard extends GamePlayers
{
    constructor(_MeccgApi, _Chat, _playboardManager)
    {
        super(_MeccgApi, _Chat, _playboardManager)

        this._adminUser = "";
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

        this.getMeccgApi().addListener("/game/card/state/set", this.onGameCardStateSet.bind(this)); //xxx
        this.getMeccgApi().addListener("/game/card/state/glow", this.onGameStateGlow.bind(this));
        this.getMeccgApi().addListener("/game/card/state/reveal", this.onGameCardStateReveal.bind(this));
        this.getMeccgApi().addListener("/game/card/draw", this.onCardDraw.bind(this));
        this.getMeccgApi().addListener("/game/card/draw/single", this.onCardDrawSingle.bind(this));

        this.getMeccgApi().addListener("/game/card/store", this.onCardStore.bind(this));
        this.getMeccgApi().addListener("/game/card/move", this.onCardMove.bind(this));
        this.getMeccgApi().addListener("/game/card/discard", this.onCardDiscard.bind(this));

        this.getMeccgApi().addListener("/game/stagingarea/add/card", this.onStagingAreaAddCard.bind(this));

        this.getMeccgApi().addListener("/game/save", this.globalSaveGame.bind(this));
        this.getMeccgApi().addListener("/game/restore", this.globalRestoreGame.bind(this));

        this.getMeccgApi().addListener("/game/roll-dices", this.rollDices.bind(this));
        this.getMeccgApi().addListener("/game/phase/set", this.phase.bind(this)); /* Set the current phase of the game turn */
        this.getMeccgApi().addListener("/game/add-cards-to-game", this.onGameAddCardsToGame.bind(this)); /* add a list of cards to the sideboard */
        
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
        var list = this.getPlayerIds();
        for (var i = 0; i < list.length; i++)
            this.updateHandCounterPlayerOnly(list[i]);
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
            player: size.playdeck
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
            player: size.playdeck
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

    getCurrentBoard(id)
    {
        var data = {
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

            data : this.getPlayboardManager().GetData()
        };

        var _dataTarget;
        var _playerId, _list, _temp, card;

        var players = this.getPlayerIds();
        for (var i = 0; i < players.length; i++)
        {
            _playerId = players[i];
            if (_playerId === id)
                _dataTarget = data.player;
            else
                _dataTarget = data.opponent;

            _list = this.getPlayboardManager().GetCompanyIds(_playerId);
            for (var y = 0; y < _list.length; y++)
            {
                _temp = this.getPlayboardManager().GetFullCompanyByCompanyId(_list[y]);
                if (_temp !== null)
                    _dataTarget.companies.push(_temp);
            }

            _list = this.getPlayboardManager().GetStagingCards(_playerId, true);
            for (var y = 0; y < _list.length; y++)
            {
                card = this.getPlayboardManager().GetCardByUuid(_list[y]);
                _dataTarget.stage_resources.push({uuid: card.uuid, target: "", code: card.code, type: card.type.toLowerCase(), state: card.state, revealed: card.revealed, owner: card.owner});
            }

            _list = this.getPlayboardManager().GetStagingCards(_playerId, false);
            for (var y = 0; y < _list.length; y++)
            {
                card = this.getPlayboardManager().GetCardByUuid(_list[y]);
                _dataTarget.stage_hazards.push({uuid: card.uuid, target: "", code: card.code, type: card.type.toLowerCase(), state: card.state, revealed: card.revealed, owner: card.owner});
            }

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
        for (let i = 0; i < _list.length; i++)
            this.drawCard(id, _list[i].uuid, _list[i].code, _list[i].type, 1);

        this.updateHandCountersPlayer(id);
    }

    sendCurrentHandSize()
    {
        const userid = this.getCurrentPlayerId();
        const size = this.getPlayboardManager().Size(player);
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
        let type = card.type;
        card.turn = this.getCurrentTurn();

        this.publishToPlayers("/game/remove-card-from-hand", "", _uuid);
        this.publishToPlayers("/game/add-to-staging-area", userid, {uuid: _uuid, target: "", code: card.code, type: type, state: card.state, revealed: card.revealed, owner: card.owner, turn: card.turn });
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
        for (var i = 0; i < _list.length; i++)
            this.drawCard(userid, _list[i].uuid, _list[i].code, _list[i].type, 1);

        this.updateHandCountersPlayer(userid);

        if (_list.length === 1)
            this.publishChat(userid, "drew 1 card");
        else if (_list.length > 1)
            this.publishChat(userid, "drew " + _list.length + " cards");
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

        let _card;
        let _cards = this.getPlayboardManager().GetTopCards(userid, nCount);
        for (var i = 0; i < _cards.length; i++)
        {
            _card = _cards[i];
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

        if (card.type === "character")
        {
            let _remove = [];
            let _uuid;
            list = this.getPlayboardManager().PopCharacterAndItsCards(obj.uuid);

            for (let i = 0; i < list.length; i++)
            {
                _uuid = list[i];
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
    }

    onCardMove(userid, socket, obj)
    {
        var drawTop = obj.drawTop;
        var card = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        var list = [];
        if (card.type !== "character" || obj.source !== "inplay")
        {
            /**
             * the victory pile is different: usually, the target of your deck pils is always the card owner,
             * yet the victory condition allows to take ownership of cards
             */
            let _targetPlayer = card.owner;
            if (obj.target === "victory" || obj.target === "hand")
                _targetPlayer = userid;
                
            if (this.getPlayboardManager().MoveCardTo(obj.uuid, _targetPlayer, obj.target))
                list = [obj.uuid];
        } 
        else
            list = this.getPlayboardManager().MoveCardCharacterTo(obj.uuid, card.owner, obj.target);

        if (list.length > 0)
        {
            if (drawTop)
                this.onGetTopCardFromHand(card.owner, socket, list.length);

            this.updateHandCountersPlayer(userid);
        }

        // now we have to remove the cards from the board again
        this.publishToPlayers("/game/card/remove", userid, list);
        this.publishChat(userid, "Moved " + list.length + " card(s) to " + obj.target);
    }

    onCardDiscard(userid, socket, data)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card === null || !this.getPlayboardManager().MoveCardTo(data.uuid, card.owner, "discardpile"))
            return false;

        this.updateHandCountersPlayer(card.owner);
        this.publishChat(userid, "Discarded 1 card.");
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
        var list = this.getPlayboardManager().GetCompanyIds(userid);
        for (var i = 0; i < list.length; i++)
            this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(list[i]));
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

        let sWho = this.getCardCode(cardUuid, "Character") + " ";
        let sHow = "";
        if (!this.getPlayboardManager().JoinCharacter(cardUuid, targetcharacter, targetCompany, userid))
            sHow = "cannot join under direct influence";
        else
        {
            this.removeEmptyCompanies();

            let sChar = this.getCharacterCode(targetcharacter, "a character");
            sHow = "joined " + sChar + " under direct influence";
        }

        this.publishChat(userid, sWho + sHow);
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
        }

        // draw the company
        this.publishToPlayers("/game/player/draw/company", userid, this.getPlayboardManager().GetFullCompanyByCompanyId(_id));
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
        const n1 = this.getMeccgApi().getRandomDiceRoll();
        const n2 = this.getMeccgApi().getRandomDiceRoll();
        const nRes = n1 + n2;

        this.publishToPlayers("/game/roll-dices", userid, {first: n1, second: n2, total: nRes, user: userid });
        this.publishChat(userid, " rolls " + nRes + " (" + n1 + ", " + n2 + ")");
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
            var list = this.getPlayboardManager().GetCompanyIds(userid);
            for (var i = 0; i < list.length; i++)
                this.getPlayboardManager().CompanyArrivedAtDestination(list[i]);
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
            var list = this.getPlayboardManager().GetCompanyIds(userid);
            for (var i = 0; i < list.length; i++)
                this.getPlayboardManager().ReadyCompanyCards(list[i]);

            this.publishToPlayers("/game/player/set-current", this.getCurrentPlayerId(), {name: this.getCurrentPlayerId(), displayname: this.getCurrentPlayerName()});
        }

        this.setPhase(sPhase);
        this.sendCurrentPhase();

        if (nNewTurn !== nCurrentTurn)
            this.publishChat(this.getCurrentPlayerId(), " starts turn no. " + nNewTurn);
        else
            this.publishChat(this.getCurrentPlayerId(), " is now in " + sPhase + " phase");
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

    globalRestoreGame(userid, socket, data)
    {
        try
        {
            let assignments = data.assignments; 
            if (this.players.ids.length !== Object.keys(assignments).length)
                throw "Player count missmatch";
            else if (this.isArda() !== data.game.meta.arda)
                throw "Arda missmatch";

            for (let id of Object.keys(assignments))
            {
                if (!this.players.ids.includes(assignments[id]) || assignments[id] === "")
                    throw "Invalid player id detected.";
            }

            let playboard = data.game.playboard;
            let _map = playboard.decks.cardMap;
            for (let _cardId of Object.keys(_map))
            {
                const _formerOwner = _map[_cardId].owner;
                if (assignments[_formerOwner] === undefined)
                    throw "Cannot find former owner " + _formerOwner;
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
                    return;
                }
                playboard.decks.siteMap[newkey] = playboard.decks.siteMap[key];
                delete playboard.decks.siteMap[key];
            });

            keys = Object.keys(playboard.decks.deck);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.log("Cannot find owner " + key + " in deck");
                    error = true;
                    return;
                }
                playboard.decks.deck[newkey] = playboard.decks.deck[key];
                delete playboard.decks.deck[key];
            });

            keys = Object.keys(playboard.stagingarea);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.log("Cannot find owner " + key + " in stagingarea");
                    error = true;
                    return;
                }
                playboard.stagingarea[newkey] = playboard.stagingarea[key];
                delete playboard.stagingarea[key];
            });

            keys = Object.keys(data.game.scoring);
            keys.forEach(function(key) 
            {
                let newkey = assignments[key];
                if (newkey === undefined)
                {
                    console.log("Cannot find owner " + key + " in scoring");
                    error = true;
                    return;
                }
                data.game.scoring[newkey] = data.game.scoring[key];
                delete data.game.scoring[key];
            });

            keys = Object.keys(playboard.companies);
            keys.forEach((key) => 
            {
                let newkey = assignments[playboard.companies[key].playerId];
                if (newkey === undefined)
                {
                    console.log("Cannot find owner " + key + " in companies");
                    error = true;
                    return;
                }
                playboard.companies[key].playerId = newkey;
            });

            if (error)
                throw "Could not update ownership";
            else if (!this.restore(playboard, data.game.scoring))
                throw "Cannot restore game playboard";

            
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
