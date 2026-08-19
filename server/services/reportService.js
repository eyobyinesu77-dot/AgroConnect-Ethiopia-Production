const Report = require('../models/Report');

const generateSystemReport = async (reportData) => await Report.create(reportData);

module.exports = { generateSystemReport };