import { P5CanvasInstance, Sketch } from '@p5-wrapper/react';
import { Graphics, MediaElement } from 'p5';
import { Bit, decypherMorse } from '../lib/morse';

const PIXEL_COMPONENTS = 4;
const SAMPLE = 1;
const FADE_FRAMES = 100;
const BRIGHTNESS_THRESHOLD = 180;
const FRAME_SEPARATOR = ' ---------- ';

let video: MediaElement;
let pg: Graphics;
let startButton: ReturnType<P5CanvasInstance['createButton']>;
let started = false;
let textShown = false;

const textOverlay = document.getElementById('text-overlay')!;

const videoBits: Bit[][] = [];

const getBrightness = (pixels: number[], i: number) =>
  (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

const getPixelIndex = (x: number, y: number, width: number) =>
  (y * width + x) * PIXEL_COMPONENTS;

export const mySketch: Sketch = (p5: P5CanvasInstance) => {
  const getVideoLayout = () => {
    const scale = Math.min(p5.width / video.width, p5.height / video.height);
    return {
      scale,
      offsetX: (p5.width - video.width * scale) / 2,
      offsetY: (p5.height - video.height * scale) / 2,
    };
  };

  const start = () => {
    if (started) return;
    started = true;
    video.play();
    startButton.hide();
    p5.loop();
  };

  const showDecypheredText = () => {
    textOverlay.textContent = videoBits
      .map(decypherMorse)
      .join(FRAME_SEPARATOR);
    textOverlay.hidden = false;
    textShown = true;
    p5.noLoop();
  };

  const drawVideo = (offsetX: number, offsetY: number, scale: number) => {
    const opacity = p5.map(p5.frameCount, 0, FADE_FRAMES, 255, 0, true);
    p5.tint(255, opacity);
    p5.image(
      video,
      offsetX,
      offsetY,
      video.width * scale,
      video.height * scale,
    );
    p5.noTint();
  };

  const drawShapes = (
    offsetX: number,
    offsetY: number,
    scale: number,
    frameBits: Bit[],
  ) => {
    p5.fill(255);
    p5.noStroke();
    for (let ly = 0; ly < video.height; ly += SAMPLE) {
      for (let lx = 0; lx < video.width; lx += SAMPLE) {
        const i = getPixelIndex(lx, ly, video.width);
        if (getBrightness(pg.pixels, i) > BRIGHTNESS_THRESHOLD) {
          p5.rect(
            offsetX + lx * scale,
            offsetY + ly * scale,
            SAMPLE * scale,
            SAMPLE * scale,
          );
          frameBits.push(1);
        } else {
          frameBits.push(0);
        }
      }
    }
  };

  p5.setup = () => {
    p5.frameRate(24);
    p5.pixelDensity(1);
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    p5.noLoop();

    video = p5.createVideo(['/assets/video.mp4']);
    video.volume(0);
    video.hide();
    video.pause();
    video.elt.onloadedmetadata = () => {
      pg = p5.createGraphics(video.width, video.height);
      pg.pixelDensity(1);
    };

    startButton = p5.createButton('Start');
    startButton.addClass('start-button');
    startButton.position(p5.width / 2 - 40, p5.height / 2 - 20);
    startButton.mousePressed(start);
  };

  p5.draw = () => {
    p5.background(0);
    if (!started || !pg) return;

    if (video.elt.paused) {
      if (!textShown) showDecypheredText();
      return;
    }

    const frameBits: Bit[] = [];
    const { scale, offsetX, offsetY } = getVideoLayout();

    pg.image(video, 0, 0);
    pg.loadPixels();
    drawVideo(offsetX, offsetY, scale);
    drawShapes(offsetX, offsetY, scale, frameBits);
    videoBits.push(frameBits);
  };
};
