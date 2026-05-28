import { P5CanvasInstance, Sketch } from '@p5-wrapper/react';
import { Graphics, MediaElement } from 'p5';
import { Bit, decypherMorse } from '../lib/morse';

const PIXEL_COMPONENTS = 4;
const SAMPLE = 8;
const FADE_FRAMES = 100;
const BRIGHTNESS_THRESHOLD = 180;

let video: MediaElement;
let pg: Graphics;
let startButton: ReturnType<P5CanvasInstance['createButton']>;
let started = false;
let startedDecyphering = false;
let humanText: string = '';

const allSampledPixels: Bit[] = [];

const getBrightness = (pixels: number[], i: number) =>
  (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

const getPixelIndex = (x: number, y: number, width: number) =>
  (y * width + x) * PIXEL_COMPONENTS;

export const mySketch: Sketch = (p5: P5CanvasInstance) => {
  const start = () => {
    if (started) return;
    started = true;
    video.play();
    startButton.hide();
    p5.loop();
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

  const drawShapes = (offsetX: number, offsetY: number, scale: number) => {
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
          allSampledPixels.push(1);
        } else {
          allSampledPixels.push(0);
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
    startButton.position(p5.width / 2 - 40, p5.height / 2 - 20);
    startButton.style('padding', '12px 24px');
    startButton.style('font-size', '22px');
    startButton.style('cursor', 'pointer');
    startButton.style('background-color', '#000');
    startButton.style('color', '#fff');
    startButton.style('border', 'none');

    startButton.mousePressed(() => {
      start();
      return false;
    });
  };

  p5.draw = () => {
    p5.background(0);
    if (!started || !pg) return;

    const scale = Math.min(p5.width / video.width, p5.height / video.height);
    const offsetX = (p5.width - video.width * scale) / 2;
    const offsetY = (p5.height - video.height * scale) / 2;

    pg.image(video, 0, 0);
    pg.loadPixels();

    if (!video.elt.paused) {
      drawVideo(offsetX, offsetY, scale);
      drawShapes(offsetX, offsetY, scale);
    } else {
      if (!startedDecyphering) {
        humanText = decypherMorse(allSampledPixels);
        startedDecyphering = true;
      }

      if (humanText) {
        const maxWidth = p5.width * 0.85;
        const maxHeight = p5.height * 0.85;
        let size = 32;
        let lines: string[] = [];
        let lineHeight = size * 1.35;

        p5.fill(255);
        p5.noStroke();
        p5.textAlign(p5.CENTER, p5.CENTER);

        const wrapLines = (fontSize: number) => {
          p5.textSize(fontSize);
          const height = fontSize * 1.35;
          const words = humanText.split(/\s+/);
          const wrapped: string[] = [];
          let current = '';

          for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (p5.textWidth(next) > maxWidth && current) {
              wrapped.push(current);
              current = word;
            } else {
              current = next;
            }
          }

          if (current) wrapped.push(current);
          return { wrapped, height };
        };

        while (size > 14) {
          ({ wrapped: lines, height: lineHeight } = wrapLines(size));
          if (lines.length * lineHeight <= maxHeight) break;
          size -= 2;
        }

        let y =
          p5.height / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;
        for (const line of lines) {
          p5.text(line, p5.width / 2, y);
          y += lineHeight;
        }
      }
    }
  };
};
