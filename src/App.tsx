import { ReactP5Wrapper } from '@p5-wrapper/react';
import { mySketch } from './sketches/mySketch';

function App() {
  return (
    <>
      <ReactP5Wrapper sketch={mySketch} />
    </>
  );
}

export default App;
