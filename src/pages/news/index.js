import React, { useState, useEffect } from "react";
import "./css/index.css";

function News() {
  const [news, setNews] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [showContent, setShowContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Générer des actualités basées sur les données du backend
        await generateNewsFromBackend();
        
        // Fallback vers RSS externe si pas de données backend
        if (news.length === 0) {
          await fetchExternalNews();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des actualités:', error);
        setError('Impossible de charger les actualités');
      } finally {
        setLoading(false);
      }
    };

    const generateNewsFromBackend = async () => {
      try {
        // Attendre que l'API backend soit prête
        if (!window.VGTiming || !window.VGTiming.isReady) {
          return;
        }

        const generatedNews = [];

        // Récupérer les courses récentes
        const racesResult = await window.VGTiming.getAllRaces();
        if (racesResult.success && racesResult.data.length > 0) {
          const recentRaces = racesResult.data
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

          for (const race of recentRaces) {
            generatedNews.push({
              title: `🏁 Nouvelle course créée: ${race.name}`,
              pubDate: new Date(race.createdAt).toISOString(),
              link: '#',
              description: `Course ${race.type || 'course'} prévue le ${race.date ? new Date(race.date).toLocaleDateString('fr-FR') : 'date à définir'} à ${race.location || 'lieu à définir'}`,
              content: `La course "${race.name}" a été créée avec ${race.distance || 'distance non définie'}. ${race.description || ''}`,
              type: 'race',
              status: race.status
            });
          }
        }

        // Récupérer les activités récentes
        const now = new Date();
        generatedNews.push({
          title: `📊 Système VG-Timing opérationnel`,
          pubDate: now.toISOString(),
          link: '#',
          description: 'Le système de chronométrage VG-Timing est en ligne et prêt à être utilisé.',
          content: 'Toutes les fonctionnalités sont disponibles: gestion des courses, chronométrage en temps réel, et analyse des performances.',
          type: 'system'
        });

        // Récupérer les statistiques
        let totalParticipants = 0;
        if (racesResult.success) {
          for (const race of racesResult.data) {
            try {
              const participantsResult = await window.VGTiming.getParticipantsByRace(race.id);
              if (participantsResult.success) {
                totalParticipants += participantsResult.data.length;
              }
            } catch (e) {
              // Ignorer les erreurs
            }
          }
        }

        if (totalParticipants > 0) {
          generatedNews.push({
            title: `👥 ${totalParticipants} participants inscrits`,
            pubDate: now.toISOString(),
            link: '#',
            description: `Au total, ${totalParticipants} participants sont inscrits aux différentes courses.`,
            content: `Le système compte actuellement ${totalParticipants} participants répartis sur ${racesResult.data?.length || 0} courses.`,
            type: 'stats'
          });
        }

        setNews(generatedNews);
      } catch (error) {
        console.warn('Erreur lors de la génération des actualités backend:', error);
      }
    };

    const fetchExternalNews = async () => {
      try {
        // Garder le code RSS existant comme fallback
        const response = await window.electron?.invoke(
          "fetch",
          "https://nitter.net/elonmusk/rss"
        );
        
        if (!response) return;
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(response, "text/xml");
        const items = xml.querySelectorAll("item");
        const parsedItems = Array.from(items).slice(0, 3).map((item) => {
          const contentEncoded = item.querySelector("content\\:encoded, encoded");
          return {
            title: `🌐 ${item.querySelector("title").textContent}`,
            pubDate: item.querySelector("pubDate").textContent,
            link: item.querySelector("link").textContent,
            description: item.querySelector("description").textContent,
            content: contentEncoded ? contentEncoded.textContent : "",
            type: 'external'
          };
        });
        setNews(prev => [...prev, ...parsedItems]);
      } catch (error) {
        console.warn('Erreur lors du chargement du RSS externe:', error);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  const displayedNews = showMore ? news : news.slice(0, 5);

  if (loading) {
    return (
      <div className="news-container">
        <div className="news-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des actualités...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-container">
        <div className="news-error">
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="news-container">
      <div className="news-header-section">
        <h2>📰 Actualités VG-Timing</h2>
        <p>Dernières nouvelles et activités du système de chronométrage</p>
      </div>
      
      {news.length === 0 ? (
        <div className="news-empty">
          <p>🔍 Aucune actualité disponible pour le moment</p>
          <p>Créez des courses et ajoutez des participants pour voir apparaître des actualités !</p>
        </div>
      ) : (
        displayedNews.map((item, index) => (
          <div key={index} className={`news-item news-item-${item.type || 'default'}`}>
            <div className="news-header">
              <h5 className="news-title">{item.title}</h5>
              <span className="news-date">{formatDate(item.pubDate)}</span>
            </div>
            <div
              className={
                showContent === index
                  ? "news-description full"
                  : "news-description truncated"
              }
              dangerouslySetInnerHTML={{ __html: item.description }}
            ></div>
            {showContent === index ? (
              <button
                className="btn news-button"
                onClick={() => setShowContent(null)}
              >
                Read Less
              </button>
            ) : (
              <button
                className="btn news-button"
                onClick={() => setShowContent(index)}
              >
                Lire plus
              </button>
            )}
          </div>
        ))
      )}
      
      {!showMore && news.length > 5 && (
        <button
          className="btn show-more-button"
          onClick={() => setShowMore(true)}
        >
          Afficher plus
        </button>
      )}
    </div>
  );
}

export default News;