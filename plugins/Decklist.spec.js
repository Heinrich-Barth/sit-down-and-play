const Decklist = require("./Decklist");

test("getDeckList", () => {

    const list = Decklist.getDeckList();
    expect(list.length).toBeGreaterThan(0);
});
