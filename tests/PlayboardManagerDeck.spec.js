const PlayboardManagerDeck = require("../game-management/PlayboardManagerDeck");

const DeckManagerDefault = require("../game-management/DeckManagerDefault");

const DeckBase = require("../game-management/DeckDefault");

const createEntries = function(pref, n)
{
    let list = [];
    for (let i = 0; i < n; i++)
        list.push(pref + (i+1));
    return list;
}

class DeckTest extends DeckBase {

    constructor()
    {
        super("test");
        
        this.handCards = createEntries("hand", 5);
        this.discardPile = createEntries("disc", 5);
        this.sideboard = createEntries("side", 5);
        this.victory = createEntries("mp", 5);
        this.playdeck = createEntries("play", 5);
    
    }
}

class DeckManagerTest extends DeckManagerDefault {
    
    newDeckInstance(playerId)
    {
        return new DeckTest(playerId);
    }

    getFullPlayerCard(uuid)
    {
        return {
            "alignment": "Minion",
            "type": "Resource",
            "Secondary": "Ally",
            "title": uuid,
            "MPs": "2",
            "normalizedtitle": uuid,
            "code": uuid
          }
    }
}

class DeckManagerTestStaticDeck extends DeckManagerDefault {
    
    constructor(_deck)
    {
        super("test");
        this.__deck = _deck === undefined ? null : _deck;
    }

    newDeckInstance(playerId)
    {
        return new DeckTest(playerId);
    }

    getPlayerDeck(sPlayer)
    {
        return this.__deck !== null ? this.__deck : super.getPlayerDeck(sPlayer);
    }    
}


class PlayboardManagerDeckTestImplThisDeck extends PlayboardManagerDeck
{
    constructor(_dat)
    {
        super({}, [], { trigger : function() { /* not needed */} }, gameCardProvider);

        this._dat = _dat;
    }

    getDecks()
    {
        return this._dat;
    }
}

class PlayboardManagerDeckTestImpl extends PlayboardManagerDeck
{
    constructor(_deck)
    {
        super(_deck, [], { trigger : function() {/* not needed */} }, gameCardProvider);
    }
}

const gameCardProvider =  {

    getCardType: function(_code)
    {
        return "character";
    }
};

describe('PlayboardManagerDeck', () => {
    
    it('getDecks()', () => {
        const pInstance = new PlayboardManagerDeckTestImpl(new DeckManagerTest());
        pInstance.AddDeck("test", {});
    
        expect(pInstance.getDecks().isArda()).toEqual(false);
    });

    it("UpdateOwnership", () => {

        let pCard = {};
        pCard.owner = "hallo";

        const pInstance = new PlayboardManagerDeckTestImpl(new DeckManagerTest());
        pInstance.AddDeck("test", {});
    
        pInstance.UpdateOwnership("welt", pCard);
        expect(pCard.owner).toEqual("welt")
        
    });

    it("AddDeck", () => {
        const pInstance = new PlayboardManagerDeckTestImpl(new DeckManagerTest());
        pInstance.AddDeck("test", {});
        expect(pInstance.AddDeck("hallo", {})).toEqual(true)
    });

    it("GetTopCards(playerId, nCount)", () => {
        const pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTest());
        pInstance.AddDeck("test", {});
            expect(pInstance.GetTopCards("test", 2).length).toEqual(2);
    });

    it("_drawCard(playerId, nCount)", () => {
        
        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTest());

        pInstance.AddDeck("test", {});

        const pDeck = pInstance.getPlayerDeck("test");
        expect(pDeck === null).toEqual(false);

        let res = pInstance._drawCard("test", true);
        expect(res).toEqual("hand1");
        expect(pDeck.size().hand).toEqual(5);

        res = pInstance._drawCard("test", false);
        expect(res.startsWith("play")).toEqual(true);
        expect(pDeck.size().playdeck).toEqual(4);
        expect(pDeck.size().hand).toEqual(6);
    });
    it("readyCard(playerId, nCount)", () => {
        
        let isReady = false;

        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            readyCard(_uuid)
            {
                isReady = true;
            }

            isStateTapped(uuid)
            {
                return !this.readyCard(uuid);
            }
        }

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());

        expect(isReady).toEqual(false);

        pInstance.readyCard(true);
        expect(isReady).toEqual(true);

        pInstance.readyCard(false);
        expect(isReady).toEqual(true);
    });

    
    it("FlipCard", () => {
        
        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            flipCard(uuid)
            {
                return uuid ? true : false;
            }
        }

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());
        
        expect(pInstance.FlipCard(true)).toEqual(true);
        expect(pInstance.FlipCard(false)).toEqual(false);
    });


    it("SetSiteState", () => {
        
        let ready = 0;
        let tapped = 0;

        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            readySite(_uuid)
            {
                ready++;
            }

            tapSite()
            {
                tapped++;
            }
        }

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());
        
        for (let i = 0; i < 10; i++)
            pInstance.SetSiteState("", "", 0)
        for (let i = 0; i < 5; i++)
            pInstance.SetSiteState("", "", 90)
        for (let i = 0; i < 5; i++)
            pInstance.SetSiteState("", "", 91)
            
        expect(ready).toEqual(10);
        expect(tapped).toEqual(5);
    });

    it("IsSiteTapped", () => {
        
        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            siteIsTapped(_playerId, code)
            {
                return code;
            }
        }

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());
        
                    
        expect(pInstance.IsSiteTapped("test", true)).toEqual(true);
        expect(pInstance.IsSiteTapped("test", false)).toEqual(false);
        expect(pInstance.IsSiteTapped("test", "uuid")).toEqual("uuid");
    });


    it("ShufflePlaydeck", () => {
        
        let count = 0;

        let pDeck = new DeckManagerTestStaticDeck({
            shuffle(_playerId, _code)
            {
                count++;
            }
        });

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(pDeck);
        
        for (let i = 0; i < 10; i++)
            pInstance.ShufflePlaydeck("a");

        expect(count).toEqual(10);
    });


    it("GetTappedSites", () => {
        
        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            getTappedSites(code)
            {
                return code;
            }
        }

        let pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());
        
                    
        expect(pInstance.GetTappedSites("test")).toEqual("test");
    });

    it("SetCardState", () => {
        
        let s0 = 0, s90 = 0, s91 = 0, s180 = 0, s270 = 0;

        class DeckManagerTestI extends DeckManagerTestStaticDeck
        {
            readyCard(_uuid)
            {
                s0++;
            }

            tapCard()
            {
                s90++;
            }
            tapCardFixed()
            {
                s91++;
            }
            woundCard()
            {
                s180++;
            }
            triceTapCard()
            {
                s270++;
            }
        }

        const pInstance = new PlayboardManagerDeckTestImplThisDeck(new DeckManagerTestI());
        
        for (let i = 0; i < 10; i++)
            pInstance.SetCardState("", 0);
        for (let i = 0; i < 11; i++)
            pInstance.SetCardState("", 90);
        for (let i = 0; i < 12; i++)
            pInstance.SetCardState("", 91);
        for (let i = 0; i < 13; i++)
            pInstance.SetCardState("", 180);
        for (let i = 0; i < 14; i++)
            pInstance.SetCardState("", 270);
        for (let i = 0; i < 15; i++)
            pInstance.SetCardState("", 271);

        expect(s0).toEqual(10);
        expect(s90).toEqual(11);
        expect(s91).toEqual(12);
        expect(s180).toEqual(13);
        expect(s270).toEqual(14);
    });
});
