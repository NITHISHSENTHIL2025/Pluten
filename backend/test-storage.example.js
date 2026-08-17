// Development-only example. Do not run against production unless you explicitly intend to test storage.
require('dotenv').config();
const { HeadBucketCommand, S3Client } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: process.env.CLOUD_REGION,
  endpoint: process.env.CLOUD_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUD_ACCESS_KEY,
    secretAccessKey: process.env.CLOUD_SECRET_KEY,
  },
});

(async () => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: process.env.CLOUD_BUCKET_NAME }));
    console.log('STORAGE_HEALTHY');
  } catch (error) {
    console.error('STORAGE_UNAVAILABLE', error.message);
    process.exitCode = 1;
  }
})();
