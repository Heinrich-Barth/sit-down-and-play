

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

    isSignedInDeckbuilder() {
        return true;
    }

    isSignedInMap() {
        return true;
    }

    getLoginPageData() {
        return "";
    }
}

module.exports = Authenticator;