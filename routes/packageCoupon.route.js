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

const auth = require('../middleware/auth');

const getDate = () => {
    return moment()
}

// CREATE A COUPON
router.post('/create', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            code,
            percentOff,
            startDate,
            endDate
        } = obj;

        const c = await PackageCoupon.findById(code);
        if (c){
            return res.status(400).json({
                success: false,
                message: `PackageCoupon with ${code} already exists`
            })
        }

        let coupon = await PackageCoupon.create({
            _id: code,
            percentOff,
            isActive: true,
            startDate,
            endDate
        });

        return res.status(200).json({
            success: true,
            data: coupon
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


// CREATE A COUPON
router.post('/add-patients/:couponId', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            patients,
        } = obj;
        let c = await PackageCoupon.findById(req.params.couponId);
        if(!c) {
            return res.status(400).json({
                success: false,
                message: 'no coupon found '
            });
        }
        let pArr = patients.map(patient => ({_id: patient}))
        c.exclusivePatients = [...c.exclusivePatients, ...patients];
        // console.log(c);
        await c.save();

        return res.status(200).json({
            success: true,
            coupon: c
        })


    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// SEE ALL COUPONS
router.get('/get-all', auth, async (req, res) => {
    try {
        const coupons = await PackageCoupon.find();
        console.log(coupons);
        return res.status(200).json({
            success: true,
            length: coupons.length,
            data: coupons
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// DELETE COUPON
router.get('/delete/:code', auth, async (req, res) => {
    try {
        const coupon = await PackageCoupon.findById(req.params.code);
        console.log(coupon);
        await coupon.remove();
        return res.status(200).json({
            success: true,
            message: 'PackageCoupon demoved successfully'
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// DELETE COUPON
router.get('/edit/:code/:status', auth, async (req, res) => {
    try {
        const coupon = await PackageCoupon.findById(req.params.code);
        console.log(coupon);
        
        coupon['isActive'] = req.params.status == 'true' ? true : false;
        await coupon.save();

        return res.status(200).json({
            success: true,
            data: coupon
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
