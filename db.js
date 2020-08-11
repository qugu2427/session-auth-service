const config = require("./config")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const mailer = require("./mailer")
const { resolve } = require("path")
const { rejects } = require("assert")

mongoose.connect(config.dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
} )

const generateAuth = () => {
    return crypto.randomBytes(3).toString("hex")
}

const userSchema = new mongoose.Schema( {
    username: String,
    email: String,
    password: String,
    auth: { type: String, default: generateAuth },
    verified: { type: Boolean, default: false },
    created: { type: Date, default: Date.now }
} )

const User = mongoose.model("User", userSchema)

const usernameExists = (username) => {
    return new Promise( (resolve, reject) => {
        User.exists({ username }, (err, exists) => {
            err ? reject(err) : resolve(exists)
        } )
    } )
}

const emailExists = (email) => {
    return new Promise( (resolve, reject) => {
        User.exists({ email }, (err, exists) => {
            err ? reject(err) : resolve(exists)
        } )
    } )
}

const addUser = (username, email, password) => {
    return new Promise( (resolve, reject) => {
        bcrypt.hash(password, 12, (err, hash) => {
            if(err){ reject(err); return }
            let user = new User({ username, email, password: hash })
            user.save( (err, user) => {
                err ? reject(err) : resolve(user)
            })
        } )
    } )
}

const checkLogin = (username, password) => {
    return new Promise( (resolve, reject) => {
        User.findOne({ username }, (err, user) => {
            if(err){ reject(err); return }
            if(user == null){ resolve(false); return }
            bcrypt.compare(password, user.password, (err, match) => {
                if(err){ reject(err) }
                else if(match){ resolve(user._id) }
                else{ resolve(match) }
            } )
        } )
    } )
}

const getVerified = (id) => {
    return new Promise( (resolve, reject) => {
        User.findOne({ _id: id }, "verified", (err, verified) => {
            err ? reject(err) : resolve(verified.verified)
        } )
    } )
}

const sendVerificationEmail = (id) => {
    return new Promise( (resolve, reject) => {
        User.findOne({ _id: id }, (err, user) => {
            if(err){
                reject(err)
            }
            else{
                let link = `frontend.com/verify?username=${user.username}&auth=${user.auth}`
                mailer.sendEmail(user.email, "Verify your email", `Hey ${user.username}, click the link below to verify your email.
                    <br>${link}`)
            }
        } )
    } )
}

const verify = (id, auth) => {
    return new Promise( (resolve, reject) => {
        User.findOne({ _id: id }, (err, user) => {
            if(err){ reject(err) }
            if(!user.verified){
                if(user.auth == auth){
                    user.verified = true
                    user.save( (err, user) => {
                        err ? reject(err) : resolve(true)
                    } )
                }
                else{
                    resolve(false)
                }
            }
            else{
                resolve(true)
            }
        } )
    } )
}

module.exports = {
    usernameExists,
    emailExists,
    addUser,
    checkLogin,
    getVerified,
    sendVerificationEmail,
    verify
}