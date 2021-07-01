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



// ADD PROFILE
router.post('/add', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            age,
            gender
        } = obj;

        let patient = await Patient.findById(req.body.data.id);
        let profileArr = [];
        if(patient.profiles) profileArr = patient.profiles;

        profileArr.push({
            name,
            age,
            gender
        });
        patient['profiles'] = profileArr;
        console.log(patient);

        var newPatient = await Patient.findById(patient.id);
        newPatient.overwrite(patient);
        newPatient.save();

        return res.status(201).json({
            success: true,
            data: newPatient,
        })
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET ALL PROFILES
router.get('/get', auth, async (req, res) => {
    try {
        let patient = await Patient.findById(req.body.data.id);

        return res.status(201).json({
            success: true,
            count: patient.profiles.length + 1,
            data: [
                {
                    "_id": patient.id,
                    "name": patient.name,
                    "age": patient.age,
                    "gender": patient.gender
                },
                ...patient.profiles
            ],
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
