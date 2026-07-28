import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import masterRoutes from './routes/masterRoutes';
import employeeRoutes from './routes/employeeRoutes';
import assetRoutes from './routes/assetRoutes';
import ticketRoutes from './routes/ticketRoutes';
import licenseRoutes from './routes/licenseRoutes';
import infrastructureRoutes from './routes/infrastructureRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/master', masterRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/infrastructure', infrastructureRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
