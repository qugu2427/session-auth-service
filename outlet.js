const config = require("./config")
const express =  require("express")
const svgCaptcha = require("svg-captcha")
const errorHandler = require("./errorHandler")
const session = require("express-session")
const bodyParser = require("body-parser")
const db = require("./db")
const MongoDBStore = require("connect-mongodb-session")(session)
const { nextTick } = require("process")
const { errors } = require("./errorHandler")

const app = express()
const store = new MongoDBStore( {
    uri: config.dbUri,
    collection: "sessions"
} )
store.on("error", (err) => {
    next(err)
} )
app.use( session( {
    secret: "test secret", //todo change secret
    store,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
} ) )
const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get("/captcha", (req, res, next) => {
    try{
        let captcha = svgCaptcha.create( { size: Math.floor(Math.random() * (4)) + 5, noise: Math.floor(Math.random() * (4)) + 5 } )
        req.session.captcha = captcha.text
        res.type("svg")
        res.status(200).send(captcha.data)
    }
    catch(err){
        next(err)
    }
} )

app.post("/register", urlencodedParser, async (req, res, next) => {
    try{
        if(req.session.userId != null || req.session.ip != null){ throw errors.alreadyLoggedIn }
        if(req.body.username == null || req.body.email == null || req.body.password == null || req.body.captcha == null){ throw errors.undefinedBodyParams }
        if(req.session.captcha == null || req.body.captcha != req.session.captcha){ req.session.captcha = undefined; throw errors.invalidCaptcha }
        let valid = req.body.username.length >= config.userRestrictions.usernameMinLen &&
            req.body.username.length <= config.userRestrictions.usernameMaxLen &&
            config.regexes.alphanumeric.test(req.body.username) &&
            req.body.email.length >= config.userRestrictions.emailMinLen &&
            req.body.email.length <= config.userRestrictions.emailMaxLen &&
            config.regexes.email.test(req.body.email) &&
            req.body.password.length >= config.userRestrictions.passwordMinLen &&
            req.body.password.length <= config.userRestrictions.passwordMaxLen
        if(!valid){ throw errors.restrictionsNotMet }
        let usernameExists = await db.usernameExists(req.body.username)
        if(usernameExists){ throw errors.usernameExists }
        let emailExists = await db.emailExists(req.body.email)
        if(emailExists){ throw errors.emailExists }
        req.session.captcha = undefined
        let user = await db.addUser(req.body.username, req.body.email, req.body.password)
        res.status(201).send(user)
    }
    catch(err){
        next(err)
    }
} )

app.post("/login", urlencodedParser, async (req, res, next) => {
    try{
        if(req.session.userId != null || req.session.ip != null){ throw errors.alreadyLoggedIn }
        if(req.body.username == null || req.body.password == null){ throw errors.undefinedBodyParams }
        let userId = await db.checkLogin(req.body.username, req.body.password)
        if(!userId){ throw errors.invalidLogin }
        req.session.userId = userId
        req.session.ip = req.ip
        res.status(200).send()
    }
    catch(err){
        next(err)
    }
} )

app.get("/logout", (req, res) => {
    req.session.destroy()
    res.status(200).send()
} )

app.post("/verify", urlencodedParser, async (req, res, next) => {
    try{
        if(req.session.userId == null || req.session.ip == null){ throw errors.notLoggedIn }
        if(req.body.auth == null){ throw errors.undefinedBodyParams }
        let verified = await db.verify(req.session.userId, req.body.auth)
        if(!verified){ throw errors.invalidAuth }
        res.status(200).send("verified")
    }
    catch(err){
        next(err)
    }
} )

app.get("/sendVerificationEmail", async (req, res, next) => {
    try{
        if(req.session.userId == null || req.session.ip == null){ throw errors.notLoggedIn }
        let verified = await db.getVerified(req.session.userId)
        if(verified){ throw errors.alreadyVerified }
        db.sendVerificationEmail(req.session.userId)
        res.status(200).send()
    }
    catch(err){
        next(err)
    }
} )

app.use( (req, res, next) => {
    next(errors.unknownEndpoint)
} )

app.use(errorHandler.handleError)

app.listen(config.port, () => {
    console.log(`Listening to port ${config.port}...`)
} )