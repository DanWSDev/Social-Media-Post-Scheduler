const express = require('express');
const cors = require('cors');
const multer = require('multer'); // for images 
const fs = require('fs');  
const CronJob = require("cron").CronJob; // for the scheduler
const { TwitterApi } = require("twitter-api-v2"); // Twitter API

const app = express();
const port = 3000;

require('dotenv').config({ path: './apis/twitterapi/.env' }); //twitter api .env  path

const upload = multer({ dest: 'uploads/' }) 

app.use(cors());
app.use(express.json());

const scheduler = [];

// Twitter 

const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,  // twitter api 
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
});

const rwClient = client.readWrite; // to post needs the write permission

const uploadMedia = async (mediafile) => {
    try {
        if(!mediafile){
            console.log("No media file uploaded");
            return null;
        }
        const mediaData = fs.readFileSync(mediafile.path);
        
        const mediaID = await rwClient.v1.uploadMedia(mediaData, { mimeType: 'image/*' }); // allows all images types when uploading
        return mediaID;
    }
    catch (err) {
        console.error("Error Upload Media - ", err);
    }
}

const postMedia = async (mediaID, text) => {
    try {
        await rwClient.v2.tweet({ text: text, media: { media_ids: [mediaID] } }); // posts the image with the text
    }
    catch (err) {
        console.error("Error Post Media - ", err);

    }
}

const Media = async (text, mediafile) => {
    try {
        if (!mediafile)
            {
        await rwClient.v2.tweet({ text: text }); // just text post
            }
        else
            {
        const mediaID = await uploadMedia(mediafile);
        await postMedia(mediaID, text);
        }
    }
    catch (err) {
        console.error("Error Media Only - ", err);
    }

}

app.post('/data', upload.single('media'), (req, res) => {
    const text = req.body.text;
    const mediafile = req.file;
    const date = req.body.date;
    const time = req.body.time;
    const social = req.body.platform;  // come back to this later if have time can be used for more social media options
    const schedule = req.body.schedule === 'true'; // true or false

    if (text.length > 280) // Twitter Character Length
    {
        res.send("ERROR: To many characters for a tweet");
        return;
    }

    // Function to convert date and time to cron expression
const dateTimeToCron = (dateStr, timeStr) => {
    const datetimeStr = `${dateStr}T${timeStr}:00`;
    const datetime = new Date(datetimeStr);
    
    const minute = datetime.getMinutes();
    const hour = datetime.getHours();
    const dayOfMonth = datetime.getDate();
    const month = datetime.getMonth() + 1; // JavaScript months are zero-indexed

    // Asterisk (*) for day of week means "every day of the week"
    return `${minute} ${hour} ${dayOfMonth} ${month} *`;
};

const cronExpression = dateTimeToCron(date, time);

console.log("Cron Expression:", cronExpression);

    console.log("Received Data:", { text, mediafile, date, time, schedule });

    if (schedule)
    {
        res.send("Scheduled tweet at: " + time + " " + date + " " + (scheduler.length + 1));
        const job = new CronJob(cronExpression, async () => {
        await Media(text, mediafile);   
        scheduler.splice(scheduler.indexOf(job), 1);
        if (mediafile) {
            fs.unlink(mediafile.path, (err) => {
              if (err) {                                        // deletes image from uploads folder
                console.error("Error deleting file:", err);
              } else {
                console.log(`Deleted file: ${mediafile.path}`);
              }
            })};

        job.stop();
        })
        job.start();
        scheduler.push(job);
    }
    else
    {
        res.send("Tweet Posted");
        Media(text, mediafile);

        if (mediafile) {
            fs.unlink(mediafile.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);      // deletes image from uploads folder
              } else {
                console.log(`Deleted file: ${mediafile.path}`);
              }
            })};
    }

});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});