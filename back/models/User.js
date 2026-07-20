const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String , required: true},
  achievements: { type : Array, required : false},
  achievementsPoints : {type : Number, required : true, default : 0}
}, { timestamps: false }, { _id: false });

module.exports = mongoose.model("User", userSchema);