
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not set. Please configure a remote MongoDB connection string (e.g., Atlas) in backend/.env');
      process.exit(1);
    }
    console.log(`Attempting MongoDB connection to: ${mongoUri}`);
    const conn = await mongoose.connect(mongoUri, {
      // connection options can be configured here
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Verify your MONGO_URI (network/IP whitelist, credentials, and SRV DNS)');
    process.exit(1);
  }
};

export default connectDB;
