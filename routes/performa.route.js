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

// CREATE PERFORMA STRUCTURE FOR A DOCTOR
router.post('/create', auth, async (req, res) => {
    try {
        var doctor = await Doctor.find();
        doctor = doctor[0];

        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        console.log(obj);

        var performaKeys = Object.keys(obj);
        performaKeys = performaKeys.filter(i => i != "data");
        performa = performaKeys.map(key => {
            let res = {};
            res['_id'] = key;
            res['description'] = obj[key];
            // res[`${key}`] = obj[key];
            return res;
        });

        console.log(performa)

        doctor['performa'] = performa;

        var newDoctor = await Doctor.find();
        newDoctor = newDoctor[0];

        newDoctor.overwrite(doctor);
        await newDoctor.save();

        return res.status(200).json({
            success: true,
            data: doctor
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET PERFORMA STRUCTURE OF A DOCTOR
router.get('/get-performa-struct', auth, async (req, res) => {
    try {
        var doctor = await Doctor.find();
        doctor = doctor[0];
        console.log(doctor);
        return res.status(200).json({
            success: true,
            data: doctor.performa
        })
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

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
        const patient = await Patient.findById(req.body.data.id);

        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        console.log(obj);

        var performaKeys = Object.keys(obj);
        performaKeys = performaKeys.filter(i => i != "data");
        performa = performaKeys.map(key => {
            let res = {};
            res['_id'] = key;
            res['value'] = obj[key];
            // res[`${key}`] = obj[key];
            return res;
        });

        console.log(performa)

        patient['performa'] = performa;

        const newPatient = await Patient.findById(req.body.data.id);
        newPatient.overwrite(patient);
        await newPatient.save();

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


// GET PATIENT'S PERFORMA
router.get('/get-performa', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.body.data.id);
        console.log(patient)
        if(patient.performa.length > 0){
            return res.status(200).json({
                success: true,
                data: {
                    performaExists: true,
                    performa: patient.performa
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



module.exports = router;
