import Config from './components/config.js';
import Logger from './components/logger.js';

const Settings = (props) => {
  return (
    <div className="container">
      <h1 className="text-center my-5">Settings Page</h1>
      <div className="row">
        <div className="col">
          <Config />
        </div>
        <div className="col">
          <Logger />
        </div>
      </div>
    </div>
  );
}
 
export default Settings;
