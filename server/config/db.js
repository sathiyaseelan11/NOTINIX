const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is missing in .env');
            process.exit(1);
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Note: Server will continue running but database operations will fail.');
    }
};

module.exports = connectDB;
