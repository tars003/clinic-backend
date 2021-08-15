const { Router } = require('express');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');
const auth = require('../middleware/auth');

const generateSlots = require('../util/GenerateSlots');

const getDate = () => {
    return moment()
};

const cancelTime = 720;
const rescheduleTime = 240;

const getAppTime = (date, slot) => {
    const startTime = slot.split(' - ')[0];
    let appointmentTime = moment(
        `${date} ${startTime}`,
        'DD-MM-YYYY HH:mm'
    );
    return appointmentTime;
}

// GET ALL PAST APPOINTMENTS FOR A PATIENT
router.get('/get/past-appointments/:id', auth, async(req, res) => {
    try {
        let patient = await Patient.findById(req.params.id);
        // console.log(patient)
        let appointments = await Appointment.find({ patientId: patient.id })

        if(patient){
            return res.status(200).json({
                success: true,
                length: appointments.length,
                data: appointments
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'patient not found'
            });
        }
    } catch (err){
        console.log(err);
        res.status(503).json({
            sucess: false,
            message: 'Server error'
        })
    }
})


// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.post('/reschedule', auth, async(req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            appointmentId,
            newDate,
            newSlot
        } = obj;

        var oldDate = '';
        var oldSlot = '';

        const daySchedule = await Schedule.findById(newDate);
        //  Schedule for the date in request exists
        if(daySchedule) {
            const checkSlot = (slot) => {
                return slot.slot == newSlot
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
                    // CREATING APPOINTMENT
                    // saving the payment status INCOMPLETE in db
                    let appointment = await Appointment.findById(appointmentId);
                    if(!appointment){
                        return res.stats(400).json({
                            success: false,
                            message: 'appointment Id invalid'
                        })
                    };

                    // CHECKING IF APPOINTMENT IS RESCHEDULABLE
                    let currDate = getDate();
                    let appointmentTime = getAppTime(appointment.date, appointment.timeSlot);
                    const diffMins = appointmentTime.diff(currDate, 'minutes');
                    console.log(diffMins);
                    console.log(appointmentTime.format('DD-MM-YYYY HH:mm'));
                    console.log(currDate.format('DD-MM-YYYY HH:mm'));
                    if(diffMins < rescheduleTime){
                        return res.status(400).json({
                            success: false,
                            message: 'time period for reschedule is closed'
                        })
                    }

                    oldDate = appointment.date;
                    oldSlot = appointment.timeSlot;
                    appointment['date'] = newDate;
                    appointment['timeSlot'] = newSlot;
                    // console.log('appointment');
                    // console.log(appointment);

                    let newAppointment = await Appointment.findById(appointmentId);
                    newAppointment.overwrite(appointment);
                    // console.log('newAppointment');
                    // console.log(newAppointment);
                    newAppointment.save();

                    //  Updating day schedule for the slot to booked
                    var daySchedule1 = await Schedule.findById(newDate);
                    const newSchedule = daySchedule1.slots.map((slot) => {
                        var newSlot1 = slot;
                        if(slot.slot == newSlot) {
                            newSlot1.booked = true;
                            return newSlot1;
                        }
                        else {
                            return newSlot1;
                        }
                    })
                    daySchedule1['slots'] = newSchedule;
                    daySchedule1.overwrite(daySchedule1);
                    // console.log('newSchedule');
                    // console.log(daySchedule1);
                    daySchedule1.save();

                    //  DELETING OLD SCHEDULE ENTRY
                    var daySchedule2 = await Schedule.findById(oldDate);
                    const newSchedule2 = daySchedule2.slots.map((slot) => {
                        var oldSlot1 = slot;
                        if(slot.slot == oldSlot) {
                            oldSlot1.booked = false;
                            return oldSlot1;
                        }
                        else {
                            return oldSlot1;
                        }
                    })
                    daySchedule2['slots'] = newSchedule2
                    daySchedule2.overwrite(daySchedule2);
                    // console.log('oldSchedule');
                    // console.log(daySchedule2);
                    daySchedule2.save();



                    return res.status(200).json({
                        success: true,
                        data: newAppointment
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
    } catch(err) {
        console.log(err);
        res.status(503).json({
            sucess: false,
            message: 'Server error'
        })
    }
})

// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.get('/cancel/:appointmentId', auth, async(req, res) => {
    try {

        // CREATING APPOINTMENT
        // saving the payment status INCOMPLETE in db
        let appointment = await Appointment.findById(req.params.appointmentId);
        if(!appointment){
            return res.status(400).json({
                success: false,
                message: 'appointment Id invalid'
            })
        };

        // CHECKING IF APPOINTMENT IS RESCHEDULABLE
        let currDate = getDate();
        let appointmentTime = getAppTime(appointment.date, appointment.timeSlot);
        const diffMins = appointmentTime.diff(currDate, 'minutes');
        console.log(diffMins);
        console.log(appointmentTime.format('DD-MM-YYYY HH:mm'));
        console.log(currDate.format('DD-MM-YYYY HH:mm'));
        if(diffMins < cancelTime){
            return res.status(400).json({
                success: false,
                message: 'time period for cancellation is closed'
            })
        }


        let newAppointment = await Appointment.findByIdAndRemove(req.params.    appointmentId);


        //  Updating day schedule for the slot to booked
        var daySchedule1 = await Schedule.findById(appointment.date);
        const newSchedule = daySchedule1.slots.map((slot) => {
            var newSlot1 = slot;
            if(slot.slot == appointment.timeSlot) {
                newSlot1.booked = false;
                return newSlot1;
            }
            else {
                return newSlot1;
            }
        })
        daySchedule1['slots'] = newSchedule;
        daySchedule1.overwrite(daySchedule1);
        // console.log(daySchedule1);
        daySchedule1.save();

        return res.status(200).json({
            success: true,
            data: newAppointment
        });
    } catch(err) {
        console.log(err);
        res.status(503).json({
            sucess: false,
            message: 'Server error'
        })
    }
})



