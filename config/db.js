const mongoose = require('mongoose');
const dns = require('dns');
// Use Google DNS for SRV resolution (fixes ECONNREFUSED on some networks)
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
