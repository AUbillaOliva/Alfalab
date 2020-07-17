const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  number : {
    type: Number,
    unique: true,
    ref: 'number',
    lowercase: true
  },
  commentaries: {
    type: String,
    lowercase: true
  },
  responsible: {
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
  orderType: {
    type: String,
    lowercase: true
  },
  status: {
    type: Boolean
  },
  price: {
    type: Number
  },
  client: {
    type: mongoose.Schema.Types.Object,
    ref: 'client'
  }
});

module.exports = OrderSchema;