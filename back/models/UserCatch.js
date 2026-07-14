const mongoose = require("mongoose");

const catchSchema = new mongoose.Schema({
  username: { type: String, required: true },
  code: { type: String, required: true },
  shiny: { type: Boolean, required: true },
  weight: { type: Number, required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true }
}, { timestamps: false });

module.exports = mongoose.model("UserCatch", catchSchema);