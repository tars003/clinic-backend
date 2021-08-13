const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    gender: String,
    age: Number,
    isIndian: Boolean,
    address: String,
    package: {
        name: String,
        consultationsLeft: Number,
        createdAt: String,
        validTill: String
    },
    performa: [
        {
            _id: String,
            value:String
        }
    ],
    profiles: [
        {
            name: String,
            gender: String,
            age: Number,
            package: {
                name: String,
                consultationsLeft: Number,
                createdAt: String,
                validTill: String
            },
            performa: [
                {
                    _id: String,
                    value:String
                }
            ]
        }
    ]
})

module.exports = mongoose.model("patient", PatientSchema);
