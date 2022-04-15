
class SoundEffects {

    static INSTANCE = new SoundEffects();

    constructor()
    {
        this.effects = { };
        this.eventCount = 0;
        this.types = {
            "dice": "/media/client/game/sfx/dice-roll.mp3",
            "drawcard": "/media/client/game/sfx/card-draw.mp3",
            "shuffle": "/media/client/game/sfx/card-shuffle.mp3",
            "score": "/media/client/game/sfx/score.mp3",
            "discard": "",
            "launch": "",
            "endgame": "",
            "yourturn": ""

        };
        this.volume = 30;
        this.isReady = false;
        this.additionals = { };

        this.loadAdditionalSounds();
    }

    onLoadAdditionalSounds(data)
    {
        for (let key of Object.keys(data))
            this.registerStaticEffect(key, data[key]);
    }

    loadAdditionalSounds()
    {
        fetch("/media/personalisation/sounds/sounds.json").then((response) =>
        {
            if (response.status === 200)
                response.json().then((data) => SoundEffects.INSTANCE.onLoadAdditionalSounds(data));
        }).catch(() => { /** do nothing */});
    }

    registerStaticEffect(id, uri)
    {
        if (id !== undefined && id !== "" && uri !== undefined && uri !== "" && uri.indexOf("//") === -1)
            this.types[id] = uri;
    }

    requireId()
    {
        return "m" + (++this.eventCount);
    }

    playAudio(src)
    {
        if (src !== undefined && src !== "")
        {
            const audio = new Audio(src);
            audio.volume = this.volume / 100;
            audio.loop = false;
            audio.play();
        }
    }

    onSfx(e)
    {
        if (this.isReady && this.allowSfx() && e.detail !== undefined && this.types["" + e.detail] !== undefined)
            this.playAudio(this.types["" + e.detail]);
    }

    onSfxTest(e)
    {
        this.volume = e.detail;
        this.playAudio(this.types["drawcard"]);
    }

    allowSfx()
    {
        return typeof g_pGamesPreferences !== "undefined" && g_pGamesPreferences.allowSfx();
    }

    onReady()
    {
        this.isReady = true;
        document.body.addEventListener("meccg-sfx", this.onSfx.bind(this), false);
        document.body.addEventListener("meccg-sfx-test", this.onSfxTest.bind(this), false);
        this.playAudio(this.types["launch"]);
    }
}


document.body.addEventListener("meccg-sfx-ready", SoundEffects.INSTANCE.onReady.bind(SoundEffects.INSTANCE), false);


