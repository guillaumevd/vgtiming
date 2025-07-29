import { useState } from "react";
import './style.css'

const Home = (props) => {
  return (
    <div>
      <h1>VG-Timing Dashboard</h1>
      <p>Bienvenue dans l'application de chronométrage VG-Timing !</p>
      <div style={{ marginTop: '2rem' }}>
        <h3>Fonctionnalités disponibles :</h3>
        <ul style={{ color: '#ffffffea', marginTop: '1rem' }}>
          <li>⏱️ <strong>Timing</strong> - Chronométrage en temps réel</li>
          <li>🏁 <strong>Races</strong> - Gestion des courses</li>
          <li>📰 <strong>News</strong> - Actualités</li>
          <li>⚙️ <strong>Settings</strong> - Configuration de l'application</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
