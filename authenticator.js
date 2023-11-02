

class Authenticator {

    signIn() {
        return true;
    }

    isSignedInPlay() {
        return true;
    }

    isSignedInCards() {
        return true;
    }

    isSignedIn()
    {
        return true;
    }

    isSignedInDeckbuilder() {
        return true;
    }

    isSignedInMap() {
        return true;
    }

    getLoginPageData() {
        return "";
    }

    signInFromPWA()
    {
        /** do nothing */
    }

    isSignedInPWA()
    {
        return false;
    }
}

module.exports = Authenticator;