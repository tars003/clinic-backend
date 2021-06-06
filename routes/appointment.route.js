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

// CONFIRM PAYMENT STATUS OF APPOINTMENT
router.get('/confirm-appointment/:appointmentId', auth, async(req, res) => {
    try {
        const appointmentId = req.params.appointmentId
        const appointmentData = await Appointment.findById(appointmentId);
        var date = appointmentData.date;
        var isActive = false;
        // coupon validity
        if(appointmentData.coupon == 'NONE') {
            isActive = true;
        }
        else {
            const coupon = await Coupon.findById(appointmentData.coupon);
            isActive = coupon.isActive;
        }
        // checking if the appointment object in db actually exists
        if(appointmentData) {
            // checking if the coupon code is still active
            if(isActive) {
                const daySchedule = await Schedule.findById(appointmentData.date);
                const checkSlot = (slot) => {
                    return slot.slot == appointmentData.slot
                }
                const slotArr = daySchedule.slots.filter(checkSlot);
                // If the slot present in appointment object is acutally found in schedule
                if(slotArr.length > 0) {
                    var slotObj = slotArr[0];
                    // if the slot has already been booked
                    if(slotObj.booked) {
                        return res.status(400).json({
                            success: false,
                            message: 'Slot is already booked, initiating a refund'
                        })
                    }
                    // if the slot is okay and not boooked
                    else {
                        // updating appointment payment status to COMPLETE
                        var appointment = await Appointment.findById(appointmentId);
                        appointment['paymentStatus'] = 'COMPLETE';
                        appointment.overwrite(appointment);
                        appointment.save();

                        //  Updating day schedule for the slot to booked
                        var daySchedule1 = await Schedule.findById(date);
                        console.log(daySchedule)
                        const newSchedule = daySchedule1.slots.map((slot) => {
                            var newSlot = slot;
                            if(slot.slot == appointment.timeSlot) {
                                newSlot.booked = true;
                                return newSlot;
                            }
                            else {
                                return newSlot;
                            }
                        })
                        daySchedule1['slots'] = newSchedule
                        // console.log(daySchedule1);
                        daySchedule1.overwrite(daySchedule1);
                        daySchedule1.save();

                        return res.status(200).json({
                            success: true,
                            message: 'Appointment confirmed',
                            data: appointment
                        })
                    }
                }
                // slot present in appointment object not found in schedule to check availablity
                else {
                    return res.status(400).json({
                        success: false,
                        message: 'Time slot not valid'
                    })
                }
            }
            // coupon code expired on invalid
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon either expired or not valid'
                })
            }
        }
        // No appointment found for id in params
        else {
            return res.status(404).json({
                success: false,
                message: 'No appointment found'
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

// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.post('/get-invoice', auth, async(req, res) => {
    try {
        var appointmentData = req.body;
        // Getting first doctor from the collection
        var doctorData = await Doctor.find();
        doctorData = doctorData[0];
        appointmentData['patientId'] = req.body.data.id;
        appointmentData['docId'] = doctorData.id;
        // getting coupon object from db
        var coupon = await Coupon.findById(appointmentData.coupon);
        // if no coupon present in request
        if(!coupon) {
            coupon = {
                _id: 'NONE',
                isActive: true,
                percentOff : 100
            }
        }
        //  The coupon present should have isActuve true in db
        if(coupon.isActive) {
            const daySchedule = await Schedule.findById(appointmentData.date);
            //  Schedule for the date in request exists
            if(daySchedule) {
                const checkSlot = (slot) => {
                    return slot.slot == appointmentData.timeSlot
                }
                var slotArr = daySchedule.slots.filter(checkSlot);
                // Slots array does exist for the schedule of the date in request
                // Also checks that slot present in request does agree with the given day's schedule
                if(slotArr.length >= 1) {
                    var slotObj = slotArr[0]
                    // if the slot is already booked by another payment complete appointment
                    if(slotObj.booked) {
                        return res.status(400).json({
                            success: false,
                            message: 'Slot is already booked'
                        })
                    }
                    // if the slot is free and good to go
                    else {
                        // calculating fees based on the coupon object retrieved from db
                        const fee = doctorData.fee * (coupon.percentOff/100);
                        // saving the payment status INCOMPLETE in db
                        appointmentData['fees'] = fee.toString();
                        appointmentData['coupon'] = coupon;
                        delete appointmentData.data;
                        const appointment = await Appointment.create(appointmentData);

                        return res.status(200).json({
                            success: true,
                            data: {
                                id : appointment.id,
                                fees : appointment.fees
                            }
                        });
                    }
                }
                // no slot found in the given day's schedule as slot supplied in request
                else {
                    return res.status(400).json({
                        success: false,
                        message: 'Time slot not valid'
                    })
                }
            }
            // Schedule for the date in request does not exist
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Schedule not found for this date'
                })
            }
        } else {
            console.log('Coupon either expired or not valid');
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
