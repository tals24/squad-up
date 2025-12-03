const dataService = require('../services/dataService');

exports.getAllData = async (req, res) => {
  try {
    const data = await dataService.getAllData(req.user);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.airtableSync = async (req, res) => {
  try {
    const { action, tableName, recordId, data } = req.body;
    const result = await dataService.airtableSync(action, tableName, recordId, data, req.user);
    res.json(result);
  } catch (error) {
    console.error('Airtable sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

