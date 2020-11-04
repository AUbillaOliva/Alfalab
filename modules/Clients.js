const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    lowercase: true
  },
  lastname: {
    type: String,
    required: true,
    lowercase: true
  },
  instagram: {
    type: String,
    lowercase: true
  },
  email: {
    type: String,
    lowercase: true
  }
});

module.exports = ClientSchema;
