const mongoose = require('mongoose');
const autoincrement = require('mongoose-auto-increment');

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

OrderSchema.plugin(autoincrement.plugin, { model: 'orders', field: 'number', startAt: 0, incrementBy: 1 });
const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;