const secrets = require("./secrets")

module.exports = {
    port: 8080,
    dbUri: secrets.dbUri,
    userRestrictions: {
        usernameMinLen: 6,
        usernameMaxLen: 30,
        emailMinLen: 3,
        emailMaxLen: 60,
        passwordMinLen: 11,
        passwordMaxLen: 60
    },
    regexes: {
        email: /\S+@\S+\.\S+/,
        alphanumeric: /^\w+$/
    },
    emailTransporterOptions: {
        service: "gmail",
        auth: secrets.emailAuth
    }
}