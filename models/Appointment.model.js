const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    timeSlot: String,
    patientId: mongoose.Schema.Types.ObjectId,
    date: String,
    name: String,
    gender: String,
    phone: String,
    age: Number,
    email: String,
    problem: String,
    coupon: {
        type: String,
        required: false
    },
    reports: {
        type: [String],
        required: false
    },
    consultationStatus: {
        type: String,
        default: 'UPCOMING'
    },
    paymentStatus: {
        type: String,
        default: 'INCOMPLETE'
    },
    fees: {
        type: String,
        required: false
    },
    docId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }
})

module.exports = mongoose.model("appointment", AppointmentSchema);
