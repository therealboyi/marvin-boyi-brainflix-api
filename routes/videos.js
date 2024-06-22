import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const videosFilePath = path.resolve(__dirname, '..', process.env.VIDEOS_FILE_PATH);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const videos = await getVideos();
    const newVideo = {
      id: uuidv4(),
      title: req.body.title,
      description: req.body.description,
      image: req.file ? `${process.env.API_URL}/images/${req.file.filename}` : `${process.env.API_URL}/images/image4.jpg`,
      channel: req.body.channel,
      views: req.body.views,
      likes: req.body.likes,
      duration: req.body.duration,
      video: req.body.video,
      timestamp: req.body.timestamp,
      comments: JSON.parse(req.body.comments)
    };
    videos.push(newVideo);
    await saveVideos(videos);
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === req.params.id);

    if (!video) {
      return res.status(404).send('Video not found');
    }

    const newComment = {
      id: uuidv4(),
      name: req.body.name,
      comment: req.body.comment,
      likes: 0,
      timestamp: Date.now(),
    };

    video.comments.push(newComment);
    await saveVideos(videos);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
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

router.put('/:videoId/likes', async (req, res) => {
  try {
    const videos = await getVideos();
    const video = videos.find(v => v.id === req.params.videoId);

    if (!video) {
      return res.status(404).send('Video not found');
    }

    video.likes = (parseInt(video.likes, 10) || 0) + 1;
    await saveVideos(videos);

    res.status(200).json(video);
  } catch (error) {
    console.error('Error incrementing likes:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
