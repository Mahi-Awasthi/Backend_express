const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 🛡 Middleware for Logging Requests
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};

// 🛡 Middleware to Validate Event Form Data
const validateFormData = (req, res, next) => {
    const { eventPurpose, guests, date, budget } = req.body;
    if (!eventPurpose || !guests || !date || !budget) {
        return res.status(400).send('Please fill out all required fields.');
    }
    next();
};

// 🛡 Middleware to Validate Dashboard Form Data
const validateDashboardFormData = (req, res, next) => {
    const { eventName, organizer, venue, date, attendees, budget } = req.body;
    if (!eventName || !organizer || !venue || !date || !attendees || !budget) {
        return res.status(400).send('All fields are required. Please fill out every field before submitting.');
    }
    next();
};

// Apply Logging Middleware Globally
app.use(requestLogger);

// File paths for fallback local storage (not used for /contactone anymore)
const eventFilePath = path.join(__dirname, 'data.json');
const dashboardFilePath = path.join(__dirname, 'dashboard.json');

// Ensure required JSON files exist
if (!fs.existsSync(eventFilePath)) fs.writeFileSync(eventFilePath, '[]');
if (!fs.existsSync(dashboardFilePath)) fs.writeFileSync(dashboardFilePath, '[]');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// MONGOOSE SCHEMAS AND MODELS

const contactSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    fname1: String,
    lname1: String,
    email: String,
    phone: String,
    add: String,
    add1: String,
    add2: String,
    city: String,
    state: String,
    code: Number,
    c: String,
    w: Date,
    cat: String,
    guest: Number,
    dest: String,
    text: String,
});

const Contact = mongoose.model('Contact', contactSchema);

const eventSchema = new mongoose.Schema({
    eventPurpose: { type: String, required: true },
    guests: { type: String, required: true },
    date: { type: String, required: true },
    budget: { type: String, required: true },
    theme: String,
    venue: String,
    foodBeverage: String,
    entertainment: [String],
    decorations: String
});

const Event = mongoose.model('Event', eventSchema);

// SAVE CONTACT DATA TO MONGODB (POST)
app.post('/contactone', async (req, res) => {
    try {
        const newContact = new Contact(req.body);
        await newContact.save();
        console.log('New Contact Saved to MongoDB:', newContact);
        res.send('Contact Data Saved to MongoDB Successfully!');
    } catch (err) {
        console.error('MongoDB Contact Save Error:', err);
        res.status(500).send('Server Error');
    }
});

// EVENT FORM SAVE TO DB
app.post('/formdata', validateFormData, async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        console.log('New Event Saved to MongoDB:', newEvent);
        res.send('Event Data Saved to MongoDB Successfully!');
    } catch (err) {
        console.error('MongoDB Save Error:', err);
        res.status(500).send('Server Error');
    }
});

// DASHBOARD SAVE TO FILE
app.post('/dashboard-submit', validateDashboardFormData, (req, res) => {
    const newDashboardEntry = req.body;

    fs.readFile(dashboardFilePath, 'utf8', (err, data) => {
        let dashboardEntries = [];
        if (!err && data) {
            dashboardEntries = JSON.parse(data);
        }

        dashboardEntries.push(newDashboardEntry);

        fs.writeFile(dashboardFilePath, JSON.stringify(dashboardEntries, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send('Server Error');
            }
            console.log('New Dashboard Entry:', newDashboardEntry);
            res.send('Dashboard Data Submitted Successfully!');
        });
    });
});

// GET EVENTS WITH FILTERS
app.get('/events', async (req, res) => {
    try {
        const query = {};
        for (let key in req.query) {
            if (req.query[key]) {
                query[key] = new RegExp(req.query[key], 'i'); // case-insensitive
            }
        }
        const events = await Event.find(query);
        res.json(events);
    } catch (err) {
        console.error('MongoDB Query Error:', err);
        res.status(500).send('Server Error');
    }
});

// PAGE ROUTES (GET)
app.get('/contact', (req, res) => res.render('contact'));
app.get('/about', (req, res) => res.render('About'));
app.get('/portfolio', (req, res) => res.render('portfolio'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/celebration', (req, res) => res.render('celebration'));
app.get('/ceremonie', (req, res) => res.render('ceremonie'));
app.get('/reception', (req, res) => res.render('reception'));
app.get('/mitzvhans', (req, res) => res.render('mitzvhans'));
app.get('/corporate1', (req, res) => res.render('corporate1'));
app.get('/services', (req, res) => res.render('services'));

// MONGODB CONNECTION + SERVER
mongoose.connect('mongodb+srv://mahiawasthi2994:adminmongodb@cluster0.vqmlily.mongodb.net/Cosmic')
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(3000, () => {
        console.log('🚀 Server running on http://localhost:3000');
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});
