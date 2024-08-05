// index.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const Video = require('./VideoModel'); // Import Video model
const connectDB = require('./db'); // Import database connection
const app = express();
const cors = require('cors')
require("dotenv").config();

const port = process.env.PORT;

app.use(express.json()); // Middleware to parse JSON
app.use(cors())

app.use('/uploads', express.static('uploads'));


// Connect to MongoDB
connectDB();

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});

const upload = multer({ storage: storage });

// Upload Video Endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  const videoFile = req.file;

  if (!videoFile) {
    return res.status(400).send('No file uploaded.');
  }

  const videoPath = path.join(__dirname, 'uploads', videoFile.filename);
  const thumbnailPath = path.join(__dirname, 'uploads', 'thumbnails', `${videoFile.filename}.png`);

  // Generate a thumbnail
  ffmpeg(videoPath)
    .on('end', async () => {
      console.log('Thumbnail created');
      
      const videoInfo = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) reject(err);
          resolve(metadata);
        });
      });

      // Create and save metadata in MongoDB
      const metadata = new Video({
        filename: videoFile.filename,
        path: videoPath,
        size: videoFile.size,
        duration: videoInfo.format.duration, // Use format.duration for video duration
        thumbnail: `uploads/thumbnails/${videoFile.filename}.png`,
      });
      await metadata.save();

      res.send('File uploaded successfully.');
    })
    .on('error', (err) => {
      console.error('Error creating thumbnail', err);
      res.status(500).send('Error processing video.');
    })
    .screenshot({
      count: 1,
      folder: path.join(__dirname, 'uploads', 'thumbnails'),
      filename: `${videoFile.filename}.png`,
      size: '320x240',
    });
});

// Stream Video Endpoint
app.get('/video/:filename', (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, 'uploads', filename);

  // Check if the video file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found.');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Get Videos Endpoint
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).send('Error fetching videos');
  }
});

// Increment Likes Endpoint
app.post('/video/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).send('Video not found.');
    }

    video.likes += 1;
    await video.save();

    res.json({ likes: video.likes });
  } catch (error) {
    res.status(500).send('Error updating likes');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
