-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots table - stores periodic networth snapshots
CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_net_worth REAL NOT NULL,
    total_assets REAL NOT NULL,
    total_liabilities REAL NOT NULL,
    monthly_gain REAL,
    dollars_per_hour REAL,
    portfolio_change REAL,
    hours_in_month INTEGER NOT NULL DEFAULT 744,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Account categories - predefined categories for organization
CREATE TABLE IF NOT EXISTS account_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('asset', 'liability')) NOT NULL,
    description TEXT,
    icon TEXT
);

-- Accounts table - stores individual accounts within each snapshot
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL,
    category_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES account_categories (id)
);

-- Insert default account categories
INSERT OR IGNORE INTO account_categories (id, name, type, description, icon) VALUES
('cash', 'Cash & Bank Accounts', 'asset', 'Checking accounts, savings accounts, money market accounts', '💰'),
('investments', 'Investment Accounts', 'asset', 'Brokerage accounts, stocks, bonds, mutual funds', '📈'),
('retirement', 'Retirement Accounts', 'asset', '401(k), IRA, Roth IRA, pension accounts', '🏦'),
('real-estate', 'Real Estate', 'asset', 'Primary residence, rental properties, land', '🏠'),
('vehicles', 'Vehicles', 'asset', 'Cars, trucks, motorcycles, boats', '🚗'),
('other-assets', 'Other Assets', 'asset', 'Jewelry, collectibles, business assets', '💎'),
('credit-cards', 'Credit Cards', 'liability', 'Credit card balances and outstanding debt', '💳'),
('loans', 'Personal Loans', 'liability', 'Personal loans, student loans, auto loans', '📋'),
('mortgages', 'Mortgages', 'liability', 'Home mortgages, HELOC, second mortgages', '🏘️'),
('other-liabilities', 'Other Liabilities', 'liability', 'Other debts and obligations', '📄');

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots(date);
CREATE INDEX IF NOT EXISTS idx_accounts_snapshot_id ON accounts(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_category_id ON accounts(category_id);