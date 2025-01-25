const cors = require("cors");
const express = require("express");
const app = express();
const dotenv = require("dotenv");
// const { bundle } = require("@remotion/bundler");
const {
  renderMediaOnLambda,
  deploySite,
  getOrCreateBucket,
} = require("@remotion/lambda");
const { getRenderProgress, presignUrl } = require("@remotion/lambda/client");
const path = require("path");

// require("dotenv").config();
// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;

async function renderVideo_OnLambda(data) {
  // AWS configuration
  const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-east-1",
  };
  // console.log(process.cwd());
  // console.log(__dirname);
  // console.log(path.resolve(__dirname, "../src/index.tsx"));
  // Bundle the Remotion composition
  // console.log('getting bundle');
  // const bundleLocation = await bundle({
  //   // entryPoint: path.join(__dirname, "../src/index.tsx"),
  //   entryPoint: path.resolve(__dirname, "../src/index.tsx"),
  //   webpackConfigOverride: (config) => config,
  // });

  console.log('getting bucket');

  const { bucketName } = await getOrCreateBucket({
    region: awsConfig.region,
  });

  // Deploy the site

  // const serveUrl = await deploySite({
  //   entryPoint: path.resolve(__dirname, "../src/index.tsx"),
  //   siteName: `my-video`,
  //   region: awsConfig.region,
  //   bucketName,
  //   privacy: "public",
  //   options: {},
  // });

  // console.log("Deployed site:", serveUrl.serveUrl);

  // Lambda render configuration
  const renderJob = await renderMediaOnLambda({
    ...awsConfig,
    functionName: "remotion-render-4-0-221-mem2048mb-disk2048mb-120sec",
    composition: "CoreComposition", // Directly specify the composition ID
    framesPerLambda: 200,
    inputProps: { data },
    serveUrl: 'https://remotionlambda-useast1-0lu3rtqh09.s3.us-east-1.amazonaws.com/sites/my-video/index.html',
    codec: "h264",
    privacy: "no-acl",
    height: data.size.height,
    width: data.size.width,
    downloadBehavior: {
      type: "download",
      fileName: "output.mp4",
    },
    // downloadBehavior:''
  });

  console.log("Render Job Details:", renderJob);
  return renderJob;
}

async function getStatus(renderId) {
  try {
    const progress = await getRenderProgress({
      renderId: renderId,
      bucketName: "remotionlambda-useast1-0lu3rtqh09",
      functionName: "remotion-render-4-0-221-mem2048mb-disk2048mb-120sec",
      region: "us-east-1",
    });
    return progress; // Return the progress object
  } catch (error) {
    console.error("Error getting render progress:", error);
    throw error; // Rethrow the error to be handled by the API route
  }
}
async function getPresignedUrl(key) {
  try {
    const url = await presignUrl({
      region: "us-east-1",
      bucketName: "remotionlambda-useast1-0lu3rtqh09",
      objectKey: key,
      expiresInSeconds: 900,
      checkIfObjectExists: true,
    });
    return url;
  } catch (err) {
    console.error("Error getting presigned url:", err);
    throw err;
  }
}
// Routes
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
  })
);
app.get("/", (req, res) => {
  res.send("server is running");
});
app.get("/api", (req, res) => {
  res.send("server is running");
});

app.post("/api/render", async (req, res) => {
  try {
    const data = req.body;
    console.log("Received data:", data.id);

    const response = await renderVideo_OnLambda(data);
    console.log("Lambda response:", response);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.get("/api/render/status/:renderId", async (req, res) => {
  try {
    const { renderId } = req.params;
    const result = await getStatus(renderId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/render/getUrl", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const result = await getPresignedUrl(data.key);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
