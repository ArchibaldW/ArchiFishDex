const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  tier: {type : String, required: true},
  value: {type : Number, required: true},
  title: {type: String, default: null}
}, { timestamps: false });

module.exports = mongoose.model("Achievement", achievementSchema);