const { Router } = require('express');
const jwt = require('jsonwebtoken');
const moment = require('moment');
var nodemailer = require('nodemailer');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');
const auth = require('../middleware/auth');
const generateSlots = require('../util/GenerateSlots');

const { sendMail } = require('../util/mail');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'contact@homeosure.com',
        pass: 'rnvfjhztdkkzagoa'
    }
});

function getRandomInt() {
    min = Math.ceil(111111);
    max = Math.floor(999999);
    return Math.floor(Math.random() * (max - min) + min);
}

router.get('/otp/patient-email/:email', async (req, res) => {
    try {
        // const patient = await Patient.findOne({ email: req.params.email });
        // console.log(patient);
        // let obj = patient;
        // obj['currOtp'] = getRandomInt();
        // await patient.overwrite(obj);
        // await patient.save();

        const otp = getRandomInt();

        sendMail(
            req.params.email,
            'OTP for logging in',
            `Dear customer your OTP to login is ${otp}`
        );

        return res.status(200).json({
            success: true,
            data: {
                otp: otp,
            }
        })
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});


module.exports = router;
