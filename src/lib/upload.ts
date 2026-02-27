import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage({
  path,
  file,
}: {
  path: string;
  file: File;
}): Promise<string> {
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "image/jpeg" });
  return await getDownloadURL(r);
}

export async function deleteFolder(path: string): Promise<void> {
  // deletes all objects under a folder
  const folderRef = ref(storage, path);
  const listed = await listAll(folderRef);
  await Promise.allSettled(listed.items.map((it) => deleteObject(it)));
}
