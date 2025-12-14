-- Create Tables for Linus POS (PostgreSQL)

-- Products Table
CREATE TABLE IF NOT EXISTS Products (
    Id VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    Category VARCHAR(100),
    Stock INTEGER DEFAULT 0,
    Barcode VARCHAR(255),
    Image TEXT
);

-- Sales Table
CREATE TABLE IF NOT EXISTS Sales (
    Id VARCHAR(255) PRIMARY KEY,
    Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Total DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL,
    Tax DECIMAL(10, 2) DEFAULT 0,
    Discount DECIMAL(10, 2) DEFAULT 0,
    Currency VARCHAR(10) DEFAULT 'SAR',
    Cashier VARCHAR(100),
    -- New Fields for Payment Methods & Customer Info
    CustomerName VARCHAR(255),
    PaymentMethod VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'Electronic', 'Credit'
    PaymentDetails TEXT, -- For referencing auth codes etc.
    Status VARCHAR(50) DEFAULT 'Completed' -- 'Completed', 'Pending'
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS SaleItems (
    Id SERIAL PRIMARY KEY,
    SaleId VARCHAR(255) REFERENCES Sales(Id) ON DELETE CASCADE,
    ProductId VARCHAR(255),
    ProductName VARCHAR(255),
    Quantity INTEGER NOT NULL,
    Price DECIMAL(10, 2) NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    Id SERIAL PRIMARY KEY,
    Username VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(255),
    Role VARCHAR(50) DEFAULT 'user',
    IsActive BOOLEAN DEFAULT TRUE
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS Permissions (
    UserId INTEGER REFERENCES Users(Id) ON DELETE CASCADE,
    CanManageInventory BOOLEAN DEFAULT FALSE,
    CanViewReports BOOLEAN DEFAULT FALSE,
    CanManageSettings BOOLEAN DEFAULT FALSE,
    CanManageUsers BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (UserId)
);
