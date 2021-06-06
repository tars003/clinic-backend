const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    timeSlot: String,                                     // manual
    patientId: mongoose.Schema.Types.ObjectId,            // auto from auth token
    date: String,                                         // manual for now
    name: String,                                         // manual for now
    gender: String,                                       // manual for now
    phone: String,                                        // manual for now
    age: Number,                                          // manual for now
    email: String,                                        // manual for now
    problem: String,                                      // manual for now
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
