const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    lowercase: true,
  },
  lastname: {
    type: String,
    required: true,
    lowercase: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
  },
  profileImage: {
    type: String,
  },
});

module.exports = UserSchema;
