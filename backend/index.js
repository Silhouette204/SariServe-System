import express from 'express';
import cors from 'cors';
import dashboardRouter from './routes/dashboard.js';
import inventoryRouter from './routes/inventory.js';
import salesRouter from './routes/sales.js';
import utangRouter from './routes/utang.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SariServe API is running');
});

app.use('/api/inventory', inventoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sales', salesRouter);
app.use('/api/utang', utangRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});