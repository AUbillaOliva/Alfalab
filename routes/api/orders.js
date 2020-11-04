const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const OrdersSchema = require('../../modules/Orders');
const mongoose = require('mongoose');
const autoincrement = require('mongoose-auto-increment');

OrdersSchema.plugin(autoincrement.plugin, { model: 'orders', field: 'orders_number', startAt: 0, incrementBy: 1 });
const Orders = mongoose.model('orders', OrdersSchema);

router.get('/', async (req, res) => {
  try {
    const data = await Orders.find().populate('data');
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
      check('orderList').not().isEmpty(),
      check('client.firstname').not().isEmpty(),
      check('client.lastname').not().isEmpty(),
      check('created_at').not().isEmpty(),
      check('status').not().isEmpty()
    ]
  ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
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
      let orders = await Orders.findOne({orders_number: req.params.number});
      if(orders) {
        orders = await Orders.findOneAndUpdate({orders_number: req.params.number},{
          $set: ordersFields,
          new: false
        });
        console.log(`Orders ${order._id} updated`);
        res.send(order).status(200);
      } else {
        orders = new Orders(ordersFields);
        await orders.save();
        res.send(orders).status(200);
      }
    } catch(err){
      console.error(err);
      res.status(500).send('server error');
    }
});

router.delete('/:number', async (req, res) => {
  try {
    let orders = await Orders.findOne({ orders_number: req.params.number });
    if(orders){
      await Orders.findByIdAndRemove(orders._id);
      console.log(`Orders ${orders._id} deleted`);
      res.send(`Orders ${orders._id} deleted`).status(200);
    } else {
      res.send('Orders not found').status(404);
    }
  } catch (err) {
    process.stdout.write('\033c');
    console.error(err);
  }
});

module.exports = router;
