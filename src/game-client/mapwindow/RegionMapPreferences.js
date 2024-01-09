
class RegionMapPreferences extends Preferences {

    updateCookie(key, isActive)
    {
        super.updateCookie(key, isActive === true);
    }

    getLocalStorageKey()
    {
        return "meccg_map_settings";
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
        this.createEntry0("show_balrog");
        this.createEntry0("show_dreamcards");

        this.createSection("Fallen Wizard / Lord Specific Sites");
        this.createEntry0("show_fallenwizard");
        this.createEntry0("show_elf");
        this.createEntry0("show_dwarf");

        this.createSection("Shared Fallen Wizard / Lords Sites");
        this.createEntry0("show_fallenlord");
        this.createEntry0("show_lord");

        this.createSection("Other Sites");
        this.createEntry0("show_dragon");

        this.createSection("Show Standard Sites");
        this.createEntry0("show_set_METW");
        this.createEntry0("show_set_METD");
        this.createEntry0("show_set_MEDM");
        this.createEntry0("show_set_MELE");
        this.createEntry0("show_set_MEAS");
        this.createEntry0("show_set_MEWH");
        this.createEntry0("show_set_MEBA");

        this.createSection("Show Dreamcard Sites");
        this.createEntry0("show_set_MEFB");
        this.createEntry0("show_set_MEDF");
        this.createEntry0("show_set_MENE");
        this.createEntry0("show_set_MEML");
        this.createEntry0("show_set_MENW");

        this.createSection("Show Other Non-Released Sites");
        this.createEntry0("show_set_Others");

        this.createSection("Map Settinge");
        this.createEntry0("show_site_marker");
    }

    toggleHero(isActive)
    {
        this.updateCookie("hero", isActive);
    }

    toggleMinion(isActive)
    {
        this.updateCookie("minion", isActive);
    }

    toggleFallenWizard(isActive)
    {
        this.updateCookie("fallenwizard", isActive);
    }

    toggleBalrog(isActive)
    {
        this.updateCookie("balrog", isActive);
    }
    toggleDreamcards(isActive)
    {
        this.updateCookie("dreamcards", isActive);
    }
    toggleElf(isActive)
    {
        this.updateCookie("elf", isActive);
    }
    toggleDwarf(isActive)
    {
        this.updateCookie("dwarf", isActive);
    }
    toggleLord(isActive)
    {
        this.updateCookie("lord", isActive);
    }
    toggleFallenlord(isActive)
    {
        this.updateCookie("fallenlord", isActive);
    }
    toggleDragon(isActive)
    {
        this.updateCookie("dragon", isActive);
    }
    toggleSet_METW(isActive)
    {
        this.updateCookie("METW", isActive);
    }
    toggleSet_METD(isActive)
    {
        this.updateCookie("METD", isActive);
    }
    toggleSet_MEDM(isActive)
    {
        this.updateCookie("MEDM", isActive);
    }
    toggleSet_MELE(isActive)
    {
        this.updateCookie("MELE", isActive);
    }
    toggleSet_MEAS(isActive)
    {
        this.updateCookie("MEAS", isActive);
    }
    toggleSet_MEWH(isActive)
    {
        this.updateCookie("MEWH", isActive);
    }
    toggleSet_MEBA(isActive)
    {
        this.updateCookie("MEBA", isActive);
    }
    toggleSet_MEFB(isActive)
    {
        this.updateCookie("MEFB", isActive);
    }
    toggleSet_MEDF(isActive)
    {
        this.updateCookie("MEDF", isActive);
    }
    toggleSet_MENE(isActive)
    {
        this.updateCookie("MENE", isActive);
    }
    toggleSet_MEML(isActive)
    {
        this.updateCookie("MEML", isActive);
    }
    toggleSet_MENW(isActive)
    {
        this.updateCookie("MENW", isActive);
    }
    toggleSet_Others(isActive)
    {
        this.updateCookie("Others", isActive);
    }

    isTrue(key)
    {
        return this.data[key] !== false;
    }

    getSettingsName()
    {
        return "Map settings";
    }

