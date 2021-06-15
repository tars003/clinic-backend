const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    appointmentsLeft: Number,
    couponId: String,
    dateCreated: String,
});

module.exports = mongoose.model("package", PackageSchema);
