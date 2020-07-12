const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const autoincrement = require('mongoose-auto-increment');
const OrderSchema = require('../../modules/Orders');

const Order = require('../../modules/Orders');

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

router.post('/:id?', 
  [
    [
      check('responsible').not().isEmpty(),
      check('checkin').not().isEmpty()
    ]
  ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }

    const {
      number,
      commentaries,
      responsible,
      checkin,
      checkout,
      orderType,
      status,
      price,
      client
    } = req.body;

    const orderFields = {};
    if(number){ orderFields.number = number; }
    if(commentaries){ orderFields.commentaries = commentaries.split(',').map(commentary => commentary.trim()); }
    if(checkin){ orderFields.checkin = checkin; }
    if(checkout) { orderFields.checkout = checkout; }
    if(orderType) { orderFields.orderType = orderType; }
    if(status) { orderFields.status = status; }
    if(price) { orderFields.price = price; }
    if(client) { orderFields.client = client; }
    if(responsible) { orderFields.responsible = responsible; }

    try {
      Order = mongoose.model('order', OrderSchema);
      if(req.params.id){
        let order = await Order.findOne({number: req.params.id});
        if(order) {
          order = await Order.findOneAndUpdate({
            $set: orderFields,
            new: false
          });
          console.log(`Order ${order._id} updated`);
          return res.json(order);
        }
      } else {
        order = new Order(orderFields);
        await order.save();
        console.log(`Order ${order._id} created`);
        res.json(order);
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
      await Order.findOneAndRemove({id: order._id});
      console.log('Order deleted');
      res.send(`Order ${order._id} deleted`).status(200);
    } else {
      res.send('Order not found').status(404);
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
