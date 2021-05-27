const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    gender: String,
    age: Number
})

module.exports = mongoose.model("patient", PatientSchema);
