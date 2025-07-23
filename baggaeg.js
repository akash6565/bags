// routes/baggage.js
const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const BagScan = require('../models/BagScan');
const router = express.Router();

// 1️⃣ POST /baggage/scan
router.post('/scan', async (req, res, next) => {
  try {
    const { bagTagId, destinationGate, locationScanned } = req.body;
    const scan = await BagScan.create({ bagTagId, destinationGate, locationScanned });
    res.status(201).json({ scan_internal_id: scan.id, status: 'logged' });
  } catch (err) { next(err); }
});

// 2️⃣ GET /baggage/scans/bag/:bagTagId
router.get('/scans/bag/:bagTagId', async (req, res, next) => {
  try {
    const { bagTagId } = req.params;
    if (req.query.latest === 'true') {
      const scan = await BagScan.findOne({
        where: { bagTagId },
        order: [['scannedAt', 'DESC']],
      });
      return scan
        ? res.json(scan)
        : res.status(404).json({ error: 'No scans found for that bagTagId' });
    }
    const scans = await BagScan.findAll({
      where: { bagTagId },
      order: [['scannedAt', 'DESC']],
    });
    res.json(scans);
  } catch (err) { next(err); }
});

// 3️⃣ GET /baggage/scans/gate/:destinationGate
router.get('/scans/gate/:destinationGate', async (req, res, next) => {
  try {
    const scans = await BagScan.findAll({
      where: { destinationGate: req.params.destinationGate },
      order: [['scannedAt', 'DESC']],
    });
    res.json(scans);
  } catch (err) { next(err); }
});

// 4️⃣ GET /baggage/active/gate/:destinationGate
router.get('/active/gate/:destinationGate', async (req, res, next) => {
  try {
    const minutes = parseInt(req.query.since_minutes) || 60;
    const cutoff   = new Date(Date.now() - minutes * 60000);
    // Subquery: latest scan per bagTagId within window
    const sub = BagScan.findAll({
      attributes: [
        'bagTagId',
        [fn('MAX', col('scannedAt')), 'lastScanAt']
      ],
      where: {
        destinationGate: req.params.destinationGate,
        scannedAt: { [Op.gte]: cutoff },
      },
      group: ['bagTagId']
    });
    // Join back to get locationScanned
    const active = await BagScan.findAll({
      include: [{
        model: sequelize.literal(`(${sub.query}) AS sub`),
        on: {
          bagTagId: { [Op.eq]: col('sub.bagTagId') },
          scannedAt: { [Op.eq]: col('sub."lastScanAt"') },
        }
      }]
    });
    res.json(active.map(r => ({
      bagTagId: r.bagTagId,
      lastScanAt: r.scannedAt,
      lastLocation: r.locationScanned
    })));
  } catch (err) { next(err); }
});

// 5️⃣ GET /baggage/stats/gate-counts
router.get('/stats/gate-counts', async (req, res, next) => {
  try {
    const minutes = parseInt(req.query.since_minutes) || 60;
    const cutoff   = new Date(Date.now() - minutes * 60000);
    const stats = await BagScan.findAll({
      attributes: [
        'destinationGate',
        [fn('COUNT', fn('DISTINCT', col('bagTagId'))), 'uniqueBagCount']
      ],
      where: { scannedAt: { [Op.gte]: cutoff } },
      group: ['destinationGate']
    });
    res.json(stats.map(s => ({
      destination_gate: s.destinationGate,
      unique_bag_count: Number(s.get('uniqueBagCount')),
    })));
  } catch (err) { next(err); }
});

module.exports = router;
