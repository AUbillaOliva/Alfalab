const mongoose = require('mongoose');
const autoincrement = require('mongoose-auto-increment');

const OrderSchema = new mongoose.Schema({
  number : {
    type: Number,
    unique: true,
    ref: 'number',
    default: 0
  },
  commentaries: {
    type: [String]
  },
  responsible: {
    type: String
  },
  checkin: {
    type: String
  },
  checkout: {
    type: String
  },
  orderType: {
    type: String
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