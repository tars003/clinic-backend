const mongoose = require('mongoose');

const ScheduleSchema = mongoose.Schema({
    _id: String,
    slots: [
        {
            booked: Boolean,
            slot: String,
            appointmentId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            }
        }
    ]
})

module.exports = mongoose.model("schedule", ScheduleSchema);
