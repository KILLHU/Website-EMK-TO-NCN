// index.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const processFile = require('./emkunpack');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const originalFileName = path.parse(req.file.originalname).name;
  const extensionMap = {
    'HEADER': 'bin',
    'MIDI_DATA': 'mid',
    'LYRIC_DATA': 'lyr', // Change this to lyr
    'CURSOR_DATA': 'cur',
    'SONG_INFO': 'bin',
  };

  try {
    // Process the uploaded file
    const files = processFile(req.file.path);

    // Rename files according to the original uploaded file name
    const renamedFiles = files.map((file) => {
      const tag = path.parse(file).name;
      const ext = extensionMap[tag] || 'bin';
      const newName = `${originalFileName}.${ext}`;
      fs.renameSync(file, newName);
      return newName;
    });

    // Create a zip file
    const zip = new AdmZip();
    renamedFiles.forEach((file) => {
      zip.addLocalFile(path.join(__dirname, file));
    });

    const zipPath = path.join(__dirname, `${originalFileName}.zip`);
    zip.writeZip(zipPath);

    // Clean up files
    fs.unlinkSync(req.file.path); // Remove uploaded file
    renamedFiles.forEach((file) => {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    // Send the zip file to the client
    res.download(zipPath, () => {
      // Delete the zip file after download
      fs.unlink(zipPath, (err) => {
        if (err) {
          console.error('Error deleting zip file:', err);
        }
      });
    });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});