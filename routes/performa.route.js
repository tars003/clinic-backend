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
        if(patient.performa.length > 0){
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

// CREATE PERFORMA FOR PATIENT
router.post('/set', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        console.log(obj);

        var performaKeys = Object.keys(obj);
        performaKeys = performaKeys.filter(i => i != "data");


        // const {
        //     name,
        //     age,
        //     email,
        //     gender,
        //     phone
        // } = obj;

        return res.status(200).json({
            success: true,
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




module.exports = router;
