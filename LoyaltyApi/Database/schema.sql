-- Loyalty API Database Schema
CREATE DATABASE LoyaltyDb;
GO

USE LoyaltyDb;
GO

CREATE TABLE Customers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Email NVARCHAR(200) NOT NULL,
    Name NVARCHAR(MAX) NOT NULL,
    Points INT NOT NULL DEFAULT 0
);

CREATE TABLE Merchants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NOT NULL,
    SwapRate DECIMAL(18,4) NOT NULL DEFAULT 1.0
);

CREATE TABLE RedeemOptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MerchantId INT NOT NULL REFERENCES Merchants(Id),
    Name NVARCHAR(MAX) NOT NULL,
    PointsCost INT NOT NULL
);

CREATE TABLE Transactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL REFERENCES Customers(Id),
    MerchantId INT NOT NULL,
    Type NVARCHAR(20) NOT NULL,
    Points INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Description NVARCHAR(MAX) NULL
);

CREATE INDEX IX_Transactions_CustomerId ON Transactions(CustomerId);

-- Seed data
INSERT INTO Merchants (Name, SwapRate) VALUES ('MerchantA', 0.5), ('MerchantB', 0.8);

INSERT INTO RedeemOptions (MerchantId, Name, PointsCost) VALUES
    (1, 'Free Coffee', 100),
    (1, 'Free Lunch', 500),
    (2, '10% Discount', 200);

-- Note: Passwords should be BCrypt hashed. These are hashes of 'password123' and 'password456'
-- Generate proper hashes in your application before inserting.
INSERT INTO Customers (Username, PasswordHash, Email, Name, Points) VALUES
    ('john', '$2a$11$placeholder_hash_replace_me', 'john@example.com', 'John Doe', 1000),
    ('jane', '$2a$11$placeholder_hash_replace_me', 'jane@example.com', 'Jane Smith', 500);
