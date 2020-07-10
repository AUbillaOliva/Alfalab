const mongoose = require('mongoose');
const config = require('config');
const db = process.env.MONGO_URI;


const connectDB = async (req, res) => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('db connected');
  } catch(err) {
    console.error(err);
  }
}

module.exports = connectDB;
