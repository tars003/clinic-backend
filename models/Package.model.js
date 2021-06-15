const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: String,
    patientType: String,
    consultations: Number,
    validity: Number,
    price: String,
});

module.exports = mongoose.model("basepackage", PackageSchema);
