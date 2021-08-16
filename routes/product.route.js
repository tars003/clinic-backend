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
const Product = require('../models/Product.model');

const auth = require('../middleware/auth');

const getDate = () => {
    return moment()
}

// CREATE A PACKAGE
router.post('/add', auth, async (req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));
        const {
            name,
            uid,
            description,
            qty,
            cost,
        } = obj;

        let product = await Product.create({
            name,
            uid,
            description,
            qty,
            cost,
        });

        return res.status(200).json({
            success: true,
            data: product
        });
    } catch(err) {
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
            uid,
            description,
            qty,
            cost,
        } = obj;

        let product = await Product.findById(req.params.id);

        product['name']= name || product.name;
        product['uid']= uid || product.uid;
        product['description']= description || product.description;
        product['qty']= qty || product.qty;
        product['cost']= cost || product.cost;

        console.log('old product')
        console.log(product);

        const newProduct = await Product.findById(product.id);
        newProduct.overwrite(product);
        await newProduct.save()

        return res.status(200).json({
            success: true,
            data: newProduct
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});

// REMOVE A PACKAGE
router.get('/remove/:id', auth, async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        // console.log(products);
        await product.remove();
        return res.status(200).json({
            success: true,
            message: 'product removed'
        });
    } catch(err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            error: 'Server error'
        });
    }
});


//ALL PRODUCTS
// REMOVE A PACKAGE
router.get('/all', auth, async(req, res) => {
    try {
        const products = await Product.find();
        // console.log(products);
        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
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