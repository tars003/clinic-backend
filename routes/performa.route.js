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

const auth = require('../middleware/auth');

// DOES PERFORMA EXISTS FOR A PATEINT
router.get('/get-status', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.body.data.id);
        console.log(patient)
        if(patient.performa){
            return res.status(200).json({
                success: true,
                data: {
                    performaExists: true
                }
            })
        }
        else {
            return res.status(200).json({
                success: true,
                data: {
                    performaExists: false
                }
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
