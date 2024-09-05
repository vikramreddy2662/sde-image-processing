const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  serialNumber: Number,
  productName: String,
  inputImageUrls: [String],
  outputImageUrls: [String],
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Product', productSchema);
