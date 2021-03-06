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

// EDIT DOCTOR PERFORMA FOR A APPOINTMENT
router.post('/set-performa/:appointmentId', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            performa,
        } = obj;

        let appointment = await Appointment.findById(req.params.appointmentId);
        if(!appointment){
            return res.status(404).json({
                success: false,
                message: 'No appointemnt found'
            });
        }


        appointment['performa'] = performa;
        console.log(appointment);
        let newAppointment = await Appointment.findById(appointment.id);
        newAppointment.overwrite(appointment);
        
        newAppointment['performa'] = performa;
        console.log(newAppointment)
        await newAppointment.save()


        return res.status(200).json({
            success: true,
            data: newAppointment
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// EDIT DOCTOR PERFORMA FOR A APPOINTMENT
router.post('/set-prescription/:appointmentId', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            instructions,
            precautions,
            tests,
            field1,
            field2,
            field3,
            field4,
            field5,
        } = obj;

        let appointment = await Appointment.findById(req.params.appointmentId);
        if(!appointment){
            return res.status(404).json({
                success: false,
                message: 'No appointemnt found'
            });
        }


        if(instructions) appointment['prescription']['instructions'] = instructions;
        if(precautions) appointment['prescription']['precautions'] = precautions;
        if(tests) appointment['prescription']['tests'] = tests;
        if(field1) appointment['prescription']['field1'] = field1;
        appointment['consultationStatus'] = 'COMPLETED';
        console.log(appointment);
        let newAppointment = await Appointment.findById(appointment.id);
        newAppointment.overwrite(appointment);
        
        if(instructions) newAppointment['prescription']['instructions'] = instructions;
        if(precautions) newAppointment['prescription']['precautions'] = precautions;
        if(tests) newAppointment['prescription']['tests'] = tests;
        if(field1) newAppointment['prescription']['field1'] = field1;
        if(field2) newAppointment['prescription']['field2'] = field2;
        if(field3) newAppointment['prescription']['field3'] = field3;
        if(field4) newAppointment['prescription']['field4'] = field4;
        if(field5) newAppointment['prescription']['field5'] = field5;
        newAppointment['consultationStatus'] = 'COMPLETED';
        console.log(newAppointment)
        await newAppointment.save()


        return res.status(200).json({
            success: true,
            data: newAppointment
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

//  GET APPOINTMENT PERFORMA ROUTE
router.get('/get-performa/:appointmentId', async (req, res) => {
    try {
        let appointment = await Appointment.findById(req.params.appointmentId);
        let performa = ''
        if(appointment.consultationPerforma) performa = appointment.consultationPerforma;
        return res.status(200).json({
            success: true,
            data: performa
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

//  GET APPOINTMENT PERFORMA ROUTE
router.get('/get-prescription/:appointmentId', async (req, res) => {
    try {
        let appointment = await Appointment.findById(req.params.appointmentId);
        let prescription = ''
        if(appointment.prescription) prescription = appointment.prescription;
        return res.status(200).json({
            success: true,
            data: prescription
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// EDIT DOCTOR PROFILE
router.post('/edit', async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            email,
            fee,
            feeInternational,
            services,
            awards,
            registration,
            degree,
            experience,
        } = obj;

        let doctor = await Doctor.find();
        doctor = doctor[0];
        if(!doctor){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }


        if (name) doctor['name'] = name;
        if (email) doctor['email'] = email;
        if (fee) doctor['fee'] = fee;
        if (feeInternational) doctor['feeInternational'] = feeInternational;
        if (services) doctor['services'] = services;
        if (awards) doctor['awards'] = awards;
        if (registration) doctor['registration'] = registration;
        if (degree) doctor['degree'] = degree;
        if (experience) doctor['experience'] = experience;
        console.log(doctor);
        // let newDoctor = await Doctor.findById(doctor.id);
        // await newDoctor.overwrite(doctor);
        await doctor.save()


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

//  LOGIN ROUTE
router.get('/get-token/:email', async (req, res) => {
    try {
        // let doctor = await Doctor.findOne({ email: req.params.email });
        let doctor = await Doctor.find();
        doctor = doctor[0];
        if(!doctor){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to email !'
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


// CREATE PERFORMA FOR PATIENT
router.post('/set/:appointmentId', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.appointmentId);

        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        console.log(obj);

        var performaKeys = Object.keys(obj);
        performaKeys = performaKeys.filter(i => i != "data");
        performa = performaKeys.map(key => {
            let res = {};
            res['_id'] = key;
            res['description'] = obj[key];
            return res;
        });

        console.log(performa)

        appointment['consultationPerforma'] = performa;

        const newAppointment = await Appointment.findById(req.params.appointmentId);
        newAppointment.overwrite(appointment);
        await newAppointment.save();

        return res.status(200).json({
            success: true,
            data: newAppointment
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// CREATE DOCTOR
router.post('/create', async (req, res) => {
    try {
        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        console.log(obj);

        const doctor = await Doctor.create(obj)

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

router.get('/delete/:id', async(req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)

        const status = await Doctor.findByIdAndDelete(doctor.id);

        return res.status(200).json({
            success: true,
            data: status
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
})




module.exports = router;
