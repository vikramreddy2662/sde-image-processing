const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Product = require('../models/product');
const router = express.Router();


// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });
const { processImages } = require('../services/imageService');

// Upload CSV route
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log(req.file.path);
  const filePath = req.file.path;
  const products = [];

  // Parse CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const { SerialNumber, ProductName, InputImageUrls } = row;
      console.log(SerialNumber);
      console.log(ProductName);
      console.log(InputImageUrls );
      const inputUrls = InputImageUrls.split(',');

      products.push(new Product({
        serialNumber: SerialNumber,
        productName: ProductName,
        inputImageUrls: inputUrls,
        status: 'pending'
      }));
    })
    .on('end', async () => {
      await Product.insertMany(products);
      const requestId = products[0]._id;  // Using the first product's ID as request ID
      res.status(200).json({ requestId });
    });
});
// Status API
router.get('/status/:requestId', async (req, res) => {
    const product = await Product.findById(req.params.requestId);
  
    if (!product) return res.status(404).json({ message: 'Request not found' });
  
    res.status(200).json({ status: product.status });
  });
  
  // Trigger image processing (after uploading CSV)
  router.post('/process/:requestId', async (req, res) => {
    const productId = req.params.requestId;
  
    // Process asynchronously
    processImages(productId)
      .then(() => res.status(200).json({ message: 'Processing started' }))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  router.get('/getstatus', (req, res)=>{
    console.log("main");
    res.status(200).json({status:'abc'});
  })

module.exports = router;
