import express from 'express';
import cors from 'cors';
import inventoryRouter from './routes/inventory.js';
import dashboardRouter from './routes/dashboard.js';


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SariServe API is running');
});

app.use('/api/inventory', inventoryRouter);
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});