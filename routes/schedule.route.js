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

const generateSlots = require('../util/GenerateSlots');

const getDate = () => {
    return moment()
};


// RETURN AVAILABLE SLOTS
router.get('/get-slots/:date', auth, async(req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.date);
        if(schedule) {
            console.log('Schedule exists')
            return res.status(200).json({
                success: true,
                data: schedule
            })
        }
        else {
            return res.status(200).json({
                success: true,
                data: {
                    "_id" : req.params.date,
                    "slots": []
                }
            })
        }
    } catch(err) {
        console.log(err);
        res.status(503).json({
            sucess: false,
            message: 'Server error'
        })
    }
})

// RETURN AVAILABLE SLOTS
router.get('/create-slots/:date/:slotId', auth, async(req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.date);
        if(schedule) {
            console.log('Schedule exists')
            return res.status(200).json({
                success: true,
                data: schedule
            })
        }
        else {
            console.log('Schedue does not exists, creating one now.')
            var doctorData = await Doctor.find();
            doctorData = doctorData[0];
            slotData = doctorData[req.params.slotId];
            console.log(doctorData);
            const slotsArr1 = generateSlots(
                slotData.startTime1,
                slotData.endTime1,
                slotData.consultationTime,
                slotData.gapTime,
                req.params.date
            );
            const slotsArr2 = generateSlots(
                slotData.startTime2,
                slotData.endTime2,
                slotData.consultationTime,
                slotData.gapTime,
                req.params.date
            );
            var slotsArr3;
            if (slotData.startTime3 && slotData.endTime3) {
                slotsArr3 = generateSlots(
                    slotData.startTime3,
                    slotData.endTime3,
                    slotData.consultationTime,
                    slotData.gapTime,
                    req.params.date
                );
            }

            var finalArr = slotsArr1.concat(slotsArr2)
            if(slotsArr3) finalArr = finalArr.concat(slotsArr3)

            const schedule = await Schedule.create({
                _id: req.params.date,
                date: req.params.date,
                slots : finalArr
            })
            console.log(schedule);
            return res.status(200).json({
                success: true,
                data: schedule
            })
        }
    } catch(err) {
        console.log(err);
        res.status(503).json({
            sucess: false,
            message: 'Server error'
        })
    }
})


// EDIT DOCTOR SLOT STRUCTURE
router.post('/edit-slot/:slotId', auth, async (req, res) => {
    try {

        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            consultationTime,
            gapTime,
            startTime1,
            endTime1,
            startTime2,
            endTime2,
            startTime3,
            endTime3
        } = obj;
        const slotId = req.params.slotId;

        let doctor = await Doctor.find();
        doctor = doctor[0];

        doctor[slotId] = obj;

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

// EDIT DOCTOR SLOT STRUCTURE
router.get('/get/slot-structure', auth, async (req, res) => {
    try {

        let doctor = await Doctor.find();
        doctor = doctor[0];
        return res.status(200).json({
            success: true,
            data: {
                slot1: doctor.slot1,
                slot2: doctor.slot2,
                slot3: doctor.slot3
            }
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
