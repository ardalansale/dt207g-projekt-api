const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;

// Middleware
app.use(express.json());
app.use(cors());

// Anslutning till Neon (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Krävs för att ansluta säkert till NEON
    }
});

// Skapa tabeller för användare och meny om de inte finns
async function initDb() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS menu_items (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            price NUMERIC NOT NULL
        )`);

        console.log('Ansluten till Neon-databasen och tabeller kontrollerade!');
    } catch (err) {
        console.log('Kunde inte ansluta till databasen:', err.message);
    }
}
initDb();

// PUBLIKA ROUTES

// 1. Hämta alla menyartiklar (används av den publika webbplatsen)
app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte hämta menyn.' });
    }
});

// 2. Registrera ny användare
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Du måste fylla i både användarnamn och lösenord!' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pool.query(
            `INSERT INTO users (username, password) VALUES ($1, $2)`,
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'Kontot är skapat!' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Användarnamnet är redan upptaget.' });
        }
        res.status(500).json({ error: 'Ett serverfel uppstod.' });
    }
});

// 3. Logga in
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Fyll i användarnamn och lösenord.' });
    }

    try {
        const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Felaktigt användarnamn eller lösenord.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Felaktigt användarnamn eller lösenord.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            secretKey, 
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Inloggning lyckades!',
            token: token
        });
    } catch (err) {
        res.status(500).json({ error: 'Ett serverfel uppstod vid inloggning.' });
    }
});

// SKYDDADE ROUTES (Kräver JWT)

// Hjälpfunktion för att kolla om JWT-token är giltig
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Ingen token medföljer. Åtkomst nekad!' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ogiltig eller utgången token.' });
        }
        req.user = user;
        next();
    });
}

// 4. Lägg till ny rätt i menyn (Skyddad)
app.post('/api/menu', verifyToken, async (req, res) => {
    const { title, description, price } = req.body;

    if (!title || !price) {
        return res.status(400).json({ error: 'Titel och pris är obligatoriska.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO menu_items (title, description, price) VALUES ($1, $2, $3) RETURNING *`,
            [title, description, price]
        );
        res.status(201).json({ message: 'Rätt tillagd i menyn!', item: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte lägga till rätten.' });
    }
});

// 5. Radera rätt från menyn (Skyddad)
app.delete('/api/menu/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const result = await pool.query(`DELETE FROM menu_items WHERE id = $1 RETURNING *`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rätten hittades inte.' });
        }

        res.json({ message: 'Rätten har raderats!' });
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte radera rätten.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// 6. Uppdatera rätt i menyn (Skyddad)
app.put('/api/menu/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, price } = req.body;

    if (!title || !price) {
        return res.status(400).json({ error: 'Titel och pris är obligatoriska.' });
    }

    try {
        const result = await pool.query(
            `UPDATE menu_items SET title = $1, description = $2, price = $3 WHERE id = $4 RETURNING *`,
            [title, description, price, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rätten hittades inte.' });
        }

        res.json({ message: 'Rätten har uppdaterats!', item: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte uppdatera rätten.' });
    }
});