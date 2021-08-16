const express = require('express');
const cors = require('cors');
require("dotenv").config();
const Image = require('./models/Image');
const multer=require('multer')

const connectDB = require('./util/db');
const app = express();
connectDB();

app.use(express.json());
app.use(cors());
app.use("/patient", require('./routes/patient.route'));
app.use("/performa", require('./routes/performa.route'));
app.use("/appointment", require('./routes/appointment.route'));
app.use("/profile", require('./routes/profile.route'));
app.use("/package", require('./routes/package.route'));
app.use("/schedule", require('./routes/schedule.route'));
app.use("/doctor", require('./routes/doctor.route'));
app.use("/inventory", require('./routes/product.route'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },

    filename: function (req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname
        )
    }
})

var upload = multer({ storage: storage })
app.post('/upload/:appointmentId', upload.single('myFile'), async (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next("hey error")
    }


    const imagepost = new Image({
        image: file.path,
        appId: req.params.appointmentId
    })
    const savedimage = await imagepost.save()
    res.json(savedimage)
})

app.get('/image', async (req, res) => {
    const image = await Image.find()
    res.json(image)
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
