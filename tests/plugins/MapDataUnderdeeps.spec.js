

const MapDataUnderdeeps = require("../../plugins/MapDataUnderdeeps");

it("getSites", () => {

    let cards = [];
    for (let i = 0; i < 3; i++)
    {
        let _d = {
            type: i !== 1 ? "Site" : "Region",
            title: "title_" + i
        }

        cards.push(_d);
    }
    const instance = new MapDataUnderdeeps();
    let res = instance.getSites(cards);
    expect(res).not.toBeNull();
});

it("normalizeString", () => {
    
    expect(MapDataUnderdeeps.normalizeString("Blue-mountain Dwarf-hold")).toEqual("bluemountain dwarfhold");

});
it("isCandidateUnderdeep(card)", () => {

    const instance = new MapDataUnderdeeps();
    expect(instance.isCandidateUnderdeep({ RPath: "Under-deep" })).toBeTruthy();
    expect(instance.isCandidateUnderdeep({ RPath: "The Under-gates" })).toBeTruthy();
    expect(instance.isCandidateUnderdeep({ RPath: "The Under-gates2" })).toBeFalsy();
    expect(instance.isCandidateUnderdeep({})).toBeFalsy();
});



it("getListOrUnderdeepSites", () => {

    let data = [
        {
            RPath: "Under-deep",
            value: true,
        },
        {
            RPath: "Under-deep",
            value: true,
        },
        {
            RPath: "The Under-gates",
            value: true,
        },
        {
            RPath: "Whatever",
            value: false,
        }
    ]

    const instance = new MapDataUnderdeeps();
    expect(instance.getListOrUnderdeepSites([]).length).toEqual(0);

    let res = instance.getListOrUnderdeepSites(data);
    expect(res.length).toEqual(3);
    for (let card of res)
        expect(card.value).toBeTruthy();
});

it("extractAdjacentSites(text)", () => {
    let text = "Adjacent Sites: Barad-dûr (0), The Sulfur-deeps (5), The Under-galleries (4)";
    const instance = new MapDataUnderdeeps();

    expect(instance.extractAdjacentSites("").length).toEqual(0);

    let res = instance.extractAdjacentSites(text);
    expect(res.length).toEqual(3);
    expect(res.includes("The Sulfur-deeps")).toBeTruthy();
    expect(res.includes("The Under-galleries")).toBeTruthy();
    expect(res.includes("Barad-dûr")).toBeTruthy();
});

it("splitAdjacentSites(text)", () => {
    let text = "Barad-dûr (0), The Sulfur-deeps (5), The Under-galleries (4)";
    const instance = new MapDataUnderdeeps();

    expect(instance.splitAdjacentSites("").length).toEqual(0);

    let res = instance.splitAdjacentSites(text);

    expect(res.length).toEqual(3);
    expect(res.includes("The Sulfur-deeps")).toBeTruthy();
    expect(res.includes("The Under-galleries")).toBeTruthy();
    expect(res.includes("Barad-dûr")).toBeTruthy();
});



