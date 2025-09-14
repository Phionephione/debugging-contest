const mongoose = require('mongoose');
const SettingsSchema = new mongoose.Schema({ isLeaderboardVisible: { type: Boolean, default: true } });
module.exports = mongoose.model('settings', SettingsSchema);