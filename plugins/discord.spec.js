
const Discord = require("./discord");
const instance = new Discord();

class DiscordTest extends Discord 
{
    constructor()
    {
        super();
        this.posts = 0;
        this.messageId = Date.now();
    }

    doPost(room)
    {
        this.posts++;
        this.saveDiscordMessageId(room, { id: this.messageId })
    }

    getPosts()
    {
        return this.posts;
    }
}


describe('Discord', () => {

    test('sortScores(score, players)', () => {

        let scores = {
            players : {
                a: "player1",
                b: "player2",
                c: "player3"
            },

            score : {
                aa: {
                    kat1: 50,
                    kat2: 50
                },
                b: {
                    kat1: 100,
                    kat2: 100
                },
                c: {
                    kat1: 200,
                    kat2: 200
                }
            }
        }

        const list = instance.sortScores(scores.score, scores.players);
        expect(list.length).toEqual(3);
        expect(list[0].total).toEqual(400);
        expect(list[0].name).toEqual("player3");
        expect(list[1].total).toEqual(200);
        expect(list[2].total).toEqual(100);
        expect(list[2].name).toEqual("A player");
    });

    test('createScoreMessage(room, finalScore)', () => {

        let scores = {
            players : {
                a: "player1",
                b: "player2",
                c: "player3"
            },

            score : {
                a: {
                    kat1: 0,
                    kat2: 0
                },
                b: {
                    kat1: 100,
                    kat2: 100
                },
                c: {
                    kat1: 200,
                    kat2: 200
                }
            }
        }
        const room = "-room-";
        const message = instance.createScoreMessage(room, scores);
        const expectMessage = "player3 won the game -room- scoring 400 points (kat1 (200), kat2 (200))" +
        ",\nplayer2 scored 200 points (kat1 (100), kat2 (100))"+
        ",\nplayer1 scored 0 points.";
        expect(message).toEqual(expectMessage);
    });

    test("Discord.createRoomEntry(room)", () =>
    {
        const instance = new Discord();

        expect(instance.createRoomEntry("test")).toBeTruthy();
        expect(instance.createRoomEntry("test")).toBeFalsy();
    });

    test("Discord.updateRoomPlayerList(room, name)", () =>
    {
        const instance = new Discord();

        expect(instance.updateRoomPlayerList("test", "player")).toBeFalsy();
        expect(instance.createRoomEntry("test")).toBeTruthy();
        expect(instance.updateRoomPlayerList("test", "player")).toBeTruthy();
        expect(instance.updateRoomPlayerList("test", "player")).toBeFalsy();
    });

    test("Discord.updateRoomPlayerList(room, name)", () =>
    {
        const instance = new Discord();

        expect(instance.listRoomPlayers("test")).toEqual("");
        expect(instance.createRoomEntry("test")).toBeTruthy();
        expect(instance.updateRoomPlayerList("test", "player1")).toBeTruthy();
        expect(instance.listRoomPlayers("test")).toEqual("player1");
        expect(instance.updateRoomPlayerList("test", "player2")).toBeTruthy();
        expect(instance.listRoomPlayers("test")).toEqual("player1, player2");
    });

    test("creeateMessageStandard(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin)", () =>
    {
        const instance = new Discord();

        let room = "_ROOM_";
        let name = "_NAME_";
        let urlWatch = "_WATCHURL_";
        let urlJoin = "_JOINURL_";

        expect(instance.creeateMessageStandard(room, name, false, true, urlWatch, urlJoin)).toEqual("_NAME_ joined.");
        expect(instance.creeateMessageStandard(room, name, false, false, urlWatch, urlJoin)).toEqual("_NAME_ joined.");
        expect(instance.creeateMessageStandard(room, name, true, false, urlWatch, urlJoin)).toEqual("_NAME_ just started a new game (_ROOM_). Drop by and watch at _WATCHURL_");
        expect(instance.creeateMessageStandard(room, name, true, true, urlWatch, urlJoin)).toEqual("Open challenge! _NAME_ just started a new game (_ROOM_). Join the table at _JOINURL_ or drop by watch at _WATCHURL_");
    });

    test("createMessageArda(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin)", () =>
    {
        const instance = new Discord();

        let room = "_ROOM_";
        let name = "_NAME_";
        let urlWatch = "_WATCHURL_";
        let urlJoin = "_JOINURL_";

        expect(instance.createMessageArda(room, name, false, true, urlWatch, urlJoin)).toEqual("_NAME_ joined.");
        expect(instance.createMessageArda(room, name, false, false, urlWatch, urlJoin)).toEqual("_NAME_ joined.");
        expect(instance.createMessageArda(room, name, true, false, urlWatch, urlJoin)).toEqual("_NAME_ just started a new ARDA game (_ROOM_). Drop by and watch at _WATCHURL_.");
        expect(instance.createMessageArda(room, name, true, true, urlWatch, urlJoin)).toEqual("Open challenge! _NAME_ just started a new ARDA game (_ROOM_). Drop by and watch at _WATCHURL_ or join at _JOINURL_ If players are not on discord, they probably use the free https://meet.jit.si/_ROOM_ for communication.");
    });

    test("Discord.getEndGameMessage(room)", () =>
    {
        const instance = new Discord();

        expect(instance.getEndGameMessage("test")).toEqual("The game test has ended.");
        expect(instance.getEndGameMessage("test", "log.txt")).toEqual("The game test has ended.\nYou may check out the game log at /logs/log.txt for some limited time.");
        
        expect(instance.createRoomEntry("test")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game test has ended.");

        expect(instance.updateRoomPlayerList("test", "player1")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game of player1 (test) has ended.");
        expect(instance.updateRoomPlayerList("test", "player2")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game of player1, player2 (test) has ended.");
    });

    test("Discord.postNotification(room)", () =>
    {

        const instance = new Discord();

        expect(instance.getEndGameMessage("test")).toEqual("The game test has ended.");
        
        expect(instance.createRoomEntry("test")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game test has ended.");

        expect(instance.updateRoomPlayerList("test", "player1")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game of player1 (test) has ended.");
        expect(instance.updateRoomPlayerList("test", "player2")).toBeTruthy();
        expect(instance.getEndGameMessage("test")).toEqual("The game of player1, player2 (test) has ended.");
    });

    test("sendDiscordMessageCreated", () => {
        const instance = new DiscordTest();
        instance.hookUrl = "localhost";
        const NAME = "_playername_";
        expect(instance.getPosts()).toEqual(0);
        instance.sendDiscordMessageCreated("testRoom", true, NAME);
        expect(instance.getPosts()).toEqual(1);

        instance.sendDiscordMessageCreated("testRoom", false, NAME);
        expect(instance.getPosts()).toEqual(2);
    });
});