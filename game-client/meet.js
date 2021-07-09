
function isAlphaNumeric(sInput)
{
    return sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
}

function getRoomFromUrl()
{
    let sString = window.location.search;
    let nPos = sString.indexOf("=");

    sString = nPos === -1 ? "" : sString.substring(nPos + 1).trim();
    if (!isAlphaNumeric(sString) || sString === "default")
        return "";
    else
        return sString; 
}

function getRoomName()
{
    let sString = getRoomFromUrl();
    return sString === "" || sString === "default" ? 'MECCG_GAME_ROOM' : 'MECCG_GAME_ROOM_' + sString;
}

let g_sRoomName = getRoomName();
const api = new JitsiMeetExternalAPI('meet.jit.si', {
    roomName: g_sRoomName,
    width: 500,
    height: 500,
    disableProfile: true,
    
    configOverwrite : {
        startWithVideoMuted: true,
        startWithAudioMuted: false,
        resolution:240,
        enableWelcomePage: false,    
        enableNoisyMicDetection: false,
        startAudioOnly: true,
        hideLobbyButton: true,
        requireDisplayName: false,
        disableProfile: true,
        prejoinPageEnabled: false
    },

    interfaceConfigOverwrite: {

        DISABLE_VIDEO_BACKGROUND: true,
        DISPLAY_WELCOME_FOOTER: true,

        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        HIDE_DEEP_LINKING_LOGO: true,
        DISABLE_PRESENCE_STATUS: true,
        MOBILE_APP_PROMO: false,
        RECENT_LIST_ENABLED: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        HIDE_INVITE_MORE_HEADER: true,
    },
    userInfo: {
        displayName: 'Player'
    },
    parentNode: document.querySelector('#meet')
});

window.onbeforeunload = function() { api.dispose(); };
