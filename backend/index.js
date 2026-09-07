//backend/index.js
import express from 'express';
import cors from 'cors';
import dashboardRouter from './routes/dashboard.js';
import inventoryRouter from './routes/inventory.js';
import salesRouter from './routes/sales.js';
import utangRouter from './routes/utang.js';
import authRouter from './routes/auth.js';
import session from 'express-session'; //middleware

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// ← idagdag ito BAGO yung routes
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
}));

app.get('/', (req, res) => {
  res.send('SariServe API is running');
});

app.use('/api/inventory', inventoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sales', salesRouter);
app.use('/api/utang', utangRouter);
app.use('/api/local-auth', authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});