const sgMail = require("@sendgrid/mail");



sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "divneet100singh@gmail.com",
        subject: "Thanks for Joining In",
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "divneet100singh@gmail.com",
        subject: "Sorry to see you go",
        text: `Goodbye, ${name}. I hope to see you back soon.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}