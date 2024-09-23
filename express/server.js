const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Import cors
const app = express();
const PORT = 5000;

// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:3000' // Allow requests from this origin
}));

app.use(express.json());

// Open a database connection to a file
const db = new sqlite3.Database('mydatabase.db'); // Replace with your database file path

// Initialize the database
db.serialize(() => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='items'", (err, row) => {
        if (err) {
            console.error('Error checking table existence:', err);
            return;
        }
        if (!row) {
            db.run("CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)", (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('Table created successfully');
                }
            });
        } else {
            console.log('Table already exists');
        }
    });
});

// CRUD operations (unchanged)
app.post('/items', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Name is  are required' });
    }

    const stmt = db.prepare("INSERT INTO items (name) VALUES (?)");
    stmt.run(name, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, name });
    });
    stmt.finalize();
});

app.get('/items', (req, res) => {
    db.all("SELECT * FROM items", (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(rows);
    });
});

app.get('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(row);
    });
});

app.put('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const stmt = db.prepare("UPDATE items SET name = ?  WHERE id = ?");
    stmt.run(name, id, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ id, name });
    });
    stmt.finalize();
});

app.delete('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const stmt = db.prepare("DELETE FROM items WHERE id = ?");
    stmt.run(id, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(204).end(); // No content to send back
    });
    stmt.finalize();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
