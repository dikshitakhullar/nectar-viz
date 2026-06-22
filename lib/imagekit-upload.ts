import ImageKit from "imagekit";

let _client: ImageKit | null = null;

function getClient(): ImageKit {
  if (_client) return _client;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error(
      "ImageKit not configured — missing IMAGEKIT_URL_ENDPOINT / PUBLIC_KEY / PRIVATE_KEY",
    );
  }
  _client = new ImageKit({ urlEndpoint, publicKey, privateKey });
  return _client;
}

/**
 * Upload a binary image to ImageKit. Returns the public CDN URL.
 * Folder defaults to `/renders/` to keep saved renders grouped.
 */
export async function uploadImage(args: {
  buffer: Buffer;
  fileName: string;
  folder?: string;
}): Promise<string> {
  const ik = getClient();
  const res = await ik.upload({
    file: args.buffer,
    fileName: args.fileName,
    folder: args.folder ?? "/renders/",
    useUniqueFileName: true,
  });
  return res.url;
}
