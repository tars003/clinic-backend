const { Router } = require('express');
const jwt = require('jsonwebtoken');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Slot = require('../models/Slot.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');
const auth = require('../middleware/auth');

const generateSlots = require('../util/GenerateSlots');

// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.post('/get-invoice', auth, async(req, res) => {
    try {
        var appointmentData = req.body;
        const doctorData = await Doctor.find();
        doctorData = doctorData[0];
        const coupon = await Coupon.findById(appointmentData.coupon);
        if(coupon.isActive) {
            const daySchedule = await Schedule.findById(appointmentData.date);

            const checkSlot = (slot) => {
                return slot.slot == appointmentData.slot
            }
            const slotObj = daySchedule.slots.filter(checkSlot);

            if(slotObj.booked) {
                return res.status(400).json({
                    success: false,
                    message: 'Slot is already booked'
                })
            }
            else {
                const fee = doctorData.fee * (coupon.percentOff/100);
                appointmentData['fee'] = fee;
                const appointment = await Appointment.create(appointmentData);
                return res.status(200).json({
                    success: true,
                    data: appointment
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Coupon either expired or not valid'
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
            console.log('Schedue does not exists, creating one now.')
            var doctorData = await Doctor.find();
            doctorData = doctorData[0];
            slotData = doctorData.slot;
            console.log(doctorData);
            const slotsArr = generateSlots(
                slotData.startTime,
                slotData.endTime,
                slotData.consultationTime,
                slotData.gapTime,
                req.params.date
            );
            const schedule = await Schedule.create({
                _id: req.params.date,
                date: req.params.date,
                slots : slotsArr
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

module.exports = router;
