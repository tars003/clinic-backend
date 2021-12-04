const { Router } = require('express');
const jwt = require('jsonwebtoken');
const moment = require('moment');
var alarm = require('alarm');
const router = Router();

const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model.js');
const Schedule = require('../models/Schedule.model');
const Coupon = require('../models/Coupon.model');
const Doctor = require('../models/Doctor.model');
const auth = require('../middleware/auth');
const generateSlots = require('../util/GenerateSlots')
const { sendMail } = require('../util/mail');
const { createOrder, confirmPayment, randomStr } = require('../util/rzp');
const { isCouponApplicable, isCouponValid } = require('../util/coupon');

// Require google from googleapis package.
const { google } = require('googleapis');

// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new OAuth2(
    process.env.ACCESS_ID,
    process.env.ACCESS_SECRET
)

// Call the setCredentials method on our oAuth2Client instance and set our refresh token.

oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

const getDate = () => {
    return moment()
};

const cancelTime = 720;
const rescheduleTime = 240;

// GET STARTING TIME FOR APPOINTMENT FROM SLOT
const getAppTime = (date, slot) => {
    const startTime = slot.split(' - ')[0];
    let appointmentTime = moment(
        `${date} ${startTime}`,
        'DD-MM-YYYY HH:mm'
    );
    return appointmentTime;
}

