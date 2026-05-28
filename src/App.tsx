import { ReactP5Wrapper } from '@p5-wrapper/react';
import { sketch } from './sketches/sketch';

function App() {
  return (
    <>
      <ReactP5Wrapper sketch={sketch} />
    </>
  );
}

export default App;
