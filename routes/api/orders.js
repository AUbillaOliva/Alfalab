const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const OrderSchema = require('../../modules/Orders');
const mongoose = require('mongoose');
const autoincrement = require('mongoose-auto-increment');


OrderSchema.plugin(autoincrement.plugin, { model: 'orders', field: 'number', startAt: 0, incrementBy: 1 });
const Order = mongoose.model('orders', OrderSchema);

router.get('/', async (req, res) => {
  try {
    const data = await Order.find().populate('data');
    if(!data){
      res.status(404).send({
        msg: 'There is not orders'
      })
    } else {
      res.send(data);
    }
  } catch(err){
    console.error(err);
  }
});

router.post('/:number?', 
  [
    [
      check('responsible').not().isEmpty(),
      check('checkin').not().isEmpty(),
      check('client.firstname').not().isEmpty(),
      check('client.lastname').not().isEmpty(),
      check('quantity').not().isEmpty()
    ]
  ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }

    const {
      commentaries,
      responsible,
      checkin,
      checkout,
      orderType,
      status,
      price,
      client,
      quantity
    } = req.body;

    const orderFields = {};    
    if(commentaries){ orderFields.commentaries = commentaries }
    if(checkin){ orderFields.checkin = checkin; }
    if(checkout) { orderFields.checkout = checkout; }
    if(orderType) { orderFields.orderType = orderType; }
    if(status) { orderFields.status = status; }
    if(price) { orderFields.price = price; }
    if(client) { orderFields.client = client; }
    if(responsible) { orderFields.responsible = responsible; } 
    if(quantity) { orderFields.quantity = quantity; }
    
    try {
      let order = await Order.findOne({number: req.params.number});
      if(order) {
        order = await Order.findOneAndUpdate({
          $set: orderFields,
          new: true
        });
        console.log(`Order ${order._id} updated`);
        res.send(order).status(200);
      } else {
        order = new Order(orderFields);
        await order.save();
        console.log(`Order ${order._id} created`);
        res.send(order).status(200);
      }
    } catch(err){
      console.error(err);
      res.status(500).send('server error');
    }
});

router.delete('/:number', async (req, res) => {
  try {
    let order = await Order.findOne({ number: req.params.number });
    console.log(order);
    if(order){
      await Order.findByIdAndRemove(order._id);
      console.log(`Order ${order._id} deleted`);
      res.send(`Order ${order._id} deleted`).status(200);
    } else {
      res.send('Order not found').status(404);
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
