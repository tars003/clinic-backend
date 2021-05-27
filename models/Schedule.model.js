const mongoose = require('mongoose');

const ScheduleSchema = mongoose.Schema({
    _id: String,
    slots: [
        {
            booked: Boolean,
            slot: String
        }
    ]
})

module.exports = mongoose.model("schedule", ScheduleSchema);
