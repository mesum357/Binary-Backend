import express from 'express';
import { checkRenewals } from '../utils/renewalCheck.js';

const router = express.Router();

// Check for expiring courses and send renewal notifications
// This can be called manually via API or will run automatically via scheduled task
router.post('/check-renewals', async (req, res) => {
  try {
    await checkRenewals();
    res.json({
      success: true,
      message: 'Renewal check completed',
    });
  } catch (error) {
    console.error('Error checking course renewals:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking course renewals',
    });
  }
});

export default router;

