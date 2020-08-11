const nodemailer = require("nodemailer")
const config = require("./config")
const { resolve } = require("path")
const { rejects } = require("assert")

let transporter = nodemailer.createTransport(config.emailTransporterOptions)

module.exports.sendEmail = (to, subject, html) => {
    return new Promise( (resolve, reject) => {
        let options = {
            from: config.emailTransporterOptions.auth.user,
            to,
            subject,
            html
        }
    
        transporter.sendMail(options, (err, data) => {
            err ? reject(err) : resolve(data)
        } )
    } )
}