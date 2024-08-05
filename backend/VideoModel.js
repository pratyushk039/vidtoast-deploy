// VideoModel.js

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  duration: Number,
  thumbnail: String,
  likes: { type: Number, default: 0 }, // Add a likes field with a default value
  uploadedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
