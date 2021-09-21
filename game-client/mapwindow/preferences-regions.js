
class RegionMapPreferences extends Preferences {

    constructor()
    {
        super();
        this.balrog = "true";
        this.dragon = "true";
        this.dwarf = "true";
        this.elf = "true";
        this.fallenlord = "true";
        this.fallenwizard = "true";
        this.hero = "true";
        this.lord = "true";
        this.minion = "true";
    }
    
    init(data)
    {
        this.balrog = "" + data.balrog;
        this.dragon = "" + data.dragon;
        this.dwarf = "" + data.dwarf;
        this.elf = "" + data.elf;
        this.fallenlord = "" + data.fallenlord;
        this.fallenwizard = "" + data.fallenwizard;
        this.hero = "" + data.hero;
        this.lord = "" + data.lord;
        this.minion = "" + data.minion;

        super.init();
    }

    getGameCss()
    {
        return "config-wrapper-map";
    }

    getEntries()
    {
        this.createSection("Standard Sites");
        this.createEntry0("show_hero");
        this.createEntry0("show_minion");
        this.createEntry0("show_fallenwizard");
        this.createEntry0("show_balrog");

        this.createSection("FirstBorn Sites");
        this.createEntry0("show_elf");
        this.createEntry0("show_dwarf");

        this.createSection("Other Sites");
        this.createEntry0("show_lord");
        this.createEntry0("show_fallenlord");
        this.createEntry0("show_dragon");
    }

    getCookieUpdateUrl()
    {
        return "/data/preferences/map";
    }

    toggleHero(isActive)
    {
        this.hero = isActive;
        this.updateCookie("hero", isActive);
    }

    toggleMinion(isActive)
    {
        this.minion = isActive;
        this.updateCookie("minion", isActive);
    }

    toggleFallenWizard(isActive)
    {
        this.fallenwizard = isActive;
        this.updateCookie("fallenwizard", isActive);
    }

    toggleBalrog(isActive)
    {
        this.balrog = isActive;
        this.updateCookie("balrog", isActive);
    }
    toggleElf(isActive)
    {
        this.elf = isActive;
        this.updateCookie("elf", isActive);
    }
    toggleDwarf(isActive)
    {
        this.dwarf = isActive;
        this.updateCookie("dwarf", isActive);
    }
    toggleLord(isActive)
    {
        this.lord = isActive;
        this.updateCookie("lord", isActive);
    }
    toggleFallenlord(isActive)
    {
        this.fallenlord = isActive;
        this.updateCookie("fallenlord", isActive);
    }
    toggleDragon(isActive)
    {
        this.dragon = isActive;
        this.updateCookie("dragon", isActive);
    }
    isTrue(sVal)
    {
        return sVal === "true" || sVal === true;
    }

    addConfiguration()
    {

        this.addConfigToggle("show_hero", "Hero", this.isTrue(this.hero), this.toggleHero.bind(this));
        this.addConfigToggle("show_minion", "Minion", this.isTrue(this.minion), this.toggleMinion.bind(this));
        this.addConfigToggle("show_fallenwizard", "Fallen Wizard (Heavens)", this.isTrue(this.fallenwizard), this.toggleFallenWizard.bind(this));
        this.addConfigToggle("show_balrog", "Balrog", this.isTrue(this.balrog), this.toggleBalrog.bind(this));

        this.addConfigToggle("show_elf", "Elf Lords (Heavens)", this.isTrue(this.elf), this.toggleElf.bind(this));
        this.addConfigToggle("show_dwarf", "Dwarf Lords (Heavens)", this.isTrue(this.dwarf), this.toggleDwarf.bind(this));

        this.addConfigToggle("show_lord", "Lord", this.isTrue(this.lord), this.toggleLord.bind(this));
        this.addConfigToggle("show_fallenlord", "Fallen/Lord", this.isTrue(this.fallenlord), this.toggleFallenlord.bind(this));
        this.addConfigToggle("show_dragon", "Dragon Lords", this.isTrue(this.dragon), this.toggleDragon.bind(this));
    }

    showSite(sAlignment)
    {
        switch(sAlignment)
        {
            case "hero":
                return this.isTrue(this.hero);
            case "minion":
                return this.isTrue(this.minion);
            case "fallenwizard":
                return this.isTrue(this.fallenwizard);
            case "balrog":
                return this.isTrue(this.balrog)
            case "elf":
            case "elflord":
                return this.isTrue(this.elf);
            case "dwarf":
            case "dwarflord":
                return this.isTrue(this.dwarf);
            case "lord":
            case "atanilord":
            case "grey":
            case "warlord":
                return this.isTrue(this.lord);
            case "fallenlord":
                return this.isTrue(this.fallenlord);
            case "dragon":
            case "dragonlord":
                return this.isTrue(this.dragon);
            default:
                console.log("Unknown site alignment " + sAlignment);
                break;
        }
        return true;
    }    
};

const g_pRegionMapPreferences = new RegionMapPreferences();

(function() { 
    
    fetch("/data/preferences/map").then((response) => response.json().then((data) => g_pRegionMapPreferences.init(data))).catch(() => new RegionMapPreferences(null).init());

})();

