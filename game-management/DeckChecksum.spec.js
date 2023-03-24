const DeckChecksum = require("./DeckChecksum");

const deck = {
    pool: {
      'black arrow (tw)': 1,
      'cram (td)': 1,
      'elf-stone (tw)': 1,
      'beorn (tw)': 1,
      'gimli (tw)': 1,
      'halbarad (tw)': 1,
      'legolas (tw)': 1
    },
    playdeck: {
      'radagast [h] (tw)': 4,
      'celeborn (tw)': 1,
      'elrohir (tw)': 1,
      'fanar (fb)': 1,
      'haldir (tw)': 1,
      'háma (tw)': 1,
      'thranduil (tw)': 1,
      'noble hound (dm)': 2,
      'noble steed (wh)': 3,
      'beornings (tw)': 1,
      'easterlings (tw)': 1,
      'iron hill dwarves (tw)': 1,
      'men of dorwinion (tw)': 1,
      'wood-elves (tw)': 1,
      'orcrist (tw)': 1,
      'bow of the galadhrim (as)': 1,
      'torque of hues (tw)': 1,
      'elf-friend (fb)': 1,
      'forewarned is forearmed (dm)': 1,
      'great friendship (fb)': 1,
      'herb-lore (dm)': 1,
      'and forth he hastened (td)': 1,
      'dark quarrels (tw)': 2,
      'flatter a foe (td)': 2,
      'marvels told (td)': 2,
      'muster (tw)': 1,
      'new friendship (tw)': 3,
      'risky blow (tw)': 3,
      'smoke rings (dm)': 1,
      'vanishment (tw)': 2,
      'abductor (tw)': 1,
      'ambusher (le)': 3,
      'angmarim tribesmen (kn)': 1,
      'assassin (tw)': 1,
      'brigands (le)': 1,
      'corsairs of umbar (tw)': 2,
      'ghosts (le)': 2,
      'lawless men (le)': 3,
      'sellswords between charters (le)': 3,
      'stout men of gondor (as)': 1,
      'black crows (fb)': 1,
      'alone and unadvised (as)': 2,
      'fruitless victory (ne)': 1,
      'rank upon rank (dm)': 3,
      'ransom (ne)': 1,
      'thrice outnumbered (le)': 1,
      "wielder's curse (gw)": 1,
      'left behind (td)': 1,
      'seized by terror (dm)': 1,
      'tidings of bold spies (le)': 2,
      'twilight (le)': 2
    },
    sideboard: {
      'beacons alight (wr)': 1,
      'corsairs of umbar (tw)': 1,
      'grasping and ungracious (ti)': 1,
      'imagination run away (gw)': 1,
      'itangast ahunt (td)': 1,
      'his fury has betrayed him (wr)': 1,
      'horse-lords (le)': 1,
      'lost in emyn muil (ti)': 1,
      'nameless thing (dm)': 1,
      'ninevet (df)': 1,
      'no place for a pony (rs)': 1,
      'scorba ahunt (td)': 1,
      'twilight (le)': 1,
      "you've put your finger in it (mm)": 1,
      'collar of spikes (ti)': 1,
      'dark quarrels (tw)': 1,
      'forewarned is forearmed (dm)': 1,
      'gates of morning (tw)': 2,
      'glamour of surpassing excellance (as)': 2,
      'great bow of lórien (fb)': 1,
      'great-shield of rohan (tw)': 1,
      'marvels told (td)': 1,
      'men of dale (td)': 1,
      'profitable trade (df)': 1,
      'promptings of wisdom (wh)': 2,
      'wain-easterlings [h] (as)': 1,
      "wizard's laughter (tw)": 1
    }
};

test("Calck Checksum", () => {

    let result = DeckChecksum.calculateChecksum(deck);
    expect(result).toEqual("0f02b5ac865c6fa3c389c647789a6ee335c6d8357f138cfe2472c0b31f25baad");

});


test("Calck Checksum", () => {

    const deck2 = {
        pool: {
          'black ar (tw)': 1,
          'leg (tw)': 1
        },
        playdeck: {
          'rada [h] (tw)': 4
        }
    };
    
    const result = DeckChecksum.calculateChecksum(deck2);
    expect(result).toEqual("aee18103072e8229be7b7689caafad5f609f9649718602d00ba62ed8258ada8c");

    const deck3 = {
        pool: {
            'leg (tw)': 1,
            'black ar (tw)': 1
        },
        playdeck: {
          'rada [h] (tw)': 4
        }
    };
    
    expect(DeckChecksum.calculateChecksum(deck3)).toEqual(result);

    deck3.pool["black ar (tw)"] = 5;
    expect(DeckChecksum.calculateChecksum(deck3)).not.toEqual(result);
});