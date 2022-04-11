
class SoundEffects {

    static INSTANCE = new SoundEffects();

    constructor()
    {
        this.effects = { };
        this.eventCount = 0;
        this.types = {
            "dice": "dice-roll.mp3",
            "drawcard": "card-draw.mp3",
            "shuffle": "card-shuffle.mp3",
            "score": "score.mp3"
        };
    }

    requireId()
    {
        return "m" + (++this.eventCount);
    }

    playAudio(src)
    {
        const audio = new Audio("/media/client/game/sfx/" + src);
        audio.volume = 0.02;
        audio.loop = false;
        audio.play();
        console.log("playing " + src)
    }

    onSfx(e)
    {
        if (this.allowSfx() && e.detail !== undefined && this.types["" + e.detail] !== undefined)
            this.playAudio(this.types["" + e.detail]);
    }

    allowSfx()
    {
        return typeof g_pGamesPreferences !== "undefined" && g_pGamesPreferences.allowSfx();
    }
}


document.body.addEventListener("meccg-sfx", SoundEffects.INSTANCE.onSfx.bind(SoundEffects.INSTANCE), false);

