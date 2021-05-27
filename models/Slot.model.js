const mongoose = require('mongoose');

const SlotSchema = mongoose.Schema({
    name: String,
    consultationTime: Number,
    gapTime: Number,
    startTime: String,
    endTime: String,
    docId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
})

module.exports = mongoose.model("slot", SlotSchema);
