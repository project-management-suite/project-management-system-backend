// src/models/file.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const FileSchema = new Schema({
  filename: String,
  path: String,
  mimetype: String,
  size: Number,
  uploader: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('File', FileSchema);
