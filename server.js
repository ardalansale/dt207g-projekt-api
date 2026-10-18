// Importera nödvändiga paket
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Hemlig nyckel för JWT (obs. lägg in i .env)
const JWT_SECRET = 'min_hemliga_nyckel_123';

// Förenklad "databas" i minnet för att hålla koden enkel och lätt att köra igång
let users = []; // Här lagras registrerade användare
let menuItems = [
    { id: 1, title: 'Pizza Margherita', description: 'Tomatsås, mozzarella, basilika', price: 110 },
    { id: 2, title: 'Pizza Vesuvio', description: 'Tomatsås, mozzarella, skinka', price: 120 }
];


// PubliC Routes (Ingen inloggning krävs)

// 1. Hämta alla menyartiklar (används av den publika webbplatsen)
app.get('/api/menu', (req, res) => {
    res.json(menuItems);
});

// 2. Registrera en ny användare (admin)
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Hasha lösenordet av säkerhetsskäl
        const hashedPassword = await bcrypt.hash(password, 10);
        
        users.push({ email, password: hashedPassword, name });
        res.status(201).json({ message: 'Användare skapad framgångsrikt!' });
    } catch (err) {
        res.status(500).json({ error: 'Ett fel uppstod vid registrering.' });
    }
});

// 3. Logga in och få en JWT-token
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ error: 'Felaktig e-post eller lösenord.' });
    }

    // Jämför lösenordet
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Felaktig e-post eller lösenord.' });
    }

    // Skapa en JWT-token som gäller i 1 timme
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Inloggning lyckades!', token });
});


// Protected Routes (Kräver giltig JWT-token)

// Middleware för att kontrollera JWT-token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Åtkomst nekad. Ingen token medföljer.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ogiltig eller utgången token.' });
        }
        req.user = user;
        next();
    });
}

// 4. Lägg till en ny rätt i menyn (Skyddad route)
app.post('/api/menu', verifyToken, (req, res) => {
    const { title, description, price } = req.body;

    if (!title || !price) {
        return res.status(400).json({ error: 'Titel och pris är obligatoriska.' });
    }

    const newItem = {
        id: menuItems.length + 1,
        title,
        description,
        price: Number(price)
    };

    menuItems.push(newItem);
    res.status(201).json({ message: 'Rätt tillagd!', item: newItem });
});

// 5. Radera en rätt från menyn (Skyddad route)
app.delete('/api/menu/:id', verifyToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Rätten hittades inte.' });
    }

    menuItems.splice(index, 1);
    res.json({ message: 'Rätt raderad!' });
});

// Starta servern
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servern körs på port ${PORT}`);
});