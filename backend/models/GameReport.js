const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameReport = sequelize.define('GameReport', {
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
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  emotions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  question: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_correct',
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'completed_at',
  },
}, {
  tableName: 'game_reports',
  timestamps: false,
});

module.exports = GameReport;
