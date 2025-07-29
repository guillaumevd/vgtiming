import React, { useState, useEffect } from "react";
import "./css/index.css";

function News() {
  const [news, setNews] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [showContent, setShowContent] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await window.electron.invoke(
          "fetch",
          "https://nitter.net/elonmusk/rss"
        );
        const parser = new DOMParser();
        const xml = parser.parseFromString(response, "text/xml");
        const items = xml.querySelectorAll("item");
        const parsedItems = Array.from(items).map((item) => {
          const contentEncoded = item.querySelector("content\\:encoded, encoded");
          return {
            title: item.querySelector("title").textContent,
            pubDate: item.querySelector("pubDate").textContent,
            link: item.querySelector("link").textContent,
            description: item.querySelector("description").textContent,
            content: contentEncoded ? contentEncoded.textContent : "",
          };
        });
        setNews(parsedItems);
      } catch (error) {
        console.error(error);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  const displayedNews = showMore ? news : news.slice(0, 5);

  return (
    <div className="news-container">
      {displayedNews &&
        displayedNews.map((item, index) => (
          <div key={index} className="news-item">
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
                Read More
              </button>
            )}
          </div>
        ))}
      {!showMore && (
        <button
          className="btn show-more-button"
          onClick={() => setShowMore(true)}
        >
          Show More
        </button>
      )}
    </div>
  );
}

export default News;