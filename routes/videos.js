import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const videosFilePath = path.resolve(__dirname, '..', process.env.VIDEOS_FILE_PATH);
const imagesDir = path.join(__dirname, '..', 'public', 'images');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
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

const computeFileHash = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error('Error computing file hash:', error);
    throw error;
  }
};

const getNextUntitledVideoName = (videos) => {
  const untitledVideos = videos
    .map(video => video.title)
    .filter(title => title.startsWith('Untitled_Video'))
    .map(title => parseInt(title.split('_').pop(), 10))
    .filter(number => !isNaN(number));
  const nextNumber = untitledVideos.length > 0 ? Math.max(...untitledVideos) + 1 : 1;
  return `Untitled_Video_${String(nextNumber).padStart(2, '0')}`;
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
    let imagePath = null;
    let imageHash = null;

    if (req.file) {
      imageHash = await computeFileHash(req.file.path);
      console.log('Computed image hash:', imageHash);

      // Check if the hash already exists
      const existingImage = videos.find(video => video.imageHash === imageHash);
      if (existingImage) {
        // Remove the newly uploaded file since it's a duplicate
        await fs.unlink(req.file.path);
        imagePath = existingImage.image;
      } else {
        // Use the new image and store its hash
        imagePath = `${process.env.API_URL}/images/${req.file.filename}`;
      }
    } else {
      imagePath = `${process.env.API_URL}/images/Upload-video-preview.jpg`;
    }

    const newTitle = req.body.title || getNextUntitledVideoName(videos);

    const newVideo = {
      id: uuidv4(),
      title: newTitle,
      description: req.body.description,
      image: imagePath,
      imageHash: imageHash, // Store the hash for duplicate detection
      channel: req.body.channel,
      views: req.body.views,
      likes: req.body.likes,
      duration: req.body.duration,
      video: req.body.video,
      timestamp: Number(req.body.timestamp), 
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

    const currentLikes = parseInt(video.likes.replace(/,/g, ''), 10) || 0; 
    video.likes = (currentLikes + 1).toLocaleString(); 

    await saveVideos(videos);

    res.status(200).json({ likes: video.likes }); 
  } catch (error) {
    console.error('Error incrementing likes:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
