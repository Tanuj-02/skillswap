export async function enterVideoFullscreen(video) {
  if (!video?.srcObject) throw new Error('Video is not ready yet.');
  if (typeof video.requestFullscreen === 'function') {
    await video.requestFullscreen();
    return;
  }
  if (typeof video.webkitEnterFullscreen === 'function') {
    video.webkitEnterFullscreen();
    return;
  }
  throw new Error('Full-screen video is unavailable in this browser.');
}
