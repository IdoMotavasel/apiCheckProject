import express,{ Express } from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import cors from 'cors';
import connectToDB from './db/connectionConfigDB';
import router from './routes/serverRouter';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app: Express = express();

// Enable compression
app.use(compression());

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials:true, // Allow cookies and other credentials
}));

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Middleware to parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

//Connection to db
connectToDB();

const PORT: string = process.env.PORT!;

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use('/',router());