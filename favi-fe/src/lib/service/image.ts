//we decide to use cloundinary instead
export async function uploadToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_KEY;
  if (!apiKey) throw new Error("Thiếu NEXT_PUBLIC_IMGBB_KEY");

  const form = new FormData();
  form.append("image", file);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  if (!r.ok) {
    let msg = "Upload failed";
    try {
      const j = await r.json();
      msg = j?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await r.json();
  const url: string | undefined = data?.data?.url;
  if (!url) throw new Error("No URL returned");
  return url;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET; 

  if (!cloudName) throw new Error("Thiếu NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!preset) throw new Error("Thiếu NEXT_PUBLIC_CLOUDINARY_PRESET");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  // Tuỳ chọn:
  // form.append("folder", "favi/uploads");
  // form.append("tags", "favi,avatar");

  // dùng 'auto/upload' để ảnh hoặc video đều được
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const r = await fetch(endpoint, { method: "POST", body: form });

  if (!r.ok) {
    let msg = "Upload failed";
    try {
      const j = await r.json();
      msg = j?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await r.json();
  const url: string | undefined = data?.secure_url;
  if (!url) throw new Error("No URL returned");
  return url;
}
