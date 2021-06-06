const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    slot: {
        consultationTime: Number,
        gapTime: Number,
        startTime: String,
        endTime: String
    },
    fee : Number
})

module.exports = mongoose.model("doctor", DoctorSchema);
