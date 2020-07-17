const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const OrderSchema = require('../../modules/Orders');
const autoincrement = require('mongoose-auto-increment');
const mongoose = require('mongoose');
OrderSchema.plugin(autoincrement.plugin, { model: 'orders', field: 'number', startAt: 0, incrementBy: 1 });
const Order = mongoose.model('orders', OrderSchema);

const Delivered = mongoose.model('delivered', OrderSchema);

router.get('/', async (req, res) => {
  try {
    const data = await Delivered.find().populate('data');
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

router.post('/', 
  [
    [
      check('responsible').not().isEmpty(),
      check('checkin').not().isEmpty(),
      //check('checkout').not().isEmpty(),
      check('client.firstname').not().isEmpty(),
      check('client.lastname').not().isEmpty()
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
      client
    } = req.body;

    const deliveryFields = {};    
    if(commentaries){ deliveryFields.commentaries = commentaries }
    if(checkin){ deliveryFields.checkin = checkin; }
    if(checkout) { deliveryFields.checkout = checkout; }
    if(orderType) { deliveryFields.orderType = orderType; }
    if(status) { deliveryFields.status = status; }
    if(price) { deliveryFields.price = price; }
    if(client) { deliveryFields.client = client; }
    if(responsible) { deliveryFields.responsible = responsible; } 
    
    try {
      let delivery = await Delivered.findOne(deliveryFields);
      if(delivery) {
        delivery = await Delivered.findOneAndUpdate({
          $set: deliveryFields,
          new: true
        });
        console.log(`Delivery ${delivery._id} updated`);
        res.send(delivery).status(200);
      } else {
        delivery = new Delivered(deliveryFields);
        await delivery.save();
        console.log(`Delivery ${delivery._id} created`);
        res.send(delivery).status(200);
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
