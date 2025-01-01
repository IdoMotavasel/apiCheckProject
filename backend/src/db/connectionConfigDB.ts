import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL: string = process.env.MONGO_URL!; 

const connectToDB = async ():Promise<void> => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

mongoose.connection.on('error', (error: Error) => console.log(error));

export default connectToDB;