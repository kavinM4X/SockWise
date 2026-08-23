import mongoose from 'mongoose';

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error('Error: MONGO_URI or MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true, // Set to true for development
  };

  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(MONGO_URI, options);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination (SIGINT)');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination (SIGTERM)');
    process.exit(0);
  });
};

export default connectDB;
