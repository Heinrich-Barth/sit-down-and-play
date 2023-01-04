
const Discord = require("../../plugins/discord");
const instance = new Discord();


describe('Discord', () => {

    it('sortScores(score, players)', () => {

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

        const list = instance.sortScores(scores);
        expect(list.length).toEqual(3);
        expect(list[0].total).toEqual(400);
        expect(list[0].name).toEqual("player3");
        expect(list[1].total).toEqual(200);
        expect(list[2].total).toEqual(100);
        expect(list[2].name).toEqual("A player");
    });

    it('createScoreMessage(room, finalScore)', () => {

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
        const expectMessage = "player3 has won the game -room- scoring 400 points (kat1 (200), kat2 (200))" +
        ",\nplayer2 scored 200 points (kat1 (100), kat2 (100))"+
        ",\nplayer1 scored 0 points.";
        expect(message).toEqual(expectMessage);
    });

    
});