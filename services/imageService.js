const axios = require('axios');
const sharp = require('sharp');
const Product = require('../models/product');
const fs = require('fs');
const path = require('path');

// Function to download the image from the URL
const downloadImage = async (url, outputPath) => {
  const response = await axios({
    url,
    responseType: 'stream'
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    writer.on('finish', resolve);  // Ensures the file is completely written
    writer.on('error', reject);
  });
};


// Function to process images asynchronously
const processImages = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) throw new Error('Product not found');

  const outputImageUrls = [];

  for (let i = 0; i < product.inputImageUrls.length; i++) {
    const inputUrl = product.inputImageUrls[i];
    
    // Generate unique output path for the compressed image
    const outputFilename = `compressed-${Date.now()}-${i}.jpg`;
    const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

    // Temporary path to download the input image
    const tempInputPath = path.join(__dirname, '..', 'uploads', `input-${Date.now()}-${i}.jpg`);
    
    // Download the image to the temp input path
    await downloadImage(inputUrl, tempInputPath);

    // Compress the image using Sharp and save it to the output path
    await sharp(tempInputPath).jpeg({ quality: 50 }).toFile(outputPath);

    // Ensure that the file has been fully written and closed before attempting to delete
    setTimeout(() => {
      try {
        fs.unlinkSync(tempInputPath);  // Delete the temporary input file
      } catch (err) {
        console.error('Error while deleting temp file:', err);
      }
    }, 1000);  // Add a small delay to ensure file operations are completed

    // Store compressed image URL
    outputImageUrls.push(outputPath);
  }

  // Update the product with the output image URLs
  product.outputImageUrls = outputImageUrls;
  product.status = 'completed';
  await product.save();
};


module.exports = { processImages };
