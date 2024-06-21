const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const videosFilePath = path.join(__dirname, '../data/videos.json');

const getVideos = () => {
  const data = fs.readFileSync(videosFilePath);
  return JSON.parse(data);
};

const saveVideos = (videos) => {
  fs.writeFileSync(videosFilePath, JSON.stringify(videos, null, 2));
};

router.get('/', (req, res) => {
  const videos = getVideos();
  res.json(videos);
});

router.get('/:id', (req, res) => {
  const videos = getVideos();
  const video = videos.find(v => v.id === req.params.id);
  if (video) {
    res.json(video);
  } else {
    res.status(404).send('Video not found');
  }
});

router.post('/', (req, res) => {
  const videos = getVideos();
  const newVideo = {
    id: `v${Date.now()}`,
    title: req.body.title,
    description: req.body.description,
    image: '/public/images/Upload-video-preview.jpg', 
    ...req.body,
  };
  videos.push(newVideo);
  saveVideos(videos);
  res.status(201).json(newVideo);
});

module.exports = router;
