const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
    _id: String,
    percentOff: Number,
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: String,
    endDate: String,
    isOneTime: {
        type: Boolean,
        default: false
    },
    patients : [
        {
            _id: String,
            appointmentId: String
        }
    ],
    exclusivePatients : [
        String
    ]
})

module.exports = mongoose.model("packageCoupon", CouponSchema);
