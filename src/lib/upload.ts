import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "./firebase";

async function resizeImage(file: File): Promise<Blob> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  return await new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const max = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height && width > max) {
        height = Math.round((height * max) / width);
        width = max;
      } else if (height > max) {
        width = Math.round((width * max) / height);
        height = max;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob && blob.size < file.size ? blob : file),
        "image/webp",
        0.78
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function uploadImage({
  path,
  file,
}: {
  path: string;
  file: File;
}): Promise<string> {
  const image = await resizeImage(file);
  const r = ref(storage, path);
  await uploadBytes(r, image, {
    contentType: image.type || "image/webp",
    cacheControl: "public,max-age=31536000",
  });
  return await getDownloadURL(r);
}

export async function deleteFolder(path: string): Promise<void> {
  const folderRef = ref(storage, path);
  const listed = await listAll(folderRef);
  await Promise.allSettled(listed.items.map((it) => deleteObject(it)));
}

export async function deleteFile(path: string): Promise<void> {
  const r = ref(storage, path);
  await deleteObject(r);
}
