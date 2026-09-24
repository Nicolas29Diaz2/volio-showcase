# 3D WebGL & Video Texture Performance Guide

## The Mobile WebGL Rendering Bottleneck

In WebGL, transferring image or video data from CPU/System RAM across the PCIe bus into GPU VRAM via `gl.texImage2D` or `gl.texSubImage2D` is an expensive synchronous operation.

### Naive Implementation (Performance Hazard)
```typescript
// ANTI-PATTERN: Uploads 60 times/sec regardless of video frame updates
useFrame(() => {
  texture.needsUpdate = true;
});
```
- At 60 FPS on a 1080p canvas:
  $$\text{Throughput} = 1920 \times 1080 \times 4\text{ bytes} \times 60\text{ fps} \approx 497\text{ MB/s}$$
- On mobile devices, this saturates memory bandwidth, causes massive thermal throttling, and triggers severe frame rate degradation (<18 FPS).

### Volio's Solution: Decoded Frame Synchronization
```typescript
// OPTIMAL PATTERN: Decoded Frame Synchronization (RVFC)
video.requestVideoFrameCallback(() => {
  entry.dirty = true;
  scheduleFrameCallback(entry);
});

useFrame(() => {
  if (entry.dirty) {
    ctx.drawImage(entry.video, 0, 0);
    texture.needsUpdate = true;
    entry.dirty = false;
  }
});
```
- Only invokes `gl.texSubImage2D` when the media decoder produces an actual new video frame (e.g. 24 or 30 FPS).
- Halves memory bandwidth consumption and guarantees smooth, jitter-free 60 FPS animation.
