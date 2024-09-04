import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';

const app = express();

// Configuration
const MONGODB_CONNECTION_URL = 'mongodb+srv://root:root@cluster0.83gwozp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB connection URL

// Middleware setup
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// Define Mongoose schemas and models
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const invoiceSchema = mongoose.Schema({
    partyname: { type: String, required: true },
    materialname: { type: String, required: true },
    materialmake: { type: String, required: true },
    partno: { type: String, required: true },
    invoiceNo: { type: String, required: true },
    rate: { type: String, required: true },
    warrenty: { type: String, required: true },
    purchasedata: { type: String, required: true },
    barCodeNo: { type: String, required: true },
    Unit: { type: String, required: true },
    area: { type: String, required: true },
    installData: { type: String, required: true },
});
const Invoice = mongoose.model('Invoice', invoiceSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User registration and login routes
app.post('/register', asyncHandler(async (req, res) => {
    const { name, number, password } = req.body;

    const existingUser = await User.findOne({ number });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, number, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
}));

app.post('/login', asyncHandler(async (req, res) => {
    const { number, password } = req.body;

    const user = await User.findOne({ number });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid number or password' });
    }

    res.status(200).json({ message: 'Login successful' });
}));

app.post('/forgot-password', asyncHandler(async (req, res) => {
    const { number, newPassword } = req.body;

    const user = await User.findOne({ number });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
}));

// Invoice routes
app.post('/invoicesCreate', asyncHandler(async (req, res) => {
    const newInvoice = new Invoice(req.body);
    await newInvoice.save();
    res.status(201).json(newInvoice);
}));

app.get('/invoicesGet', asyncHandler(async (req, res) => {
    const invoices = await Invoice.find();
    res.status(200).json(invoices);
}));

app.get('/invoicesGet/:id', asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
}));

app.put('/invoicesUpdate/:id', asyncHandler(async (req, res) => {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
}));

app.delete('/invoicesDelete/:id', asyncHandler(async (req, res) => {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json({ message: 'Invoice deleted successfully' });
}));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
