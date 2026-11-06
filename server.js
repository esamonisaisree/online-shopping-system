
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database/db');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;
// Admin authentication middleware
function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    next();
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'shopping-system-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Online Shopping System is running!'
    });
});

// Customer Registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'All fields are required'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({
                            status: 'error',
                            message: 'Email already registered'
                        });
                    }

                    return res.status(500).json({
                        status: 'error',
                        message: 'Registration failed'
                    });
                }

                res.status(201).json({
                    status: 'success',
                    message: 'Registration successful',
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// Customer Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and password are required'
        });
    }

    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error'
                });
            }

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password'
                });
            }

            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            res.json({
                status: 'success',
                message: 'Login successful',
                user: req.session.user
            });
        }
    );
});

// Customer Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Logout failed'
            });
        }

        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    });
});

// Check Login Status
app.get('/api/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    res.json({
        status: 'success',
        user: req.session.user
    });
});

// Get all products and search products
app.get('/api/products', (req, res) => {
    const search = req.query.search || '';

    db.all(
        'SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC',
        [`%${search}%`],
        (err, products) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to fetch products'
                });
            }

            res.json({
                status: 'success',
                products
            });
        }
    );
});

// Get a single product by ID
app.get('/api/products/:id', (req, res) => {
    db.get(
        'SELECT * FROM products WHERE id = ?',
        [req.params.id],
        (err, product) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error'
                });
            }

            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Product not found'
                });
            }

            res.json({
                status: 'success',
                product
            });
        }
    );
});

// Add product to cart
app.post('/api/cart', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const { productId, quantity = 1 } = req.body;

    if (!Number.isInteger(Number(productId)) ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid product or quantity'
        });
    }

    db.get(
        'SELECT * FROM products WHERE id = ?',
        [productId],
        (err, product) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error'
                });
            }

            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Product not found'
                });
            }

            if (Number(quantity) > product.stock) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Insufficient stock'
                });
            }

            if (!req.session.cart) {
                req.session.cart = [];
            }

            const existingItem = req.session.cart.find(
                item => item.productId === Number(productId)
            );

            const newQuantity = existingItem
                ? existingItem.quantity + Number(quantity)
                : Number(quantity);

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Requested quantity exceeds stock'
                });
            }

            if (existingItem) {
                existingItem.quantity = newQuantity;
            } else {
                req.session.cart.push({
                    productId: Number(productId),
                    quantity: Number(quantity)
                });
            }

            res.json({
                status: 'success',
                message: 'Product added to cart'
            });
        }
    );
});

// View shopping cart
app.get('/api/cart', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.json({
            status: 'success',
            items: [],
            total: 0
        });
    }

    const ids = cart.map(item => item.productId);
    const placeholders = ids.map(() => '?').join(',');

    db.all(
        `SELECT * FROM products WHERE id IN (${placeholders})`,
        ids,
        (err, products) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to fetch cart'
                });
            }

            const items = cart.map(item => {
                const product = products.find(
                    p => p.id === item.productId
                );

                return {
                    ...product,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity
                };
            });

            const total = items.reduce(
                (sum, item) => sum + item.subtotal, 0
            );

            res.json({
                status: 'success',
                items,
                total
            });
        }
    );
});

// Update cart quantity
app.put('/api/cart/:productId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(productId) ||
        !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid product or quantity'
        });
    }

    const cart = req.session.cart || [];
    const item = cart.find(i => i.productId === productId);

    if (!item) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found in cart'
        });
    }

    db.get(
        'SELECT stock FROM products WHERE id = ?',
        [productId],
        (err, product) => {
            if (err || !product) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Product not found'
                });
            }

            if (quantity > product.stock) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Insufficient stock'
                });
            }

            item.quantity = quantity;

            res.json({
                status: 'success',
                message: 'Cart quantity updated'
            });
        }
    );
});

// Remove product from cart
app.delete('/api/cart/:productId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const productId = Number(req.params.productId);
    const cart = req.session.cart || [];

    const updatedCart = cart.filter(
        item => item.productId !== productId
    );

    if (updatedCart.length === cart.length) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found in cart'
        });
    }

    req.session.cart = updatedCart;

    res.json({
        status: 'success',
        message: 'Product removed from cart'
    });
});

