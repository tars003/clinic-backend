const mongoose = require("mongoose");
const moment = require('moment');

const ChatSchema = new mongoose.Schema({
    _id: String,
    isReadPatient :  Boolean,
    isReadDoctor : Boolean,
    messages: [
        {
            sentTime: String,
            text:String,
            isSenderPatient: Boolean,
            appointmentId: String
        }
    ],
})

module.exports = mongoose.model("chat", ChatSchema);
