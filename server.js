const express = require('express');
const cors = require('cors');
require("dotenv").config();
const Image = require('./models/Image');
const multer=require('multer');
const moment = require('moment');

const connectDB = require('./util/db');
const app = express();
connectDB();

app.use(express.json());
app.use('/server/public', express.static('public'));
app.use(cors());
app.use("/server/patient", require('./routes/patient.route'));
app.use("/server/performa", require('./routes/performa.route'));
app.use("/server/appointment", require('./routes/appointment.route'));
app.use("/server/profile", require('./routes/profile.route'));
app.use("/server/package", require('./routes/package.route'));
app.use("/server/schedule", require('./routes/schedule.route'));
app.use("/server/doctor", require('./routes/doctor.route'));
app.use("/server/inventory", require('./routes/product.route'));
app.use("/server/coupon", require('./routes/coupon.route'));
app.use("/server/package-coupon", require('./routes/packageCoupon.route'));
app.use("/server/notify", require('./routes/notification.route'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },

    filename: function (req, file, cb) {
        // cb(null, new Date().toISOString() + file.originalname
        cb(null, moment().format('YYYY-MM-DD_HH_mm_')+ file.originalname
        )
    }
})

var upload = multer({ storage: storage })
app.post('/server/file/upload/:appointmentId', upload.single('myFile'), async (req, res, next) => {
    const file = req.file;
    console.log(file);
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next("hey error")
    }
    let images = await Image.findById(req.params.appointmentId);
    if (images) {
        images.images.push(file.path);

        const newImages = await Image.findById(images.id);
        newImages.overwrite(images);
        newImages.save();

        res.json(newImages)
    }
    else {
        const imagepost = new Image({
            images: [file.path],
            _id: req.params.appointmentId
        })
        const savedimage = await imagepost.save()
        res.json(savedimage)
    }
})

app.get('/server/file/get-images/:appId', async (req, res) => {
    const image = await Image.findById(req.params.appId);
    res.json(image)
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
