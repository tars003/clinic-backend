const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    gender: String,
    age: Number,
    package: {
        name: String,
        consultationsLeft: Number,
        createdAt: String,
        validTill: String
    }
})

module.exports = mongoose.model("patient", PatientSchema);
