const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const httpError = require('http-errors');
const OrdersSchema = require('../../modules/Orders');
const mongoose = require('mongoose');
const Delivered = mongoose.model('delivered', OrdersSchema);
const auth = require('../../middleware/auth');

/**
@route   GET api/delivered
@desc    Return list of delivered orders
@access  Public
*/
router.get('/', async (req, res) => {
  try {
    const data = await Delivered.find().populate('data');
    if(!data) {
      res.status(200).send({ msg: 'There is not orders' });
    } else {
      res.status(200).send(data);
    }
  } catch(error){
    console.error(error.message);
    res.status(500).send(httpError.InternalServerError('Server error'));
  }
});

/**
@route   POST api/delivered
@desc    Saves/update order in db
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
    return res.status(400).json({errors: errors.array()});
  }

  const {
    orderList,
    client,
    zone,
    delivered_by,
    created_at,
    delivered_date,
    total,
    status,
    orders_number
  } = req.body;

  const deliveryFields = {};    
  if(orderList) { deliveryFields.orderList = orderList; }
  if(client) { deliveryFields.client = client; }
  if(zone) { deliveryFields.zone = zone; }
  if(delivered_by) { deliveryFields.delivered_by = delivered_by; }
  if(orders_number) { deliveryFields.orders_number = orders_number; }
  if(created_at) { deliveryFields.created_at = created_at; }
  if(delivered_date) { deliveryFields.delivered_date = delivered_date; }
  if(total) { deliveryFields.total = total; }
  if(status != null || status != undefined) { deliveryFields.status = status; }
  
  try {
    let delivery = await Delivered.findOne({ orders_number: req.params.number });
    if(delivery) {
      delivery = await Delivered.findOneAndUpdate({orders_number: req.params.number}, {
        $set: deliveryFields,
        new: false
      });
      console.log(`Delivery ${delivery._id} updated`);
      res.send(delivery).status(200);
    } else {
      delivery = new Delivered(deliveryFields);
      await delivery.save();
      console.log(`Delivery ${delivery._id} created`);
      res.status(200).send(delivery);
    }
  } catch(error){
    console.error(error.message);
    res.status(500).send(httpError.InternalServerError('Server error'));
  }
});

/**
@route   DELETE api/delivered
@desc    delete delivery
@param   number
@access  Private
*/
router.delete('/:number', auth, async (req, res) => {
  try {
    let delivery = await Delivered.findOne({ orders_number: req.params.number });
    if(delivery) {
      await Delivered.findByIdAndRemove(delivery._id);
      console.log(`Delivery ${delivery._id} deleted`);
      res.status(200).send(`Delivery ${delivery._id} deleted`);
    } else {
      res.status(404).send(httpError.NotFound('Delivery not found'));
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(httpError.InternalServerError('Server error'));
  }
});

module.exports = router;
