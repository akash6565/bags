// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const baggageRouter = require('./routes/baggage');

const app = express();
app.use(bodyParser.json());
app.use('/baggage', baggageRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

(async () => {
  await sequelize.sync();                // ensure tables exist
  app.listen(process.env.PORT || 3000, () =>
    console.log('API listening on port', process.env.PORT || 3000)
  );
})();