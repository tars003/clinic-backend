const { Router } = require('express');
const jwt = require('jsonwebtoken');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');

const auth = require('../middleware/auth');

// GET ALL APPOINTMENTS FOR A PATIENT
router.get('/get-appointments', auth, async (req, res) => {
    try {
        let patient = await Patient.findById(req.body.data.id);
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding auth token'
            });
        }

        const appointments = await Appointment.find({ patientId : patient.id });
        console.log(appointments);

        return res.status(200).json({
            success: true,
            length: appointments.length,
            data: appointments
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// INITIAL TOKEN ROUTE FOR PATIENT
router.get('/get-token/:phone', async (req, res) => {
    try {
        let patient = await Patient.findOne({ phone: req.params.phone });
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }
        const tokenPayload = {
            data: {
                id: patient.id
            }
        }
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
        console.log(`Requested token : ${token}`);
        return res.status(200).json({
            success: true,
            token,
            data: patient
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// CREATE ROUTE FOR PATIENT
router.post('/create', async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj)
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            age,
            email,
            gender,
            phone
        } = obj;

        const tempProfile = await Patient.findOne({ phone });
        console.log(tempProfile)
        if(tempProfile){
            return res.status(409).json({
                success: false,
                message: 'Patient profile already exists'
            })
        }
        else {
            const patient = await Patient.create({
                name,
                phone,
                email,
                gender,
                age
            });
            const payload = {
                data: {
                  id: patient.id,
                },
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            return res.status(201).json({
                success: true,
                data: patient,
                token
            })
        }

    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// UPDATE ROUTE FOR PATIENT
router.post('/update', auth, async (req, res) => {
        try {



    } catch(err) {
        console.log(err);
        return res.status(503).json({
            error: 'Server error',
            success: false,
        });
    }
});

// GET ROUTE FOR PATIENT
router.get('/get/:id', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        return res.status(200).json({
            success: true,
            data: patient
        })
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});



module.exports = router;
