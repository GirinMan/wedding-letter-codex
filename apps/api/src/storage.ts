import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

import { getConfig } from "./config.js";

let client: S3Client | undefined;

function getClient(): S3Client {
  const config = getConfig();
  client ??= new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY,
      secretAccessKey: config.S3_SECRET_KEY,
    },
  });
  return client;
}

export async function putObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  await getClient().send(new PutObjectCommand({
    Bucket: getConfig().S3_BUCKET,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
  }));
}

export async function getObject(key: string): Promise<{
  body: Readable;
  contentType: string;
  contentLength?: number;
}> {
  const response = await getClient().send(new GetObjectCommand({
    Bucket: getConfig().S3_BUCKET,
    Key: key,
  }));

  if (!response.Body) {
    throw new Error("Stored object has no body");
  }

  return {
    body: response.Body as Readable,
    contentType: response.ContentType ?? "application/octet-stream",
    ...(response.ContentLength === undefined ? {} : { contentLength: response.ContentLength }),
  };
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({
    Bucket: getConfig().S3_BUCKET,
    Key: key,
  }));
}

export async function createDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getConfig().S3_BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function checkStorage(): Promise<void> {
  await getClient().send(new HeadBucketCommand({ Bucket: getConfig().S3_BUCKET }));
}
