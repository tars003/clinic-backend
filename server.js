const express = require('express');
require("dotenv").config();


const connectDB = require('./util/db');
const app = express();
connectDB();

app.use(express.json());
app.use("/patient", require('./routes/patient.route'));
app.use("/appointment", require('./routes/appointment.route'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
