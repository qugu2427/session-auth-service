module.exports = {
    errors: {
        undefinedBodyParams: { name: "UndefinedBodyParams", status: 400 },
        invalidCaptcha: { name: "InvalidCaptcha", status: 400 },
        restrictionsNotMet: { name: "RestrictionsNotMet", status: 400 },
        usernameExists: { name: "UsernameExists", status: 400 },
        emailExists: { name: "EmailExists", status: 400 },
        invalidLogin: { name: "InvalidLogin", status: 401 },
        alreadyLoggedIn: { name: "AlreadyLoggedIn", status: 403 },
        notLoggedIn: { name: "NotLoggedIn", status: 401 },
        unverifiedEmail: { name: "UnverifiedEmail", status: 403 },
        alreadyVerified: { name: "AlreadyVerified", status: 400 },
        invalidAuth: { name: "InvalidAuth", status: 401 },
        unknownEndpoint: { name: "UnknownEndpoint", status: 404 }
    },
    handleError: (err, req, res, next) => {
        try{
            res.status(err.status).send(err.name)
        }
        catch(error){
            res.status(500).send("UnknownError")
            console.log(`UNKNOWN ERROR:\n${err.stack}`)
        }
    }
}