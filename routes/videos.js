import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
    image: '/public/images/image0.jpg',
    ...req.body,
  };
  videos.push(newVideo);
  saveVideos(videos);
  res.status(201).json(newVideo);
});

export default router;
