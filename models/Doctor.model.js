const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    slot1: {
        consultationTime: Number,
        gapTime: Number,
        startTime1: String,
        endTime1: String,
        startTime2: String,
        endTime2: String,
        startTime3: String,
        endTime3: String
    },
    slot2: {
        consultationTime: Number,
        gapTime: Number,
        startTime1: String,
        endTime1: String,
        startTime2: String,
        endTime2: String,
        startTime3: String,
        endTime3: String
    },
    slot3: {
        consultationTime: Number,
        gapTime: Number,
        startTime1: String,
        endTime1: String,
        startTime2: String,
        endTime2: String,
        startTime3: String,
        endTime3: String
    },
    performa: [
        {
            _id: String,
            description:String
        }
    ],
    fee : Number
})

module.exports = mongoose.model("doctor", DoctorSchema);
