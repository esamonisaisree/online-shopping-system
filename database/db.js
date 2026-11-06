
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = path.join(__dirname, 'shopping.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to Shopping Database');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image TEXT,
            stock INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'Placed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

// Insert sample products if the products table is empty
db.get('SELECT COUNT(*) AS count FROM products', (err, row) => {
    if (err) {
        console.error('Product count error:', err.message);
        return;
    }

    if (row.count === 0) {
        const products = [
            ['Wireless Headphones', 'Bluetooth over-ear headphones', 1499, '', 20],
            ['Smart Watch', 'Fitness and activity tracking watch', 1999, '', 15],
            ['Laptop Backpack', 'Water-resistant laptop backpack', 899, '', 25],
            ['Wireless Mouse', 'Ergonomic wireless mouse', 499, '', 30],
            ['USB-C Charger', 'Fast charging adapter', 699, '', 18],
            ['Mechanical Keyboard', 'Compact mechanical keyboard', 2499, '', 10]
        ];

        const stmt = db.prepare(
            'INSERT INTO products (name, description, price, image, stock) VALUES (?, ?, ?, ?, ?)'
        );

        products.forEach(product => stmt.run(product));

        stmt.finalize(() => {
            console.log('Sample products inserted successfully');
        });
    }
});
});
// Create default admin account
bcrypt.hash('Admin@123', 10, (err, hashedPassword) => {
    if (err) {
        console.error('Admin password hashing failed:', err.message);
        return;
    }

    db.run(
        `INSERT OR IGNORE INTO users (name, email, password, role)
         VALUES (?, ?, ?, ?)`,
        ['Admin', 'admin@shop.com', hashedPassword, 'admin'],
        (err) => {
            if (err) {
                console.error('Admin creation failed:', err.message);
            } else {
                console.log('Admin account ready');
            }
        }
    );
});
module.exports = db;
