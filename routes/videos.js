import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const videosFilePath = path.resolve(__dirname, '..', process.env.VIDEOS_FILE_PATH);

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
    console.error('Error fetching videos:', error);
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
    console.error('Error fetching video by ID:', error);
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
      image: req.body.image || `${process.env.API_URL}/images/image4.jpg`, 
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

router.post('/:videoId/comments', async (req, res) => {
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (!video) {
      return res.status(404).send('Video not found');
    }

    const newComment = {
      id: uuidv4(),
      name: req.body.name || 'Anonymous',
      comment: req.body.comment,
      likes: 0,
      timestamp: Date.now()
    };

    video.comments.push(newComment);
    await saveVideos(videos);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.delete('/:videoId/comments/:commentId', async (req, res) => {
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (!video) {
      return res.status(404).send('Video not found');
    }

    const commentIndex = video.comments.findIndex(c => c.id === req.params.commentId);
    if (commentIndex === -1) {
      return res.status(404).send('Comment not found');
    }

    const deletedComment = video.comments.splice(commentIndex, 1);
    await saveVideos(videos);

    res.status(200).json(deletedComment[0]);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
