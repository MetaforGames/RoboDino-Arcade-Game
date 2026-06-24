export function getEmbeddableUrl(url: string): string {
  if (url.includes('drive.google.com')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
}