// GET ALL APPOINTMENTS FOR A PATIENT
router.get('/get-appointments/:date', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ date : req.params.date });
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
                    return slot.slot == appointmentData.timeSlot
                }
                const slotArr = daySchedule.slots.filter(checkSlot);
                // console.log(slotArr);
                // If the slot present in appointment object is acutally found in schedule
                if(slotArr.length > 0) {
                    var slotObj = slotArr[0];
                    // if the slot has already been booked
                    if(false) {
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
                        var newAppointment = await Appointment.findById(appointmentId);
                        newAppointment.overwrite(appointment);
                        await newAppointment.save();
                        return res.status(200).json({
                            success: true,
                            message: 'Appointment confirmed',
                            data: newAppointment
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
        console.log('appointmentData');
        console.log(appointmentData);
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
                        // PACKAGE CONSULTATIONS UTILIZATION
                        const patient = await Patient.findById(req.body.data.id);
                        // calculating fees based on the coupon object retrieved from db
                        var fee = doctorData.fee * (coupon.percentOff/100);

                        var info = {};
                        console.log(req.body);
                        if(req.body['info']) {


                            if(req.body['info']['id'] == patient.id) {
                                info = {
                                    _id: patient.id,
                                    name: patient.name,
                                    age: patient.age,
                                    gender: patient.gender,
                                    phone: patient.phone
                                }
                                // If package exists
                                if(patient.package){
                                    console.log(patient.package);
                                    var consultations = patient.package.consultationsLeft;
                                    // If his current package has some consultations left
                                    if(consultations > 0){
                                        console.log('inside consultations 0')
                                        fee = 0;
                                        patient.package.consultationsLeft = consultations - 1;
                                        console.log(patient);
                                        const newPatient = await Patient.findById(patient.id);
                                        newPatient.overwrite(patient);
                                        newPatient.save();
                                    }
                                }
                            }
                            else {
                                info = {
                                    _id: req.body['info']['id'],
                                    name: req.body['info']['name'],
                                    age: req.body['info']['age'],
                                    gender: req.body['info']['gender'],
                                    phone: patient.phone
                                };
                                const profile = patient.profiles.filter((profile) => profile.id ==req.body['info']['id'])[0];
                                console.log('profile');
                                console.log(profile);

                                if(profile.package){
                                    console.log(profile.package);
                                    var consultations = profile.package.consultationsLeft;
                                    // If his current package has some consultations left
                                    if(consultations > 0){
                                        console.log('inside consultations 0')
                                        fee = 0;
                                        profile.package.consultationsLeft = consultations - 1;
                                        console.log(profile);

                                        // saving new consultation count in patient profile arr

                                        let profileArr = patient.profiles.map((profilePrev) => {
                                            if(profilePrev.id == profile.id) return profile;
                                            else return profilePrev;
                                        });
                                        patient.profiles = profileArr;
                                        console.log(patient);

                                        const newPatient = await Patient.findById(patient.id);
                                        newPatient.overwrite(patient);
                                        newPatient.save();
                                    }
                                }
                            }
                        }
                        else {
                            return res.status(400).json({
                                success: false,
                                message: 'no profile info found'
                            })
                        }

                        // console.log(info);

                        // CREATING APPOINTMENT
                        // saving the payment status INCOMPLETE in db
                        appointmentData['fees'] = fee.toString();
                        appointmentData['coupon'] = coupon;
                        appointmentData['info'] = info;
                        delete appointmentData.data;
                        const appointment = await Appointment.create(appointmentData);

                        //  Updating day schedule for the slot to booked
                        var daySchedule1 = await Schedule.findById(appointmentData.date);
                        // console.log(daySchedule);
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
                            data: {
                                _id : appointment.id,
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



module.exports = router;
