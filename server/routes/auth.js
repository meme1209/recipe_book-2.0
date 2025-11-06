const express = require('express');
const router = express.Router();
const verifyLicense = require('../middleware/verifyLicense');

router.post('/login', verifyLicense, (req, res) => {
  const { isAdmin } = req.license;
  res.json({ success: true, isAdmin });
});

module.exports = router;