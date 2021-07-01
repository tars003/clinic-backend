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

// SEE ALL Packages Route
router.get('/view-package', auth, async (req, res) => {
    try {
        const packages = await Package.find();
        console.log(packages);
        return res.status(200).json({
            success: true,
            data: packages
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// GET PACKAGE OF A PATIENT
router.get('/my-package', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.body.data.id);
        const patientData = {
            "_id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "package": patient.package
        }
        return res.status(200).json({
            success: true,
            data: [
                patientData,
                ...patient.profiles
            ]
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// ADD PACKAGE TO PATIENT
router.post('/buy-package/:packageId', auth, async (req, res) => {
    try {
        let patient = await Patient.findById(req.body.data.id);
        if(!patient){
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding auth token'
            });
        }
        let profile, packageInitial;
        if(req.body.profileId){
            if(req.body.profileId == patient.id){
                packageInitial = patient.package;
            }
            else {
                profile = patient.profiles.filter((profile) => profile.id == req.body.profileId);
                console.log(profile[0]);
                packageInitial = profile[0].package;
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: "No profile id found"
            })
        }

        // If current package validity has not expired
        if(typeof packageInitial != "undefined"){
            let validTill = moment(Date.parse(packageInitial.validTill));
            let currDate = getDate();
            console.log(currDate.diff(validTill));
            if(packageInitial.consultationsLeft <= 0) {
                console.log('adding new package to patient, all consultation of current package used')
            }
            else if(currDate.diff(validTill) < 0 ){
                return res.status(400).json({
                    success: false,
                    message: 'Patient already has an active package'
                })
            }
        }

        let package = await Package.findById(req.params.packageId);
        if(!package){
            return res.status(404).json({
                success: false,
                message: 'No package with found corresponding auth token'
            });
        }

        let data = {
            name: package.name,
            consultationsLeft: package.consultations,
            createdAt: getDate().format('DD-MM-YYYY'),
            validTill: getDate().add(package.validity, 'days')
        }

        if(req.body.profileId){

            let profileArr = patient.profiles.map(profile => {
                if(profile.id == req.body.profileId){
                    profile['package'] = data;
                }
                return profile;
            });
            // console.log(profileArr);
            patient['profiles'] = profileArr;
            console.log(patient);

            const newPatient = await Patient.findById(patient.id);
            newPatient.overwrite(patient);
            await newPatient.save();

            return res.status(200).json({
                success: true,
                data: newPatient
            });
        }
        else {
            patient['package'] = data;
            console.log(patient);

            const newPatient = await Patient.findById(patient.id);
            newPatient.overwrite(patient);
            await newPatient.save();

            return res.status(200).json({
                success: true,
                data: newPatient
            });
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
