const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const httpError = require('http-errors');
const OrdersSchema = require('../../modules/Orders');
const mongoose = require('mongoose');
const autoincrement = require('mongoose-auto-increment');
const auth = require('../../middleware/auth');
OrdersSchema.plugin(autoincrement.plugin, { model: 'orders', field: 'orders_number', startAt: 0, incrementBy: 1 });
const Orders = mongoose.model('orders', OrdersSchema);

/**
@route   GET api/orders
@desc    Return orders from db
@access  Public
*/
router.get('/', async (req, res) => {
  try {
    const data = await Orders.find().populate('data');
    if(!data) {
      res.status(200).json({ msg: 'There is not orders' });
    } else {
      res.status(200).send(data);
    }
  } catch(error) {
    console.error(error.message);
    res.status(500).send(httpError.InternalServerError('Server error'));
  }
});

/**
@route   POST api/orders
@desc    Create/Update order
@param   number
@access  Private
*/
router.post('/:number?', 
  [
    [
      check('orderList').not().isEmpty(),
      check('client.firstname').not().isEmpty(),
      check('client.lastname').not().isEmpty(),
      check('created_at').not().isEmpty(),
      check('status').not().isEmpty()
    ]
  ], auth, async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      orderList,
      client,
      zone,
      delivered_by,
      created_at,
      delivered_date,
      total,
      status
    } = req.body;

    const ordersFields = {};    
    if(orderList) { ordersFields.orderList = orderList; }
    if(client) { ordersFields.client = client; }
    if(zone) { ordersFields.zone = zone; }
    if(delivered_by) { ordersFields.delivered_by = delivered_by; }
    if(created_at) { ordersFields.created_at = created_at; }
    if(delivered_date) { ordersFields.delivered_date = delivered_date; }
    if(total) { ordersFields.total = total; }
    if(status != null || status != undefined) { ordersFields.status = status; }
    
    try {
      let orders = await Orders.findOne({ orders_number: req.params.number });
      if(orders) {
        orders = await Orders.findOneAndUpdate({ orders_number: req.params.number }, {
          $set: ordersFields,
          new: false
        });
        console.log(`Orders ${orders._id} updated`);
        res.status(200).send(orders);
      } else {
        orders = new Orders(ordersFields);
        await orders.save();
        res.status(200).send(orders);
      }
    } catch(error){
      console.error(error.message);
      res.status(500).send(httpError.InternalServerError('Server error'));
    }
});

/**
@route   DELETE api/orders
@desc    Delete order
@param   number
@access  Private
*/
router.delete('/:number', auth, async (req, res) => {
  try {
    let orders = await Orders.findOne({ orders_number: req.params.number });
    if(orders) {
      await Orders.findByIdAndRemove(orders._id);
      console.log(`Orders ${orders._id} deleted`);
      res.status(200).send(`Orders ${orders._id} deleted`);
    } else {
      res.status(404).send(httpError.NotFound('Order not found'));
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(httpError.InternalServerError('Server error'));
  }
});

module.exports = router;
