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

const getDate = () => {
    return moment()
}


// GET ALL APPOINTMENTS FOR A PATIENT
router.post('/edit', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            email,
            fee
        } = obj;

        let doctor = await Doctor.findById(req.body.data);
        if(!doctor){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }


        if (name) doctor['name'] = name;
        if (email) doctor['email'] = email;
        if (fee) doctor['fee'] = fee;

        let newDoctor = await Doctor.findById(doctor.id);
        newDoctor.overwrite(doctor);
        await newDoctor.save()


        return res.status(200).json({
            success: true,
            data: newDoctor
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

//  LOGIN ROUTE
router.get('/get-token/:phone', async (req, res) => {
    try {
        let doctor = await Doctor.findOne({ phone: req.params.phone });
        if(!doctor){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }
        const tokenPayload = {
            data: {
                id: doctor.id
            }
        }
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
        console.log(`Requested token : ${token}`);
        return res.status(200).json({
            success: true,
            token,
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

module.exports = router;
