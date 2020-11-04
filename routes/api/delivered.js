const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const OrdersSchema = require('../../modules/Orders');
const mongoose = require('mongoose');

const Delivered = mongoose.model('delivered', OrdersSchema);

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
    process.stdout.write('\033c');
    console.error(err);
  }
});

router.post('/:number?', 
[
  [
    check('order').not().isEmpty(),
    check('client.firstname').not().isEmpty(),
    check('client.lastname').not().isEmpty(),
    check('created_at').not().isEmpty(),
    check('status').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    process.stdout.write('\033c');
    return res.status(400).json({errors: errors.array()});
  }

  const {
    order,
    client,
    orders_number,
    zone,
    delivered_by,
    created_at,
    delivered_date,
    total,
    status
  } = req.body;

  const deliveryFields = {};    
  if(order) { deliveryFields.order = order; }
  if(client) { deliveryFields.client = client; }
  if(zone) { deliveryFields.zone = zone; }
  if(delivered_by) { deliveryFields.delivered_by = delivered_by; }
  if(orders_number) { deliveryFields.orders_number = orders_number; }
  if(created_at) { deliveryFields.created_at = created_at; }
  if(delivered_date) { deliveryFields.delivered_date = delivered_date; }
  if(total) { deliveryFields.total = total; }
  if(status != null || status != undefined) { deliveryFields.status = status; }
  
  try {
    let delivery = await Delivered.findOne({orders_number: req.params.number});
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
    process.stdout.write('\033c');
    console.error(err);
    res.status(500).send('server error');
  }
});

router.delete('/:number', async (req, res) => {
  try {
    let delivery = await Delivered.findOne({ orders_number: req.params.number });
    if(delivery){
      await Delivered.findByIdAndRemove(delivery._id);
      console.log(`Delivery ${delivery._id} deleted`);
      res.send(`Delivery ${delivery._id} deleted`).status(200);
    } else {
      res.send('Delivery not found').status(404);
      console.log('Delivery not found');
    }
  } catch (err) {
    process.stdout.write('\033c');
    console.error(err);
    res.send('Server Error').status(500);
  }
});

module.exports = router;
