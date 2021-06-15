const jwt = require("jsonwebtoken");

const Patient = require("../models/Patient.model");

module.exports = async function (req, res, next) {
  const token = req.get("auth-token");

  if(token) {
    // console.log(token);
    const { data } = jwt.verify(token, process.env.JWT_SECRET);
    const id = data.id;
    // console.log(id)
    if(id == 'admin'){
      next();
    }
    else {
      let user = await Patient.findById(id);
      // If User is found
      if (user) {
        // console.log(user);
        req.body.data = user;
        next();
      }
      // If user is not found
      else {
        res.status(500).json({ error: "auth token corrupted" });
      }
    }
  }
  else {
    return res.status(404).json({ error: 'no jwt provided' })
  }
};
