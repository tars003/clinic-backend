const { Router } = require('express');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');
const Package = require('../models/Package.model');
const Chat = require('../models/Chat.model');

const auth = require('../middleware/auth');

// NEW MESSAGE
router.post('/add/message/:patientId', auth, async (req, res) => {
    try {
        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            sentTime,
            text,
            isSenderPatient,
            appointmentId
        } = obj;

        let patient = await Patient.findById(req.params.patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding id in route'
            });
        };

        let chat = await Chat.findById(patient.id);
        if(!chat) {
            chat = await Chat.create({
                _id: patient.id,
                patientName: patient.name,
                patientGender: patient.gender
            })
        }
        let tempObj = {
            sentTime: `${moment().format('DD-MM-YYYY HH:mm:ss')}`,
            text: text,
            isSenderPatient : isSenderPatient
        }
        if(appointmentId) tempObj['appointmentId'] = appointmentId;
        chat.messages.push(tempObj);
        if(isSenderPatient) chat['isReadDoctor'] = false;
        else chat['isReadPatient'] = false;
        console.log('chat', chat);
        await chat.save();
        
        return res.status(200).json({
            success: true,
            data: chat,
        })

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET MESSAGES PATIENT
router.get('/get/chat/:patientId', auth, async (req, res) => {
    try {
        
        let chat = await Chat.findById(req.params.patientId);
        if(!chat) {
            return res.status(200).json({
                success: false,
                message: 'No chat found for patient id in route'
            });
        }

        return res.status(200).json({
            success: true,
            data: chat,
        });

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET MESSAGES DOCTOR
router.get('/get/chats', auth, async (req, res) => {
    try {
        
        let chats = await Chat.find();

        return res.status(200).json({
            success: true,
            data: chats,
        });

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET MESSAGES PATIENT
router.post('/change/status/:patientId', auth, async (req, res) => {
    try {

        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            isPatient,
        } = obj;

        let chat = await Chat.findById(req.params.patientId);
        if(!chat) {
            return res.status(400).json({
                success: false,
                message: 'No chat found for patient id in route'
            });
        }

        if(isPatient) chat['isReadPatient'] = true;
        else chat['isReadDoctor'] = true;

        console.log('chat', chat);

        await chat.save();

        return res.status(200).json({
            success: true,
            data: chat,
        });

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});



module.exports = router;