import { useState } from "react";

const Config = () => {
  const [outputDir, setoutputDir] = useState(window.Store.get('outputDir'));

  function handleOutputChange(event) {
    setoutputDir(event.target.value);
    window.Store.set('outputDir', event.target.value);
  }

  return (
    <div className="config">
      <h3>Configuration</h3>
      <div className="form-group">
        <label htmlFor="outputDirInput">Output dir:</label>
        <input
          type="text"
          id="outputDirInput"
          className="form-control"
          value={outputDir}
          onChange={handleOutputChange}
        />
      </div>
    </div>
  );
};

export default Config;
