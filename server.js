require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;

app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initiera databas och förskapat admin-konto med miljövariabel (render)
async function initDb() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE, password TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, price NUMERIC NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, guests INT NOT NULL, message TEXT)`);

        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'SvartVitt1';
        const hashedPassword = await bcrypt.hash(adminPass, 10);
        
        await pool.query(
            `INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`, 
            [adminUser, hashedPassword]
        );
        console.log('DB connected.');
    } catch (err) {
        console.log('DB error:', err.message);
    }
}
initDb();

// --- Publika Routes ---

app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Kunde inte hämta menyn.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Fyll i användarnamn och lösenord.' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Felaktiga uppgifter.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
        res.json({ message: 'Inloggning lyckades!', token });
    } catch {
        res.status(500).json({ error: 'Serverfel vid inloggning.' });
    }
});

app.post('/api/bookings', async (req, res) => {
    const { name, email, phone, date, time, guests, message } = req.body;
    if (!name || !email || !phone || !date || !time || !guests) {
        return res.status(400).json({ error: 'Alla fält måste fyllas i.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO bookings (name, email, phone, date, time, guests, message) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, phone, date, time, guests, message || '']
        );
        res.status(201).json({ message: 'Bokningen har tagits emot!', booking: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Kunde inte spara bokningen.' });
    }
});


// --- AUTH Middleware ---

function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Åtkomst nekad!' });

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ error: 'Ogiltig token.' });
        req.user = user;
        next();
    });
}


// --- Skyddade Routes (Admin Meny CRUD) ---

app.post('/api/menu', verifyToken, async (req, res) => {
    const { title, description, price } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'Titel och pris är obligatoriska.' });

    try {
        const result = await pool.query(
            'INSERT INTO menu_items (title, description, price) VALUES ($1, $2, $3) RETURNING *',
            [title, description, price]
        );
        res.status(201).json({ message: 'Rätt tillagd!', item: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Kunde inte lägga till rätten.' });
    }
});

app.put('/api/menu/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, price } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'Titel och pris är obligatoriska.' });

    try {
        const result = await pool.query(
            'UPDATE menu_items SET title = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
            [title, description, price, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Hittades inte.' });
        res.json({ message: 'Rätten har uppdaterats!', item: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Kunde inte uppdatera rätten.' });
    }
});

app.delete('/api/menu/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Hittades inte.' });
        res.json({ message: 'Rätten har raderats!' });
    } catch {
        res.status(500).json({ error: 'Kunde inte radera rätten.' });
    }
});


// --- Skyddade Routes (Admin Bookings) ---

app.get('/api/bookings', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Kunde inte hämta bokningar.' });
    }
});

app.delete('/api/bookings/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Bokningen hittades inte.' });
        res.json({ message: 'Bokningen raderades!' });
    } catch {
        res.status(500).json({ error: 'Kunde inte radera bokningen.' });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));