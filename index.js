const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const videoRoutes = require('./routes/videos');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/videos', videoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
