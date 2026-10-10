const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String , required: true},
  displayName: { type: String, trim: true, maxlength: 32, default: null },
  favoritePokemonCode: { type: String, default: null },
  favoritePokemonShiny: { type: Boolean, default: false },
  achievements: { type : Array, required : false},
  achievementsPoints : {type : Number, required : true, default : 0},
  selectedTitleAchievementNumber: { type: Number, default: null }
}, { timestamps: false }, { _id: false });

module.exports = mongoose.model("User", userSchema);