it("createAdjacentSiteList(targetMap, sites)", () => {

    let sites = [
        {
            RPath: "Under-deep",
            code: "card1 A",
            "text": "Adjacent Sites: Barad-dûr (0), The Sulfur-deeps (5), The Under-galleries (4)"
        },
        {
            RPath: "Under-deep",
            code: "card1 B",
            "text": "Adjacent Sites: Barad-dûr (0), The Sulfur-deeps (5), The Under-galleries (4)"
        },
        {
            RPath: "The Under-gates",
            title: "card2",
            code: "card2 C",
            "text": "Adjacent Sites: Barad-dûr (0)"
        }
    ];

    let surfeaces = {
        "baraddur": [
            {
                code: "Barad-dûr [M]",
                title: "barad-dûr",
            }
        ],
        "the sulfurdeeps": [
            {
                code: "The Sulfur-deeps [M]",
                title: "the sulfur-deeps"
            },
            {
                code: "The Sulfur-deeps [H]",
                title: "the sulfur-deeps"
            }
        ],

        "the undergalleries": [
            {
                code: "The Under-galleries [H]",
                title: "the under-galleries"
            },
            {
                code: "The Under-galleries [M]",
                title: "the under-galleries"
            },
            {
                code: "The Under-galleries [D]",
                title: "the under-galleries"
            }
        ]
    }

    const instance = new MapDataUnderdeeps();
    let res = instance.createAdjacentSiteList(sites, surfeaces);

    expect(Object.keys(res).length).toEqual(9);
    expect(res["card1 A"].length).toEqual(6);
    expect(res["card1 B"].length).toEqual(6);
    expect(res["card2 C"].length).toEqual(1);

    expect(res["Barad-dûr [M]"].length).toEqual(3);
    expect(res["The Sulfur-deeps [H]"].length).toEqual(2);
    expect(res["The Sulfur-deeps [M]"].length).toEqual(2);
    expect(res["The Under-galleries [H]"].length).toEqual(2);
    expect(res["The Under-galleries [M]"].length).toEqual(2);
    expect(res["The Under-galleries [D]"].length).toEqual(2);
});


it("getCodesByTitle", () => {

    let data = {
        "test": [
            {
                code: "a"
            },
            {
                code: "b"
            }
        ]
    }

    const instance = new MapDataUnderdeeps();
    expect(instance.getCodesByTitle(data, "t").length).toEqual(0);
    expect(instance.getCodesByTitle(data, "test").length).toEqual(2);
});


it("extractAdjacentPart", () => {

    let text;
    let res;
    const instance = new MapDataUnderdeeps();

    res = instance.extractAdjacentPart("");
    expect(res).toBeNull();

    text = "Playable: Items (minor, major, greater)(1)Orcs---4 strikes with 8 prowess;(2)Opponent--- may play as an automatic-attack one non-unique hazard creature from his hand normally keyed to Ruins & Lairs. Special: Volcano. Any non-unique Drake not keyable to a Coastal Sea [c] region may be played at this site";
    res = instance.extractAdjacentPart(text);
    expect(res).toBeNull();

    text = "Adjacent Sites: Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)";
    res = instance.extractAdjacentPart(text);
    expect(res).toEqual("Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)");

    text = "Adjacent Sites: Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)Playable: Items (minor, major, greater)(1)Orcs---4 strikes with 8 prowess;(2)Opponent--- may play as an automatic-attack one non-unique hazard creature from his hand normally keyed to Ruins & Lairs. Special: Volcano. Any non-unique Drake not keyable to a Coastal Sea [c] region may be played at this site";
    res = instance.extractAdjacentPart(text);
    expect(res).toEqual("Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)");
});

expect(true).toBeTruthy();

/** 
describe("identify adajacent sizes", () => {

    let text;
    let res;
    const instance = new MapDataUnderdeeps();

    res = instance.listAdajacentSites("");
    expect(res.length).toEqual(0);

    text = "Playable: Items (minor, major, greater)(1)Orcs---4 strikes with 8 prowess;(2)Opponent--- may play as an automatic-attack one non-unique hazard creature from his hand normally keyed to Ruins & Lairs. Special: Volcano. Any non-unique Drake not keyable to a Coastal Sea [c] region may be played at this site";
    res = instance.listAdajacentSites(text);
    expect(res.length).toEqual(0);

    text = "Adjacent Sites: Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)";
    res = instance.listAdajacentSites(text);
    expect(res.length).toEqual(4);

    text = "Adjacent Sites: Eithel  Morgoth (0), Ancient Maze (6), The Iron-deeps (6), The Pits of Angband (8)Playable: Items (minor, major, greater)(1)Orcs---4 strikes with 8 prowess;(2)Opponent--- may play as an automatic-attack one non-unique hazard creature from his hand normally keyed to Ruins & Lairs. Special: Volcano. Any non-unique Drake not keyable to a Coastal Sea [c] region may be played at this site";
    res = instance.listAdajacentSites(text);
    expect(res.length).toEqual(4);
});

*/


