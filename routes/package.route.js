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
const PackageCoupon = require('../models/PackageCoupon.model');


const { createOrder, confirmPayment, randomStr } = require('../util/rzp');
const { isCouponApplicable, isCouponValid } = require('../util/coupon');
const auth = require('../middleware/auth');

const { sendMail } = require('../util/mail');
const { sendSMS, sendSMSLater } = require('../util/sms');

const getDate = () => {
    return moment()
}

// CREATE A PACKAGE
router.post('/create', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            patientType,
            description,
            consultations,
            validity,
            price,
            isIndian
        } = obj;

        let package = await Package.create({
            name,
            patientType,
            description,
            consultations,
            validity,
            price,
            isIndian
        });

        return res.status(200).json({
            success: true,
            data: package
        });
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// CREATE A PACKAGE
router.post('/edit/:id', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log('Incoming object');
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            patientType,
            description,
            consultations,
            validity,
            price,
            isIndian
        } = obj;

        let package = await Package.findById(req.params.id);

        package['name'] = name || package.name;
        package['patientType'] = patientType || package.patientType;
        package['description'] = description || package.description;
        package['consultations'] = consultations || package.consultations;
        package['validity'] = validity || package.validity;
        package['price'] = price || package.price;
        package['isIndian'] = isIndian || package.isIndia;

        console.log('old package')
        console.log(package);

        const newPackage = await Package.findById(package.id);
        newPackage.overwrite(package);
        await newPackage.save()

        return res.status(200).json({
            success: true,
            data: newPackage
        });
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// REMOVE A PACKAGE
router.get('/remove/:id', auth, async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);
        // console.log(packages);
        await package.remove();
        return res.status(200).json({
            success: true,
            message: 'package removed'
        });
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});




// SEE ALL Packages Route
router.get('/view-package', auth, async (req, res) => {
    try {
        let packages;
        if (req.body.data != undefined) {
            const isOld = await Appointment.findOne({ patientId: req.body.data.id });
            
            if (isOld) {
                packages = await Package.find({ patientType: 'old' });
            }
            else {
                packages = await Package.find({ patientType: 'new' });
            }
        }
        else 
            packages = await Package.find();



        console.log(packages);
        return res.status(200).json({
            success: true,
            length: packages.length,
            data: packages
        });
    } catch (err) {
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
    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// ADD PACKAGE TO PATIENT
router.post('/invoice/buy-package/:packageId', auth, async (req, res) => {
    try {
        var coupon = await PackageCoupon.findById(req.body.coupon);
        // if no coupon present in request
        if (!coupon) {
            coupon = {
                _id: 'NONE',
                isActive: true,
                percentOff: 0
            }
        }
        console.log('coupon', coupon);
        const currDate = getDate().format('DD-MM-YYYY');

        // CHECKING FOR THE VALIDITY AND APPLICABLITY OF COUPON
        if (coupon.isActive && isCouponValid(coupon, currDate) && isCouponApplicable(coupon, req.body.data.id)) {

            // QUERYING FOR THE PATIENT OBJECT FROM DB
            let patient = await Patient.findById(req.body.data.id);
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'No user with found corresponding auth token'
                });
            }
            let profile, packageInitial;
            // RETREIVING CURRENT PACKAGE DATA FROM PATIENT SUB PROFILE
            if (req.body.profileId) {
                if (req.body.profileId == patient.id) {
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
            if (typeof packageInitial != "undefined") {
                let validTill = moment(Date.parse(packageInitial.validTill));
                let currDate = getDate();
                console.log(currDate.diff(validTill));
                if (packageInitial.consultationsLeft <= 0) {
                    console.log('adding new package to patient, all consultation of current package used')
                }
                else if (currDate.diff(validTill) < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Patient already has an active package'
                    })
                }
            }

            // FORMATTING PACKAGE DATA TO BE SAVED IN PATIENT PROFILE/SUB PROFILE
            let package = await Package.findById(req.params.packageId);
            if (!package) {
                return res.status(404).json({
                    success: false,
                    message: 'No package with found corresponding auth token'
                });
            }

            var packagePrice = package.price * ((100 - coupon.percentOff) / 100);
            console.log('packagePrice', packagePrice);
            // APPLYING COUPON DISCOUNT
            var curr = ''
            if (package.isIndian) {
                curr = 'INR'
            } else {
                curr = 'USD'
            }

            const receipt = randomStr(10, '123465789abcdefgh');
            const notes = {
                "patientName": patient.name
            };
            const order = await createOrder(packagePrice, curr, receipt, notes);


            return res.status(200).json({
                success: true,
                data: {
                    _id: package.id,
                    beforePrice: package.price,
                    afterPrice: packagePrice,
                    currency: curr,
                    coupon: coupon.id,
                    order,
                }
            })

        } else {
            console.log('Coupon either expired or not valid');
            return res.status(400).json({
                success: false,
                message: 'Coupon either expired or not valid'
            })
        }


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// ADD PACKAGE TO PATIENT
router.post('/confirm/buy-package/:packageId', auth, async (req, res) => {
    try {
        // QUERYING FOR THE PATIENT OBJECT FROM DB
        let patient = await Patient.findById(req.body.data.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'No user with found corresponding auth token'
            });
        }
        let profile, packageInitial;
        // RETREIVING CURRENT PACKAGE DATA FROM PATIENT SUB PROFILE
        if (req.body.profileId) {
            if (req.body.profileId == patient.id) {
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
        if (typeof packageInitial != "undefined") {
            let validTill = moment(Date.parse(packageInitial.validTill));
            let currDate = getDate();
            console.log(currDate.diff(validTill));
            if (packageInitial.consultationsLeft <= 0) {
                console.log('adding new package to patient, all consultation of current package used')
            }
            else if (currDate.diff(validTill) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient already has an active package'
                })
            }
        }

        // FORMATTING PACKAGE DATA TO BE SAVED IN PATIENT PROFILE/SUB PROFILE
        let package = await Package.findById(req.params.packageId);
        if (!package) {
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

        var { orderId, paymentId } = req.body;
        const sig = req.get('x-razorpay-signature');
        const status = confirmPayment(orderId, paymentId, sig);
        if (status) {
            // SAVING PACKAGE IN PATIENT SUB PROFILE
            if(data.consultationsLeft == 0) sendConfirmationMail(patient, paymentId);
            if (req.body.profileId != patient.id) {
                let profileArr = patient.profiles.map(profile => {
                    if (profile.id == req.body.profileId) {
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
            // SAVING PACKAGE IN PATIENT MAIN PROFILE
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

        } else {
            return res.status(400).json({
                success: false,
                message: "payment signature invalid"
            })
        }

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

const sendConfirmationMail = async (patient, paymentId) => {
    // SEND MAIL TO PATIENT & DOCTOR
    const sub = 'Medicine Package Request Notification';
    const text = `Hey ${patient.name}, your payment towards medicine package has been successfully processed.
    Doctor contact info : ${process.env.doctorEmail}
    `
    const text2 = `A new payment for medicine package  has been successfully processed with payment Id : ${paymentId}. 
    Patient Name : ${patient.name}
    Patient Age : ${patient.age}
    Patient gender : ${patient.gender}
    Phone no. : ${patient.phone}
    Email : ${patient.email}
    `

    try {
        sendMail(appointment['info']['patientEmail'], sub, text);
        sendMail(process.env.doctorEmail, sub, text2);

        // sendSMS(
        //     appointment['info']['phone'],
        //     text,
        //     process.env.smsDLTTemplateId2
        // );

    } catch (err) {
        console.log(err);
    }
}



module.exports = router;
