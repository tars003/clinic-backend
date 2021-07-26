const express = require('express');
const cors = require('cors');
require("dotenv").config();


const connectDB = require('./util/db');
const app = express();
connectDB();

app.use(express.json());
app.use(cors());
app.use("/patient", require('./routes/patient.route'));
app.use("/performa", require('./routes/performa.route'));
app.use("/appointment", require('./routes/appointment.route'));
app.use("/profile", require('./routes/profile.route'));
app.use("/package", require('./routes/package.route'));
app.use("/schedule", require('./routes/schedule.route'));
app.use("/doctor", require('./routes/doctor.route'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
