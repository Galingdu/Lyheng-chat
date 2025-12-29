import express from 'express';
import cors from 'cors';
import authRoute from './routes/auth.route.js';
import chatRoute from './routes/chat.route.js';
import userRoute from './routes/user.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('src/uploads'));

app.use('/api/auth', authRoute);
app.use('/api/chat', chatRoute);
app.use('/api/users',userRoute);

export default app;
