const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
    _id: String,
    percentOff: Number,
    isActive: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model("coupon", CouponSchema);
