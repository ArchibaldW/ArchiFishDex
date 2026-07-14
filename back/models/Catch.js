const mongoose = require("mongoose");

const catchSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gen: { type: Number, required: true },
  tags: { type: [String], required: true },
  type1: { type: String, required: false },
  type2: { type: String, required: false },
}, { timestamps: false });

module.exports = mongoose.model("Catch", catchSchema);