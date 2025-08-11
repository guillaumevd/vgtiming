/**
 * Service pour récupérer les informations des releases GitHub
 */

const GITHUB_API_URL = 'https://api.github.com/repos/guillaumevd/vgtiming/releases/latest';

/**
 * Récupère les informations de la dernière release GitHub
 * @returns {Promise<Object>} Informations de la release
 */
export const getLatestRelease = async () => {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VGTiming-App'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur GitHub API: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      version: data.tag_name || 'v0.0.0',
      name: data.name || 'Release inconnue',
      publishedAt: new Date(data.published_at),
      body: data.body || '',
      htmlUrl: data.html_url || '',
      downloadUrl: data.assets?.[0]?.browser_download_url || '',
      isPrerelease: data.prerelease || false,
      isDraft: data.draft || false
    };
  } catch (error) {
    console.warn('Impossible de récupérer les infos de release GitHub:', error);
    
    // Fallback avec les informations locales du package.json
    return {
      version: 'v0.0.4',
      name: 'Version locale',
      publishedAt: new Date(),
      body: 'Informations de release non disponibles',
      htmlUrl: 'https://github.com/guillaumevd/vgtiming',
      downloadUrl: '',
      isPrerelease: false,
      isDraft: false,
      isLocal: true
    };
  }
};

/**
 * Met en cache les informations de release pour éviter trop d'appels API
 */
let releaseCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedLatestRelease = async () => {
  const now = Date.now();
  
  if (releaseCache && (now - cacheTime) < CACHE_DURATION) {
    return releaseCache;
  }
  
  releaseCache = await getLatestRelease();
  cacheTime = now;
  
  return releaseCache;
};
