const mongoose = require('mongoose');
const UserSchema = require('./User');

const OrderSchema = new mongoose.Schema({
  responsible: {
    type: UserSchema
  },
  order_type: {
    type: String,
    lowercase: true,
    required: true
  },
  commentaries: {
    type: String,
    lowercase: true
  },
  checkin: {
    type: String,
    lowercase: true
  },
  checkout: {
    type: String,
    lowercase: true
  },
  status: {
    type: Boolean
  },
  digitized: {
    type: Boolean
  },
  price: {
    type: Number
  },
  level: {
    type: Number
  }
});

module.exports = OrderSchema;