require("dotenv").config();

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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
        await client.send(
            new PutObjectCommand({
                Bucket: process.env.CLOUD_BUCKET_NAME,
                Key: "hello.txt",
                Body: Buffer.from("Hello"),
                ContentType: "text/plain",
            })
        );

        console.log("SUCCESS");
    } catch (e) {
        console.error(e);
    }
})();