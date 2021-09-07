var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'contact@homeosure.com',
        pass: 'rnvfjhztdkkzagoa'
    }
});


const sendMail = (email, sub, text) => {
    var mailOptions = {
        from: 'contact@homeosure.com',
        to: email,
        subject: sub,
        text: text
    };
    console.log(mailOptions);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


module.exports = {sendMail}