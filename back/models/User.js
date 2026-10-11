const mongoose = require("mongoose");

const favoritePokemonSchema = new mongoose.Schema({
  code: { type: String, default: null },
  shiny: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  _id: { type: String , required: true},
  displayName: { type: String, trim: true, maxlength: 32, default: null },
  favoritePokemon: { type: favoritePokemonSchema, default: () => ({}) },
  achievements: { type : Array, required : false},
  achievementsPoints : {type : Number, required : true, default : 0},
  selectedTitleAchievementNumber: { type: Number, default: null }
}, { timestamps: false }, { _id: false });

module.exports = mongoose.model("User", userSchema);