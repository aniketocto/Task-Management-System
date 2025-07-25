const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoURI", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Mongo DB connected");
  } catch (err) {
    console.error("Error Connecting to MongoDB", err);
    process.exit(1);
  }
};

module.exports = connectDB;