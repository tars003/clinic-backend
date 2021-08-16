const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    uid: String,
    name: String,
    description: String,
    qty: String,
    cost : Number
})

module.exports = mongoose.model("product", ProductSchema);
