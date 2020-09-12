const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  responsible: {
    type: String,
    lowercase: true,
    required: true
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