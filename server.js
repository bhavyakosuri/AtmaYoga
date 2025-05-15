const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/MLYoga'; // Points to MLYoga database
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected to MLYoga database'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Login Schema
const loginSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rememberMe: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Login = mongoose.model('Login', loginSchema, 'login'); // Explicitly set collection name to 'login'

// Root route to serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    const existingUser = await Login.findOne({ email });
    if (existingUser) {
      if (existingUser.password === password) { // In production, use bcrypt.compare
        res.status(200).json({ message: 'Login successful', user: existingUser });
      } else {
        res.status(401).json({ message: 'Incorrect password' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Signup request received:', { name, email, password }); // Debug log

  try {
    const existingUser = await Login.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new Login({
      name,
      email,
      password, // In production, hash with bcrypt
      rememberMe: false,
    });

    await newUser.save();
    console.log('User saved to database:', newUser); // Debug log
    res.status(201).json({ message: 'Account created successfully', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});