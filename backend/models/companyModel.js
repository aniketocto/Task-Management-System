const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("Company", companySchema);
