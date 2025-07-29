import { Route, Routes, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import styled from "styled-components";

// Css
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './assets/css/style.css'

// Logger
import { LogProvider } from './logger/LogContext';

// Components
import { Home, Timing, Races, News, Settings, Sidebar } from './components';

// Constants
import { API_ENDPOINTS, ROUTES } from './constants';

// Utils
import { fetchManifest } from './utils';

const Pages = styled.div`
  width: 90%;
  height: 100%;
  display: flex;
  z-index: 0;
  margin: auto;
  h1 {
    font-size: calc(2rem + 2vw);
    background: linear-gradient(to right, #803bec 30%, #1b1b1b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;


function App() {
  const location = useLocation();

  const [manifest, setManifest] = useState();

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchManifest();
        setManifest(data || {}); // Utiliser un objet vide au lieu de null
      } catch (err) {
        console.log('Manifest fetch failed, using default');
        setManifest({}); // Utiliser un objet vide au lieu de null
      }
    };
    getData();
  }, []);

  // Toujours afficher l'application (avec ou sans manifest)
  return (
    <>
      <LogProvider>
        <Sidebar/>
        <Pages>
          <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
              <Route exact path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.TIMING} element={<Timing/>} />
              <Route path={ROUTES.RACES} element={<Races/>} />
              <Route path={ROUTES.NEWS} element={<News/>} />
              <Route path={ROUTES.SETTINGS} element={<Settings/>} />
            </Routes>
          </AnimatePresence>
        </Pages>
      </LogProvider>
    </>
  );
}

export default App;
