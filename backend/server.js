require('dotenv').config();
const express = require('express');
const db = require('./dbConfig');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Test Connection
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database Connection Failed!', err);
    } else {
        console.log('Connected to PostgreSQL successfully!', res.rows[0]);
    }
});

// --- Routes ---

// 1. Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Products');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 2. Save/Update Product
app.post('/api/products', async (req, res) => {
    const p = req.body; // Array or Single Object
    const products = Array.isArray(p) ? p : [p];

    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            for (const prod of products) {
                // Upsert logic for Postgres (ON CONFLICT)
                const query = `
                    INSERT INTO Products (Id, Name, Price, Category, Stock, Barcode, Image)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (Id) 
                    DO UPDATE SET 
                        Name = EXCLUDED.Name, 
                        Price = EXCLUDED.Price, 
                        Category = EXCLUDED.Category, 
                        Stock = EXCLUDED.Stock, 
                        Barcode = EXCLUDED.Barcode, 
                        Image = EXCLUDED.Image
                `;
                const values = [prod.id, prod.name, prod.price, prod.category, prod.stock, prod.barcode, prod.image];
                await client.query(query, values);
            }

            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 3. Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Products WHERE Id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 4. Clear Inventory
app.delete('/api/products', async (req, res) => {
    try {
        await db.query('DELETE FROM Products');
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 5. Save Sale
app.post('/api/sales', async (req, res) => {
    const sale = req.body;
    // Extract new fields with defaults
    const {
        id, date, total, subtotal, tax, discount, currency, cashier, items,
        customerName = null,
        paymentMethod = 'Cash',
        paymentDetails = ''
    } = sale;

    // Determine status: Credit sales might be 'Pending'? For now, let's mark all as 'Completed' 
    // or we can say if PaymentMethod is Credit, then Status is Pending.
    const status = paymentMethod === 'Credit' ? 'Pending' : 'Completed';

    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert Sale Header
            const insertSaleQuery = `
                INSERT INTO Sales (
                    Id, Date, Total, Subtotal, Tax, Discount, Currency, Cashier, 
                    CustomerName, PaymentMethod, PaymentDetails, Status
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `;
            const saleValues = [
                id, date, total, subtotal, tax, discount, currency, cashier,
                customerName, paymentMethod, paymentDetails, status
            ];
            await client.query(insertSaleQuery, saleValues);

            // Insert Items & Update Stock
            for (const item of items) {
                const insertItemQuery = `
                    INSERT INTO SaleItems (SaleId, ProductId, ProductName, Quantity, Price) 
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await client.query(insertItemQuery, [id, item.id, item.name, item.quantity, item.price]);

                const updateStockQuery = `
                    UPDATE Products SET Stock = Stock - $1 WHERE Id = $2
                `;
                await client.query(updateStockQuery, [item.quantity, item.id]);
            }

            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// 6. Get Sales
app.get('/api/sales', async (req, res) => {
    try {
        // Fetch sales with new columns
        const salesResult = await db.query('SELECT * FROM Sales ORDER BY Date DESC');
        const sales = salesResult.rows;

        // Fetch items for each sale
        // Optimization: In a real app, use a JOIN. Keeping loop structure for similarity to original logic for now, but fixing SQL.
        for (const sale of sales) {
            const itemsResult = await db.query('SELECT * FROM SaleItems WHERE SaleId = $1', [sale.id]); // Postgres column names are usually lowercase in result if not quoted in creation. 
            // However, we created tables without quotes, so they are case-insensitive (lowercase stored).
            // Let's ensure we map correctly.

            sale.items = itemsResult.rows.map(i => ({
                id: i.productid,
                name: i.productname,
                quantity: i.quantity,
                price: i.price
            }));

            // Map DB columns to Frontend structure (Postgres returns lowercase keys by default)
            // We need to make sure we return what frontend expects
            // or just rely on the frontend being flexible. 
            // Original code re-mapped uppercase DB cols to lowercase props.
            // Postgres `pg` driver returns lowercase column names.

            // Re-assign to ensure consistent casing for frontend
            sale.customerName = sale.customername;
            sale.paymentMethod = sale.paymentmethod;
            sale.paymentDetails = sale.paymentdetails;
            sale.status = sale.status;
        }
        res.json(sales);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 7. Users & Auth
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM Users WHERE Username=$1 AND Password=$2 AND IsActive=TRUE', [username, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Get Permissions
            const permResult = await db.query('SELECT * FROM Permissions WHERE UserId=$1', [user.id]);
            user.permissions = permResult.rows[0] || {};

            // Map to frontend structure
            const frontendUser = {
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: {
                    canManageInventory: user.permissions.canmanageinventory,
                    canViewReports: user.permissions.canviewreports,
                    canManageSettings: user.permissions.canmanagesettings,
                    canManageUsers: user.permissions.canmanageusers
                }
            };
            res.json(frontendUser);
        } else {
            res.status(401).send('Invalid Credentials');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.Username, u.Name, u.Role, u.IsActive, 
                   p.CanManageInventory, p.CanViewReports, p.CanManageSettings, p.CanManageUsers
            FROM Users u
            LEFT JOIN Permissions p ON u.Id = p.UserId
        `);

        const users = result.rows.map(u => ({
            username: u.username,
            name: u.name,
            role: u.role,
            isActive: u.isactive,
            permissions: {
                canManageInventory: u.canmanageinventory,
                canViewReports: u.canviewreports,
                canManageSettings: u.canmanagesettings,
                canManageUsers: u.canmanageusers
            }
        }));
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/users', async (req, res) => {
    const user = req.body;
    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const insertUserValues = [user.username, user.password, user.name, user.role];
            const result = await client.query(
                `INSERT INTO Users (Username, Password, Name, Role, IsActive) 
                 VALUES ($1, $2, $3, $4, TRUE) 
                 RETURNING Id`,
                insertUserValues
            );
            const newId = result.rows[0].id;

            const insertPermValues = [
                newId,
                user.permissions.canManageInventory,
                user.permissions.canViewReports,
                user.permissions.canManageSettings,
                user.permissions.canManageUsers
            ];
            await client.query(
                `INSERT INTO Permissions (UserId, CanManageInventory, CanViewReports, CanManageSettings, CanManageUsers) 
                 VALUES ($1, $2, $3, $4, $5)`,
                insertPermValues
            );

            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/users/:username/toggle', async (req, res) => {
    try {
        await db.query('UPDATE Users SET IsActive = NOT IsActive WHERE Username = $1', [req.params.username]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
