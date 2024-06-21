import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const videosFilePath = path.join(__dirname, '../data/videos.json');

const getVideos = async () => {
  const data = await fs.readFile(videosFilePath, 'utf-8');
  return JSON.parse(data);
};

const saveVideos = async (videos) => {
  await fs.writeFile(videosFilePath, JSON.stringify(videos, null, 2), 'utf-8');
};

router.get('/', async (req, res) => {
  try {
    const videos = await getVideos();
    const videoSummaries = videos.map(({ id, title, channel, image, views, likes, timestamp }) => ({
      id, title, channel, image, views, likes, timestamp
    }));
    res.json(videoSummaries);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
      res.json(video);
    } else {
      res.status(404).send('Video not found');
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    console.log("POST /videos request received");
    const videos = await getVideos();
    const newVideo = {
      id: uuidv4(), // Generates a new UUID
      title: req.body.title,
      description: req.body.description,
      image: req.body.image || '/public/images/image4.jpg',
      channel: req.body.channel || "Unknown Channel",
      views: "0",
      likes: "0",
      duration: req.body.duration || "0:00",
      video: req.body.video || "https://unit-3-project-api-0a5620414506.herokuapp.com/stream",
      timestamp: Date.now(),
      comments: []
    };
    videos.push(newVideo);
    await saveVideos(videos);
    console.log("New video saved:", newVideo);
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