// Checkout and place order
app.post('/api/checkout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Your cart is empty'
        });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let total = 0;
        let completed = 0;
        let failed = false;
        const orderProducts = [];

        cart.forEach(item => {
            db.run(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ? AND stock >= ?`,
                [item.quantity, item.productId, item.quantity],
                function (err) {
                    if (failed) return;

                    if (err || this.changes !== 1) {
                        failed = true;
                        db.run('ROLLBACK');

                        return res.status(400).json({
                            status: 'error',
                            message: 'Insufficient stock or invalid product'
                        });
                    }

                    db.get(
                        'SELECT * FROM products WHERE id = ?',
                        [item.productId],
                        (err, product) => {
                            if (failed) return;

                            if (err || !product) {
                                failed = true;
                                db.run('ROLLBACK');

                                return res.status(500).json({
                                    status: 'error',
                                    message: 'Unable to process order'
                                });
                            }

                            total += product.price * item.quantity;

                            orderProducts.push({
                                productId: product.id,
                                quantity: item.quantity,
                                price: product.price
                            });

                            completed++;

                            if (completed === cart.length) {
                                db.run(
                                    `INSERT INTO orders (user_id, total)
                                     VALUES (?, ?)`,
                                    [req.session.user.id, total],
                                    function (err) {
                                        if (err) {
                                            db.run('ROLLBACK');

                                            return res.status(500).json({
                                                status: 'error',
                                                message: 'Order creation failed'
                                            });
                                        }

                                        const orderId = this.lastID;
                                        let saved = 0;

                                        orderProducts.forEach(product => {
                                            db.run(
                                                `INSERT INTO order_items
                                                 (order_id, product_id, quantity, price)
                                                 VALUES (?, ?, ?, ?)`,
                                                [
                                                    orderId,
                                                    product.productId,
                                                    product.quantity,
                                                    product.price
                                                ],
                                                function (err) {
                                                    if (err && !failed) {
                                                        failed = true;
                                                        db.run('ROLLBACK');

                                                        return res.status(500).json({
                                                            status: 'error',
                                                            message: 'Unable to save order items'
                                                        });
                                                    }

                                                    if (failed) return;

                                                    saved++;

                                                    if (saved === orderProducts.length) {
                                                        db.run('COMMIT', (err) => {
                                                            if (err) {
                                                                return res.status(500).json({
                                                                    status: 'error',
                                                                    message: 'Order confirmation failed'
                                                                });
                                                            }

                                                            req.session.cart = [];

                                                            res.status(201).json({
                                                                status: 'success',
                                                                message: 'Order placed successfully',
                                                                orderId,
                                                                total
                                                            });
                                                        });
                                                    }
                                                }
                                            );
                                        });
                                    }
                                );
                            }
                        }
                    );
                }
            );
        });
    });
});

// Get customer order history
app.get('/api/orders', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please login first'
        });
    }

    const userId = req.session.user.id;

    db.all(
        `SELECT * FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId],
        (err, orders) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to fetch orders'
                });
            }

            if (orders.length === 0) {
                return res.json({
                    status: 'success',
                    orders: []
                });
            }

            let completed = 0;

            orders.forEach(order => {
                db.all(
                    `SELECT order_items.*, products.name
                     FROM order_items
                     JOIN products
                     ON order_items.product_id = products.id
                     WHERE order_items.order_id = ?`,
                    [order.id],
                    (err, items) => {
                        if (err) {
                            return res.status(500).json({
                                status: 'error',
                                message: 'Unable to fetch order items'
                            });
                        }

                        order.items = items;
                        completed++;

                        if (completed === orders.length) {
                            res.json({
                                status: 'success',
                                orders
                            });
                        }
                    }
                );
            });
        }
    );
});



// Admin: Add a new product
app.post('/api/admin/products', requireAdmin, (req, res) => {
    const { name, description, price, stock } = req.body;

    if (!name || price === undefined || stock === undefined ||
        Number(price) <= 0 || !Number.isInteger(Number(stock)) ||
        Number(stock) < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Enter valid product details'
        });
    }

    db.run(
        `INSERT INTO products (name, description, price, stock)
         VALUES (?, ?, ?, ?)`,
        [name, description || '', Number(price), Number(stock)],
        function (err) {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to add product'
                });
            }

            res.status(201).json({
                status: 'success',
                message: 'Product added successfully',
                productId: this.lastID
            });
        }
    );
});

// Admin: Edit a product
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const { name, description, price, stock } = req.body;
    const productId = req.params.id;

    if (!name || price === undefined || stock === undefined ||
        Number(price) <= 0 || !Number.isInteger(Number(stock)) ||
        Number(stock) < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Enter valid product details'
        });
    }

    db.run(
        `UPDATE products
         SET name = ?, description = ?, price = ?, stock = ?
         WHERE id = ?`,
        [name, description || '', Number(price), Number(stock), productId],
        function (err) {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to update product'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Product not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Product updated successfully'
            });
        }
    );
}); 
app.listen(PORT, () => {
    console.log(`Shopping System running at http://localhost:${PORT}`);
});
// Admin: Delete a product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const productId = req.params.id;

    db.get(
        'SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?',
        [productId],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Unable to check product orders'
                });
            }

            if (row.count > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Cannot delete a product already included in orders'
                });
            }

            db.run(
                'DELETE FROM products WHERE id = ?',
                [productId],
                function (err) {
                    if (err) {
                        return res.status(500).json({
                            status: 'error',
                            message: 'Unable to delete product'
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            status: 'error',
                            message: 'Product not found'
                        });
                    }

                    res.json({
                        status: 'success',
                        message: 'Product deleted successfully'
                    });
                }
            );
        }
    );
});
// Start server
app.listen(PORT, () => {
    console.log(`Shopping System running at http://localhost:${PORT}`);
});
