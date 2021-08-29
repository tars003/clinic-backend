const mongoose = require('mongoose');

const url = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

const dbUrl = process.env.ENVIRONMENT == 'DEV' ? process.env.MONGO_URI : url;

const connectDB = () => {
    mongoose
        .connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => console.log("db connected"))
        .catch((err) => console.log(err));
}

module.exports = connectDB;
