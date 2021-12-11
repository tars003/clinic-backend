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
router.get('/get-appointments', auth, async (req, res) => {
    try {
        let patient = await Patient.findById(req.body.data.id);
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding auth token'
            });
        }

        const appointments = await Appointment.find({ patientId : patient.id });
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

// INITIAL TOKEN ROUTE FOR PATIENT
router.get('/get-token/:phone', async (req, res) => {
    try {
        let patient = await Patient.findOne({ phone: req.params.phone });
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }
        const tokenPayload = {
            data: {
                id: patient.id
            }
        }
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
        console.log(`Requested token : ${token}`);
        return res.status(200).json({
            success: true,
            token,
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

// INITIAL TOKEN ROUTE FOR PATIENT
router.get('/get-token/email/:email', async (req, res) => {
    try {
        let patient = await Patient.findOne({ email: req.params.email });
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding to given contact number !'
            });
        }
        if(patient.isIndian) {
            return res.status(400).json({
                success: false,
                message: "An Indian patient is already using this mail, please use any other mail address"
            })
        }
        const tokenPayload = {
            data: {
                id: patient.id
            }
        }
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
        console.log(`Requested token : ${token}`);
        return res.status(200).json({
            success: true,
            token,
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


// CREATE ROUTE FOR PATIENT
router.post('/create', async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj)
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            age,
            email,
            gender,
            phone,
            address,
            isIndian,
        } = obj;

        const tempProfile = await Patient.findOne({ phone });
        console.log(tempProfile);
        if(tempProfile){
            return res.status(409).json({
                success: false,
                message: 'Patient profile already exists'
            })
        }
        else {
            const patient = await Patient.create({
                name,
                phone,
                email,
                gender,
                age,
                isIndian,
                address
            });
            const payload = {
                data: {
                  id: patient.id,
                },
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            return res.status(201).json({
                success: true,
                data: patient,
                token
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

// CREATE ROUTE FOR PATIENT via EMAIL
router.post('/create/email', async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj)
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            age,
            email,
            gender,
            phone,
            isIndian,
            address
        } = obj;

        const tempProfile = await Patient.findOne({ email });
        console.log(tempProfile);
        if(tempProfile){
            return res.status(409).json({
                success: false,
                message: 'Patient profile already exists'
            })
        }
        else {
            const patient = await Patient.create({
                name,
                phone,
                email,
                gender,
                age,
                isIndian,
                address
            });
            const payload = {
                data: {
                  id: patient.id,
                },
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            return res.status(201).json({
                success: true,
                data: patient,
                token
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


// UPDATE ROUTE FOR PATIENT
router.post('/nationality/update', auth, async (req, res) => {
    try {
        let obj = req.body;
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            id,
            isIndian
        } = obj;

        let tempProfile = await Patient.findById( id );

        if(tempProfile){
            if(isIndian) tempProfile['isIndian'] = true;
            else tempProfile['isIndian'] = false;
            
            // const newProfile = await Patient.findById(tempProfile.id);
            // newProfile.overwrite(tempProfile);
            tempProfile.save();

            return res.status(200).json({
                success: true,
                data: tempProfile
            });
        }
        else {
            return res.status(400).json({
                success: true,
                message: 'np user found for given token'
            })
        }

    } catch(err) {
        console.log(err);
        return res.status(503).json({
            error: 'Server error',
            success: false,
        });
    }
});


// UPDATE ROUTE FOR PATIENT
router.post('/update', auth, async (req, res) => {
    try {
        let obj = req.body;
        // console.log(obj)
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            id,
            name,
            age,
            gender,
            address,
            email,
        } = obj;

        const tempPatient = await Patient.findOne({ email: email });
        if(tempPatient) {
            return res.status(400).json({
                success: false,
                message: 'A Patient is already using the email provided'
            })
        }

        let tempProfile = await Patient.findById( req.body.data.id );

        if(tempProfile){
            if(id == tempProfile.id) {
                tempProfile['name'] = name;
                tempProfile['age'] = age;
                tempProfile['gender'] = gender;
                tempProfile['address'] = address;
                if(tempProfile.isIndian) tempP
                console.log('tempProfile',tempProfile);
                // const newProfile = await Patient.findById(tempProfile.id);
                // await Patient.updateOne(tempProfile.id, tempProfile);
                // console.log('newProfile', newProfile);
                await tempProfile.save();

                return res.status(200).json({
                    success: true,
                    data: tempProfile
                });
            }
            else {
                let profileArr = tempProfile.profiles;
                let isFound = false;
                profileArr = profileArr.map(profile => {
                    if(profile.id == id){
                        profile['name'] = name;
                        profile['age'] = age;
                        profile['gender'] = gender;
                        isFound = true;
                    }
                    return profile;
                });

                // Checking if any sub id was found
                if(!isFound){
                    return res.status(400).json({
                        success: false,
                        message: 'No sub profile found'
                    })
                }

                tempProfile['profiles'] = profileArr;
                console.log(tempProfile)
                const newProfile = await Patient.findById(tempProfile.id);
                newProfile.overwrite(tempProfile);
                newProfile.save();

                return res.status(200).json({
                    success: true,
                    data: newProfile
                })
            }
        }
        else {
            return res.status(400).json({
                success: true,
                message: 'np user found for given token'
            })
        }

    } catch(err) {
        console.log(err);
        return res.status(503).json({
            error: 'Server error',
            success: false,
        });
    }
});

// GET ROUTE FOR PATIENT
router.get('/get/:id', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        return res.status(200).json({
            success: true,
            data: patient
        })
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// GET ROUTE FOR PATIENT
router.get('/get-all', async (req, res) => {
    try {
        const patients = await Patient.find({});
        console.log(patients)
        return res.status(200).json({
            success: true,
            data: patients
        })
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
        const patient = await Patient.findById(req.params.id)

        const status = await Patient.findByIdAndDelete(patient.id);

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
