const mongoose = require('mongoose');
const dns = require('dns');

// Some networks/ISPs don't resolve the special "SRV" DNS records that
// mongodb+srv:// connection strings rely on. Pointing at Google's public
// DNS servers works around it. This runs once, for any script that
// requires this file (server.js, seed/seedAdmin.js, seed/setPassword.js).
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error(
      '\nMONGO_URI is missing.\n' +
      'This usually means there is no .env file next to server.js, or it\n' +
      'wasn\'t saved correctly. Copy .env.example to .env and fill in your\n' +
      'real MongoDB Atlas connection string, then try again.\n'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
