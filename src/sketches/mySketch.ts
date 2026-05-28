import { P5CanvasInstance, Sketch } from '@p5-wrapper/react';
import { MediaElement, Element } from 'p5';

// Create the global variables: playing, video, and button.
let playing: boolean = false;
let video: MediaElement;
let button: Element;

export const mySketch: Sketch = (p5: P5CanvasInstance) => {
  p5.setup = () => {
    // Use the noCanvas() function to remove the canvas.
    const body = document.body;
    body.style.backgroundColor = 'black';
    p5.noCanvas();

    video = p5.createVideo(['/assets/video.mp4']);
    video.volume(0);
    video.size(p5.windowWidth, p5.windowHeight);
    button = p5.createButton('play');
    button.position(
      p5.windowWidth / 2 - button.width / 2,
      p5.windowHeight / 2 - button.height / 2,
    );
    button.mousePressed(startVideo);
  };

  function startVideo() {
    if (playing) return;

    video.loop();
    button.style('display', 'none');
    playing = true;
  }
};
