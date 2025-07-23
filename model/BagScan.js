// models/BagScan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BagScan = sequelize.define('BagScan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bagTagId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destinationGate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  locationScanned: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scannedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'bag_scans',
  timestamps: false,
  indexes: [
    { fields: ['bagTagId'] },
    { fields: ['destinationGate'] },
    { fields: ['destinationGate', 'scannedAt'] },
  ],
});

module.exports = BagScan;
