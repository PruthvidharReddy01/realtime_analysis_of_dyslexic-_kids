const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmotionHistory = sequelize.define('EmotionHistory', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  childId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'child_id',
    references: {
      model: 'children',
      key: '_id',
    },
  },
  emotion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  question: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'emotion_history',
  timestamps: false,
});

module.exports = EmotionHistory;
