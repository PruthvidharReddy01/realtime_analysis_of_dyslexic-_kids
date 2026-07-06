// Central model registry — initializes all models and sets up associations
const sequelize = require('../config/database');
const SuperAdmin = require('./SuperAdmin');
const Admin = require('./Admin');
const Child = require('./Child');
const EmotionHistory = require('./EmotionHistory');
const GameReport = require('./GameReport');
const Note = require('./Note');

// --- Associations ---

// Admin has many Children
Admin.hasMany(Child, { foreignKey: 'parentId', as: 'children' });
Child.belongsTo(Admin, { foreignKey: 'parentId', as: 'parent' });

// Child has many EmotionHistory records
Child.hasMany(EmotionHistory, { foreignKey: 'childId', as: 'emotionHistory' });
EmotionHistory.belongsTo(Child, { foreignKey: 'childId' });

// Child has many GameReport records
Child.hasMany(GameReport, { foreignKey: 'childId', as: 'gameReports' });
GameReport.belongsTo(Child, { foreignKey: 'childId' });

// Child has many Notes, Admin has many Notes
Child.hasMany(Note, { foreignKey: 'childId', as: 'notes' });
Note.belongsTo(Child, { foreignKey: 'childId' });
Admin.hasMany(Note, { foreignKey: 'adminId', as: 'notes' });
Note.belongsTo(Admin, { foreignKey: 'adminId' });

module.exports = {
  sequelize,
  SuperAdmin,
  Admin,
  Child,
  EmotionHistory,
  GameReport,
  Note,
};
