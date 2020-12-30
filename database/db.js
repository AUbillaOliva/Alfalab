const mongoose = require("mongoose");
const db = process.env.MONGO_URI;

const connectDB = async (req, res) => {
  try {
    await mongoose
      .connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      })
      .then(() => {
        console.log("Database connected");
      })
      .catch((error) => {
        console.log(error.message);
      });
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = connectDB;
