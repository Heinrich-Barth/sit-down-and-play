
const Discord = require("./discord");
const instance = new Discord();


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

    test("Discord.getEndGameMessage(room)", () =>
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

});