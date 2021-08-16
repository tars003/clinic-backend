const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    timeSlot: String,                                     // manual
    patientId: mongoose.Schema.Types.ObjectId,            // auto from auth token
    date: String,                                         // manual for now
    coupon: {
        type: String,
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
    },
    info: {
        _id: String,
        name: String,
        gender: String,
        age: Number
    },
    prescription: {
        instructions: String,
        precautions: String,
        tests: String,
        field1: String,
        field2: String
    },
    consultationPerforma: [
        {
            _id: String,
            description: String
        }
    ],
})

module.exports = mongoose.model("appointment", AppointmentSchema);
