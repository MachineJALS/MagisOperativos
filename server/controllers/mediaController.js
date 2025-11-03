// server/controllers/mediaController.js
const { db } = require('../config/firebase');

const mediaController = {
  getStreamUrl: async (req, res) => {
    try {
      const { fileId } = req.params;
      // Lógica para URLs de streaming
      res.json({ success: true, url: `stream-url-for-${fileId}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = mediaController;