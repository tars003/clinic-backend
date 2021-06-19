const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: String,
    patientType: String,
    consultations: Number,
    validity: Number,
    price: Number,
    isIndian : Boolean
});

module.exports = mongoose.model("packages", PackageSchema);
