import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import videoRoutes from './routes/videos.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/videos', videoRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server is running 💯 on port ${PORT}`);
});
