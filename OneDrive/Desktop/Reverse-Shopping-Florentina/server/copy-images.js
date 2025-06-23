const fs = require('fs');
const path = require('path');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Copy images from assets to server/images
const assetsDir = path.join(__dirname, '..', 'assets', 'images');
const serverImagesDir = path.join(__dirname, 'images');

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  
  files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const sourcePath = path.join(assetsDir, file);
      const destPath = path.join(serverImagesDir, file);
      
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${file}`);
    }
  });
  
  console.log('All images copied successfully!');
} else {
  console.log('Assets directory not found. Skipping image copy.');
} 