// GET ALL PAST APPOINTMENTS FOR A PATIENT
router.get('/get/past-appointments/:id', auth, async (req, res) => {
    try {
        let patient = await Patient.findById(req.params.id);
        // console.log(patient)
        let appointments = await Appointment.find({ patientId: patient.id })

        if (patient) {
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
    } catch (err) {
        console.log(err);
        res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
})


// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.post('/reschedule', auth, async (req, res) => {
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
        if (daySchedule) {
            const checkSlot = (slot) => {
                return slot.slot == newSlot
            }
            var slotArr = daySchedule.slots.filter(checkSlot);
            // Slots array does exist for the schedule of the date in request
            // Also checks that slot present in request does agree with the given day's schedule
            if (slotArr.length >= 1) {
                var slotObj = slotArr[0]
                // if the slot is already booked by another payment complete appointment
                if (slotObj.booked) {
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
                    if (!appointment) {
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
                    if (diffMins < rescheduleTime) {
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
                        if (slot.slot == newSlot) {
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
                        if (slot.slot == oldSlot) {
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
    } catch (err) {
        console.log(err);
        res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
})

// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.get('/cancel/:appointmentId', auth, async (req, res) => {
    try {

        // CREATING APPOINTMENT
        // saving the payment status INCOMPLETE in db
        // let appointment = await Appointment.findById(req.params.appointmentId);
        // if (!appointment) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'appointment Id invalid'
        //     })
        // };

        // // CHECKING IF APPOINTMENT IS RESCHEDULABLE
        // let currDate = getDate();
        // let appointmentTime = getAppTime(appointment.date, appointment.timeSlot);
        // const diffMins = appointmentTime.diff(currDate, 'minutes');
        // console.log(diffMins);
        // console.log(appointmentTime.format('DD-MM-YYYY HH:mm'));
        // console.log(currDate.format('DD-MM-YYYY HH:mm'));
        // if (diffMins < cancelTime) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'time period for cancellation is closed'
        //     })
        // }


        // let newAppointment = await Appointment.findByIdAndRemove(req.params.appointmentId);


        // //  Updating day schedule for the slot to booked
        // var daySchedule1 = await Schedule.findById(appointment.date);
        // const newSchedule = daySchedule1.slots.map((slot) => {
        //     var newSlot1 = slot;
        //     if (slot.slot == appointment.timeSlot) {
        //         newSlot1.booked = false;
        //         return newSlot1;
        //     }
        //     else {
        //         return newSlot1;
        //     }
        // })
        // daySchedule1['slots'] = newSchedule;
        // daySchedule1.overwrite(daySchedule1);
        // // console.log(daySchedule1);
        // daySchedule1.save();

        const result = await cancelAppointment(req.params.appointmentId);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result)
        }


    } catch (err) {
        console.log(err);
        res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
})



// GET ALL APPOINTMENTS FOR A PATIENT
router.get('/get-appointments/:date', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ date: req.params.date });
        console.log(appointments);

        return res.status(200).json({
            success: true,
            length: appointments.length,
            data: appointments
        });
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// CONFIRM PAYMENT STATUS OF APPOINTMENT
router.post('/confirm-appointment/:appointmentId', auth, async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId
        const appointmentData = await Appointment.findById(appointmentId);
        var date = appointmentData.date;
        var isActive = false;
        var coupon;

        // coupon validity
        if (appointmentData.coupon == 'NONE') {
            isActive = true;
        }
        else {
            coupon = await Coupon.findById(appointmentData.coupon);
            isActive = coupon.isActive;
        }
        // checking if the appointment object in db actually exists
        if (appointmentData) {
            // checking if the coupon code is still active
            if (isActive) {
                const daySchedule = await Schedule.findById(appointmentData.date);
                const checkSlot = (slot) => {
                    return slot.slot == appointmentData.timeSlot
                }
                const slotArr = daySchedule.slots.filter(checkSlot);
                // console.log(slotArr);
                // If the slot present in appointment object is acutally found in schedule
                if (slotArr.length > 0) {
                    var slotObj = slotArr[0];
                    // if the slot has already been booked
                    if (false) {
                        return res.status(400).json({
                            success: false,
                            message: 'Slot is already booked, initiating a refund'
                        })
                    }
                    // if the slot is okay and not boooked
                    else {
                        // updating appointment payment status to COMPLETE
                        var appointment = await Appointment.findById(appointmentId);

                        var { orderId, paymentId } = req.body;
                        const sig = req.get('x-razorpay-signature');
                        const status = confirmPayment(orderId, paymentId, sig);
                        if (status) {
                            appointment['paymentStatus'] = 'COMPLETE';
                        } else {
                            appointment['paymentStatus'] = 'FAILED';
                        }

                        // SEND CONFIRMATION MAIL TO DOCTOR AND PATIENT
                        sendConfirmationMail(appointment);

                        // CREATING ALARM FOR 15 MINS BEFORE APPOINMENT
                        const appTime = appointment.timeSlot.split(" - ")[0];
                        var dateObj = moment(`${appointment.date} ${appTime}`, 'DD-MM-YYYY HH:mm');
                        console.log(`Reminder mail scheduled for:  ${appointment.date} ${appTime}`);
                        console.log(`Current Time : ${getDate().format('DD-MM-YYYY HH:mm')}`);
                        console.log(`Time left ${dateObj.diff(getDate(), 'seconds')}`);
                        var date = new Date(dateObj);
                        alarm(date, async function () {
                            console.log(`Sending reminder mail for  ${appointment.id} appointment`);
                            sendReminderMail(appointment);
                        });


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

    } catch (err) {
        console.log(err);
        res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
})

// RETURN CONFIRMATION INVOICE ; takes SLOT, DATE, COUPON, patientId as input
router.post('/get-invoice', auth, async (req, res) => {
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
        console.log('cpouoon', coupon);
        // if no coupon present in request
        if (!coupon) {
            coupon = {
                _id: 'NONE',
                isActive: true,
                percentOff: 0
            }
        }
        //  The coupon present should have isActive true in db
        console.log('is cpoupon Applicable')
        console.log(isCouponApplicable(coupon, appointmentData['patientId']));
        console.log('isCouponValid');
        console.log(isCouponValid(coupon, appointmentData.date));
        if (coupon.isActive && isCouponValid(coupon, appointmentData.date) && isCouponApplicable(coupon, appointmentData['patientId'])) {
            const daySchedule = await Schedule.findById(appointmentData.date);
            //  Schedule for the date in request exists
            if (daySchedule) {
                const checkSlot = (slot) => {
                    return slot.slot == appointmentData.timeSlot
                }
                var slotArr = daySchedule.slots.filter(checkSlot);
                // Slots array does exist for the schedule of the date in request
                // Also checks that slot present in request does agree with the given day's schedule
                if (slotArr.length >= 1) {
                    var slotObj = slotArr[0]
                    // if the slot is already booked by another payment complete appointment
                    if (slotObj.booked) {
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
                        let finalFee;
                        if (patient.isIndian) finalFee = doctorData.fee;
                        else finalFee = doctorData.feeInternational;
                        console.log('beforeFee', finalFee);
                        var fee = finalFee * ((100 - coupon.percentOff) / 100);
                        var isPackageUsed = false;
                        console.log('afterFee', fee);
                        var info = {};
                        console.log(req.body);
                        // CHECKING FOR PACKAGE & NUMBER OF CINSULTATIONS LEFT FOR THE PROFILE
                        if (req.body['info']) {
                            // CHECKING IF THE APPOINTMENT IS BEING BOOKED FOR MAIN PROFILE OF THE PATIENT
                            if (req.body['info']['id'] == patient.id) {
                                info = {
                                    _id: patient.id,
                                    name: patient.name,
                                    age: patient.age,
                                    gender: patient.gender,
                                    phone: patient.phone,
                                    patientEmail: patient.email,
                                    doctorEmail: doctorData.email
                                }
                                // If package exists
                                if (patient.package) {
                                    console.log(patient.package);
                                    var consultations = patient.package.consultationsLeft;
                                    // If his current package has some consultations left
                                    if (consultations > 0) {
                                        isPackageUsed = true;
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
                                    phone: patient.phone,
                                    patientEmail: patient.email,
                                    doctorEmail: doctorData.email
                                };
                                const profile = patient.profiles.filter((profile) => profile.id == req.body['info']['id'])[0];
                                console.log('profile');
                                console.log(profile);

                                if (profile.package) {
                                    console.log(profile.package);
                                    var consultations = profile.package.consultationsLeft;
                                    // If his current package has some consultations left
                                    if (consultations > 0) {
                                        isPackageUsed = true;
                                        console.log('inside consultations 0')
                                        fee = 0;
                                        profile.package.consultationsLeft = consultations - 1;
                                        console.log(profile);

                                        // saving new consultation count in patient profile arr
                                        let profileArr = patient.profiles.map((profilePrev) => {
                                            if (profilePrev.id == profile.id) return profile;
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

                        // CREATING APPOINTMENT
                        // saving the payment status INCOMPLETE in db
                        appointmentData['fees'] = fee.toString();
                        appointmentData['coupon'] = coupon;
                        appointmentData['info'] = info;
                        delete appointmentData.data;
                        // console.log('appointmentData')
                        // console.log(appointmentData);
                        let appointment = await Appointment.create(appointmentData);

                        // CREATE A RAZORPAY ORDER
                        let currency = 'INR';
                        if (patient.isIndian != undefined) {
                            currency = patient.isIndian ? 'INR' : 'USD';
                        }
                        const receipt = randomStr(10, '123465789abcdefgh');
                        const notes = {
                            "patientName": patient.name
                        };

                        var order;

                        if (!isPackageUsed) {
                            order = await createOrder(fee, currency, receipt, notes);
                            if (order.id) {
                                appointment['orderId'] = order.id;
                                appointment['receipt'] = order.receipt;
                                await appointment.save();
                            }
                        }
                        else {
                            order = { packageUsed: true };
                            appointment['orderId'] = 'package availed';
                            appointment['receipt'] = 'package availed';
                            appointment['paymentStatus'] = 'COMPLETE';
                            await appointment.save();
                        }



                        //  Updating day schedule for the slot to booked
                        var daySchedule1 = await Schedule.findById(appointmentData.date);
                        const newSchedule = daySchedule1.slots.map((slot) => {
                            var newSlot = slot;
                            if (slot.slot == appointment.timeSlot) {
                                newSlot.booked = true;
                                return newSlot;
                            }
                            else {
                                return newSlot;
                            }
                        })
                        daySchedule1['slots'] = newSchedule
                        daySchedule1.overwrite(daySchedule1);
                        daySchedule1.save();

                        // UPDATING PATIENS ARR INSIDE COUPON 
                        //  FOR 1 TIME USE 
                        if (coupon.percentOff == 0) {

                        } else {
                            if (!coupon.isOneTime) {
                                coupon.patients.push({
                                    _id: patient.id,
                                    appointmentId: appointment.id
                                });
                                const newCoupon = await Coupon.findById(coupon.id);
                                newCoupon.overwrite(coupon);
                                // console.log('newCoupon');
                                // console.log(newCoupon);
                                await newCoupon.save();
                            }
                        }


                        // CREATING GOOGLE MEET LINK AND SAVING IT IN THE APPOINTMENT OBJ
                        createLink(appointment, doctorData.email, patient.email);

                        // CREATING ALARM FOR 15 MINS
                        var now = getDate();
                        var date = getDate().add(parseInt(process.env.autoCancelDuration), 'seconds');
                        console.log(`Auto cancellation  scheduled for:  ${date.format('DD-MM-YYYY HH:mm')}`);
                        console.log(`Current Time : ${getDate().format('DD-MM-YYYY HH:mm')}`);
                        console.log(`Time left ${date.diff(now, 'seconds')}`); 
                        alarm(date, async function () {
                            console.log(`Checking status of ${appointment.id} appointment`);
                            const app = await Appointment.findById(appointment.id);
                            if (appointment.paymentStatus == 'INCOMPLETE') {
                                console.log('Inside Cancel !!!!!!!!!!!!!!!!!!!!');
                                const result = await cancelAppointment(app.id);
                                console.log(result);
                            }
                            else {
                                console.log('Payment complete for the appointemnt')
                            }
                        });

                        return res.status(200).json({
                            success: true,
                            data: {
                                _id: appointment.id,
                                fees: appointment.fees,
                                orderData: order
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
    } catch (err) {
        console.log(err);
        res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
});





const createLink = (appointment, doctorEmail, patientEmail) => {
    const timeZone = 'Asia/Kolkata';
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const startTime = appointment.timeSlot.split(' - ')[0];
    const endTime = appointment.timeSlot.split(' - ')[1];
    const date = appointment.date;
    let start = moment(
        `${date} ${startTime}`,
        'DD-MM-YYYY HH:mm'
    );
    let end = moment(
        `${date} ${endTime}`,
        'DD-MM-YYYY HH:mm'
    );
    const eventStartTime = start.toDate();
    const eventEndTime = end.toDate();

    const event = {
        summary: `Consultation`,
        description: `Online Consultation`,
        colorId: 1,
        start: {
            dateTime: eventStartTime,
            timeZone: timeZone,
        },
        end: {
            dateTime: eventEndTime,
            timeZone: timeZone,
        },
        conferenceData: {
            createRequest: {
                requestId: "sample123",
                conferenceSolutionKey: { type: "hangoutsMeet" },
            },
        },
    };
    console.log(event);
    calendar.freebusy.query(
        {
            resource: {
                timeMin: eventStartTime,
                timeMax: eventEndTime,
                timeZone: timeZone,
                items: [{ id: 'primary' }],
            },
        },
        (err, res) => {
            if (err) return console.error('Free Busy Query Error: ', err)
            const eventArr = res.data.calendars.primary.busy;
            console.log(eventArr);
            if (eventArr.length === 0) {
                const e = calendar.events.insert(
                    { calendarId: 'primary', resource: event, conferenceDataVersion: 1, },
                    (err, response) => {
                        if (err) return console.error('Error Creating Calender Event:', err);

                        console.log(response.data.hangoutLink);
                        appointment['consultationLink'] = response.data.hangoutLink;

                        (async () => {
                            const newAppointment = await Appointment.findById(appointment.id);
                            console.log(appointment);
                            newAppointment.overwrite(appointment);
                            await newAppointment.save();
                        })();

                        return console.log('Calendar event successfully created.')
                    }
                );
                return e
            }
            else {
                return console.log(`Sorry I'm busy...`)
            }
        }
    )

}

const cancelAppointment = async (appointmentId) => {
    let appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        return ({
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
    if (diffMins < cancelTime) {
        return ({
            success: false,
            message: 'time period for cancellation is closed'
        })
    }


    let newAppointment = await Appointment.findByIdAndRemove(appointmentId);


    //  Updating day schedule for the slot to booked
    var daySchedule1 = await Schedule.findById(appointment.date);
    const newSchedule = daySchedule1.slots.map((slot) => {
        var newSlot1 = slot;
        if (slot.slot == appointment.timeSlot) {
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

    return ({
        success: true,
        message: "cancellation successfull"
    })
}

const sendReminderMail = async (appointment) => {
    // SEND MAIL TO PATIENT & DOCTOR
    const sub = 'Appointment Confirmation';
    const text = `Hey ${appointment.info.name}, your appointment is scheduled in 15 minutes. Please use the meet link attached below to join the consultation.
    Slot : ${appointment.timeSlot}
    Date : ${appointment.date}
    Payment Status : ${appointment.paymentStatus}
    Consultation Meet Link : ${appointment['consultationLink']}

    Doctor contact info : ${appointment.info.doctorEmail}
    `
    const text2 = `A  appointment is scheduled in 15 minutes,  slot ${appointment.timeSlot} and ${appointment.date} . The meeting link for the consultation is ${appointment['consultationLink']}. 
    Patient Name : ${appointment.info.name}
    Patient Age : ${appointment.info.age}
    Patient gender : ${appointment.info.gender}
    Phone no. : ${appointment.info.phone}
    Email : ${appointment.info.patientEmail}
    `

    try {
        sendMail(appointment['info']['patientEmail'], sub, text);
        // sendMail(appointment['info']['doctorEmail'], sub, text2);
        sendMail('homeosure@gmail.com', sub, text2);
    } catch (err) {
        console.log(err);
    }
}

const sendConfirmationMail = async (appointment) => {
    // SEND MAIL TO PATIENT & DOCTOR
    const sub = 'Appointment Confirmation';
    const text = `Hey ${appointment.info.name}, your appointment has been succesfully booked.
    Slot : ${appointment.timeSlot}
    Date : ${appointment.date}
    Payment Status : ${appointment.paymentStatus}
    Consultation Meet Link : ${appointment['consultationLink']}

    Doctor contact info : ${appointment.info.doctorEmail}
    `
    const text2 = `A new appointment has been succesfully booked for the slot ${appointment.timeSlot} and ${appointment.date} . The meeting link for the consultation is ${appointment['consultationLink']}. 
    Patient Name : ${appointment.info.name}
    Patient Age : ${appointment.info.age}
    Patient gender : ${appointment.info.gender}
    Phone no. : ${appointment.info.phone}
    Email : ${appointment.info.patientEmail}
    `

    try {
        sendMail(appointment['info']['patientEmail'], sub, text);
        // sendMail(appointment['info']['doctorEmail'], sub, text2);
        sendMail('homeosure@gmail.com', sub, text2);
    } catch (err) {
        console.log(err);
    }
}


module.exports = router;