    addConfiguration()
    {
        this.addConfigToggle("show_hero", "Hero", this.isTrue("hero"), this.toggleHero.bind(this));
        this.addConfigToggle("show_minion", "Minion", this.isTrue("minion"), this.toggleMinion.bind(this));
        this.addConfigToggle("show_fallenwizard", "Fallen Wizard (Heavens)", this.isTrue("fallenwizard"), this.toggleFallenWizard.bind(this));
        this.addConfigToggle("show_balrog", "Balrog", this.isTrue("balrog"), this.toggleBalrog.bind(this));
        this.addConfigToggle("show_dreamcards", "Show Dreamcards", this.isTrue("dreamcards"), this.toggleDreamcards.bind(this));
        this.addConfigToggle("show_lord", "Shared Lord Sites (Elves, Dwarfs, ...)", this.isTrue("lord"), this.toggleLord.bind(this));
        this.addConfigToggle("show_fallenlord", "Shared Fallen Wizard and Lord Sites", this.isTrue("fallenlord"), this.toggleFallenlord.bind(this));
        
        this.addConfigToggle("show_elf", "Elf Lords (Heavens)", this.isTrue("elf"), this.toggleElf.bind(this));
        this.addConfigToggle("show_dwarf", "Dwarf Lords (Heavens)", this.isTrue("dwarf"), this.toggleDwarf.bind(this));
        
        this.addConfigToggle("show_dragon", "Dragon Lords", this.isTrue("dragon"), this.toggleDragon.bind(this));
        
        this.addConfigToggle("show_set_METW", "The Wizards", this.isTrue("METW"), this.toggleSet_METW.bind(this));
        this.addConfigToggle("show_set_METD", "The Dragons", this.isTrue("METD"), this.toggleSet_METD.bind(this));
        this.addConfigToggle("show_set_MEDM", "Dark Minions", this.isTrue("MEDM"), this.toggleSet_MEDM.bind(this));
        this.addConfigToggle("show_set_MELE", "The Lidless Eye", this.isTrue("MELE"), this.toggleSet_MELE.bind(this));
        this.addConfigToggle("show_set_MEAS", "Against the Shadow", this.isTrue("MEAS"), this.toggleSet_MEAS.bind(this));
        this.addConfigToggle("show_set_MEWH", "The White Hand", this.isTrue("MEWH"), this.toggleSet_MEWH.bind(this));
        this.addConfigToggle("show_set_MEBA", "The Balrog", this.isTrue("MEBA"), this.toggleSet_MEBA.bind(this));
        this.addConfigToggle("show_set_MEFB", "Firstborn", this.isTrue("MEFB"), this.toggleSet_MEFB.bind(this));
        this.addConfigToggle("show_set_MEDF", "Durin's Folk", this.isTrue("MEDF"), this.toggleSet_MEDF.bind(this));
        this.addConfigToggle("show_set_MENE", "The Necromancer", this.isTrue("MENE"), this.toggleSet_MENE.bind(this));
        this.addConfigToggle("show_set_MEML", "Morgoth's Legacy", this.isTrue("MEML"), this.toggleSet_MEML.bind(this));
        this.addConfigToggle("show_set_MENW", "The Northern Waste", this.isTrue("MENW"), this.toggleSet_MENW.bind(this));
        this.addConfigToggle("show_set_Others", "Other sets", this.isTrue("Others"), this.toggleSet_Others.bind(this));
        this.addConfigToggle("show_site_marker", "Show site marker in selected region", this.#showSiteMarker(), this.#toggleSiteMarker.bind(this));
    }

    #showSiteMarker()
    {
        return sessionStorage.getItem("hide_sitemarker") === null;
    }

    #toggleSiteMarker(isActive)
    {
        if (isActive)
        {
            if (sessionStorage.getItem("hide_sitemarker") !== null)
                sessionStorage.removeItem("hide_sitemarker");
        }
        else
            sessionStorage.setItem("hide_sitemarker", "true");
    }

    showDreamcards()
    {
        return this.isTrue(this.dreamcards);
    }

    showSiteSet(sSet)
    {
        switch(sSet)
        {
            case "MEBO":
            case "MESL": 
            case "MEBU": 
            case "MEDS": 
            case "MECP": 
            case "MEGW": 
            case "MECA": 
            case "MEWR": 
            case "METI": 
            case "MEKN": 
            case "MERS": 
                return this.isTrue("Others");

            default:
                return this.isTrue(sSet);
        }
    }

    showSite(sAlignment)
    {
        switch(sAlignment)
        {
            case "dual":
                return this.isTrue("hero") || this.isTrue("minion");
            case "dwarf":
            case "dwarflord":
                return this.isTrue("dwarf");
            case "hero":
                return this.isTrue("hero");
            case "minion":
                return this.isTrue("minion");
            case "fallenwizard":
                return this.isTrue("fallenwizard");
            case "balrog":
                return this.isTrue("balrog")
            case "elf":
            case "elflord":
                return this.isTrue("elf");
            case "lord":
            case "atanilord":
            case "grey":
            case "warlord":
                return this.isTrue("lord");
            case "fallenlord":
                return this.isTrue("fallenlord");
            case "dragon":
            case "dragonlord":
                return this.isTrue("dragon");
            default:
                console.warn("Unknown site alignment " + sAlignment);
                break;
        }
        return true;
    }    
}

const g_pRegionMapPreferences = new RegionMapPreferences();
g_pRegionMapPreferences.init();
