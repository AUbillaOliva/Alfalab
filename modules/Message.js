const mongoose = require("mongoose");
const UserSchema = require("./User");

const messageSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  author: {
    type: UserSchema,
    ref: "user",
  },
  created_at: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("message", messageSchema);
