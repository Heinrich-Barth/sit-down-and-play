const Chat = require("./Chat");

test("Chat.getGameLogFile()", () => {

    const fileRoom = new Chat(null, null, "roomname").getGameLogFile();
    const fileNoRoom = new Chat(null, null, "").getGameLogFile();

    expect(fileRoom.endsWith("-roomname.txt")).toBeTruthy();
    expect(fileNoRoom.endsWith(".txt")).toBeTruthy();
    
});

test("Chat.createLogFinalScore()", () => {

    const score = {
        score: {
            'aaaaa': { ally: 1, character: 2, faction: 3, item: 1, kill: 1, misc: 1 },
            'bbbbb': { ally: 10, character: 12, faction: 13, item: 14, kill: 15, misc: 16 },
            'c': { ally: 90, character: 12, faction: 13, item: 14, kill: 15, misc: 16 }
        },
        players: { 
            'aaaaa': 'John',
            "bbbbb": "Verena"
        }
    };

    const instance = new Chat(null, null, "roomname");
    expect(instance._log.length).toEqual(0);

    const res = instance.createLogFinalScore(score);
    const message = res.join("\n");
    expect(res.length).toEqual(4);
    expect(message.indexOf("John\t9")).not.toEqual(-1);
    expect(message.indexOf("Verena\t80")).not.toEqual(-1);
});