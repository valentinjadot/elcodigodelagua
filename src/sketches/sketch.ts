import { P5CanvasInstance, Sketch } from '@p5-wrapper/react';
import { Graphics, MediaElement } from 'p5';
import { Bit, decypherMorse } from '../lib/morse';
import Typo from 'typo-js';

const VIDEO_SRC = '/assets/video1.mp4';

const PIXEL_COMPONENTS = 4;
const SAMPLE = 1;
const FADE_FRAMES = 100;
const BRIGHTNESS_THRESHOLD = 180;
const FRAME_SEPARATOR_TWO = ' <br /><br /><br /> ';

let video: MediaElement;
let pg: Graphics;
let centerButton: ReturnType<P5CanvasInstance['createButton']>;
let started = false;
let canCapture = false;
let lastCapturedFrame = -1;
let videoFinished = false;
let decodeStarted = false;
let videoReady = false;

const textOverlay = document.getElementById('text-overlay')!;

const videoBits: Bit[][] = [];

const getBrightness = (pixels: number[], i: number) =>
  (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

const getPixelIndex = (x: number, y: number, width: number) =>
  (y * width + x) * PIXEL_COMPONENTS;

export const sketch: Sketch = (p5: P5CanvasInstance) => {
  const getVideoDimensions = () => ({
    width: video.elt.videoWidth,
    height: video.elt.videoHeight,
  });

  const setupVideoBuffer = () => {
    const { width, height } = getVideoDimensions();
    if (width === 0 || height === 0) return;

    pg?.remove();
    pg = p5.createGraphics(width, height);
    pg.pixelDensity(1);
    videoReady = true;
    centerButton.removeAttribute('disabled');
  };

  const getVideoLayout = () => {
    const { width, height } = getVideoDimensions();
    const scale = Math.min(p5.width / width, p5.height / height);
    return {
      scale,
      offsetX: (p5.width - width * scale) / 2,
      offsetY: (p5.height - height * scale) / 2,
      width,
      height,
    };
  };

  const start = () => {
    if (started || !videoReady) return;
    started = true;
    centerButton.hide();
    video.elt.onplaying = () => {
      canCapture = true;
    };
    video.play();
    p5.loop();
  };

  const handleVideoEnd = () => {
    if (decodeStarted) return;
    decodeStarted = true;
    centerButton.html('Descifrando Morse...');
    centerButton.style('cursor', 'default');
    centerButton.show();
    p5.noLoop();

    requestAnimationFrame(() => {
      centerButton.hide();
      const morseStrings = videoBits
        .map((frameBits) => decypherMorse(frameBits).morseString)
        .filter(Boolean);

      const humanStrings = videoBits
        .map((frameBits) => decypherMorse(frameBits).humanString)
        .filter(Boolean);

      const dictionary = new Typo('index', false, false, {
        dictionaryPath: '/assets/dict',
      });

      const foundWords = humanStrings
        .map((string) =>
          string
            .split(' ')
            .filter((word) => word.length >= 3)
            .filter((word) => dictionary.check(word)),
        )
        .flat()
        .filter(Boolean);

      const text = [
        `PALABRAS ENCONTRADAS:<br/><br/>
        ${foundWords.join(' ')}`,

        `MORSE:<br/><br/>
        ${morseStrings.join(FRAME_SEPARATOR_TWO)}
        `,

        `TRADUCCIÓN:<br/><br/>
        ${humanStrings.join(FRAME_SEPARATOR_TWO)}`,
      ].join('<br /><br /><br /><br />');

      textOverlay.innerHTML = text;
      textOverlay.hidden = false;
    });
  };

  const drawVideo = (
    offsetX: number,
    offsetY: number,
    scale: number,
    width: number,
    height: number,
  ) => {
    const opacity = p5.map(p5.frameCount, 0, FADE_FRAMES, 255, 0, true);
    p5.tint(255, opacity);
    p5.image(video, offsetX, offsetY, width * scale, height * scale);
    p5.noTint();
  };

  const drawShapes = (
    offsetX: number,
    offsetY: number,
    scale: number,
    width: number,
    height: number,
    frameBits: Bit[],
  ) => {
    p5.fill(255);
    p5.noStroke();
    for (let ly = 0; ly < height; ly += SAMPLE) {
      for (let lx = 0; lx < width; lx += SAMPLE) {
        const i = getPixelIndex(lx, ly, width);
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

    video = p5.createVideo([VIDEO_SRC]);
    video.volume(0);
    video.hide();
    video.pause();
    video.elt.loop = false;
    video.elt.onended = () => {
      videoFinished = true;
    };
    video.elt.onloadedmetadata = setupVideoBuffer;

    centerButton = p5.createButton('Iniciar');
    centerButton.addClass('button');
    centerButton.attribute('disabled', 'true');
    centerButton.mousePressed(start);
  };

  p5.windowResized = () => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  p5.draw = () => {
    p5.background(0);
    if (!started || !videoReady || !pg) return;

    if (videoFinished || video.elt.ended) {
      handleVideoEnd();
      return;
    }

    const frameBits: Bit[] = [];
    const { scale, offsetX, offsetY, width, height } = getVideoLayout();

    pg.image(video, 0, 0, width, height);
    pg.loadPixels();
    drawVideo(offsetX, offsetY, scale, width, height);
    drawShapes(offsetX, offsetY, scale, width, height, frameBits);

    if (!canCapture) return;

    const frameIndex = Math.round(video.time() * p5.frameRate());
    if (frameIndex === lastCapturedFrame) return;

    lastCapturedFrame = frameIndex;
    videoBits.push(frameBits);
  };
};
