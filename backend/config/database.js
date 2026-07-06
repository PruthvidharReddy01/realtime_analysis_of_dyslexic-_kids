// Database configuration for Sequelize + PostgreSQL
const { Sequelize } = require('sequelize');

// Use DATABASE_URL from environment (provided by Render PostgreSQL)
// Falls back to local PostgreSQL for development
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/joyverse';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
