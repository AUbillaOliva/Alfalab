const mongoose = require("mongoose");
const ClientSchema = require("./Clients");
const OrderSchema = require("./Order");

const OrdersSchema = new mongoose.Schema({
  orderList: {
    type: [OrderSchema],
    required: true,
  },
  client: {
    type: ClientSchema,
    required: true,
  },
  zone: {
    type: String,
    required: false,
    lowercase: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: String,
    required: true,
  },
  orders_number: {
    type: Number,
    unique: true,
    ref: "orders_number",
    lowercase: true,
  },
  delivered_by: {
    type: String,
    lowercase: true,
  },
  delivered_date: {
    type: String,
  },
  total: {
    type: String,
  },
});

module.exports = OrdersSchema;
