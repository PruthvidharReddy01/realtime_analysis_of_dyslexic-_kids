const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Child = sequelize.define('Child', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  childName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'child_name',
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'user_id',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'parent_id',
    references: {
      model: 'admins',
      key: '_id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  registeredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'registered_at',
  },
}, {
  tableName: 'children',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Child;