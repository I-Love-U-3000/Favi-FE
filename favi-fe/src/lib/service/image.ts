export async function uploadToImgbb(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_KEY;
  if (!apiKey) throw new Error("Thiếu NEXT_PUBLIC_IMGBB_KEY");

  const form = new FormData();
  form.append("image", file);
  // có thể thêm name/expiration nếu cần
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