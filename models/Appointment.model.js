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
    consultationLink: {
        type: String,
        default: ''
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
        age: Number,
        phone: String,
        doctorEmail: String,
        patientEmail: String,
    },
    prescription: {
        instructions: String,
        precautions: String,
        tests: String,
        field1: String,
        field2: String,
        field3: String,
        field4: String,
        field5: String,
    },
    consultationPerforma: [
        {
            _id: String,
            description: String
        }
    ],
    orderId: {
        type: String,
        required: false
    },
    receipt: [
        String,
    ],
    followPerforma: [
        {
            _id: String,
            description:String
        }
    ],
})

module.exports = mongoose.model("appointment", AppointmentSchema);
