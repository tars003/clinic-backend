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
const { sendSMS } = require('../util/sms');


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

router.get('/otp/patient-phone/:phone', async (req, res) => {
    try {
        const otp = getRandomInt();

        const reqCode = await sendSMS(
            req.params.phone,
            `Homeosure - OTP is ${otp}. Please Do Not Share this OTP with anyone. Regards, Dr. Chhavi Bansal`,
            process.env.smsDLTTemplateId1
        );

        if(reqCode.includes('-100')) {
            return res.status(200).json({
                success: true,
                data: {
                    otp: otp,
                }
            })
        }   
        else {
            return res.status(400).json({
                success: false,
                message: reqCode
            })
        }

        
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});


module.exports = router;
