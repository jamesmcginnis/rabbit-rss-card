/**
 * Rabbit RSS Card
 * GitHub: https://github.com/jamesmcginnis/rabbit-rss-card
 */

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rabbit-rss-card",
  name: "Rabbit RSS Card",
  description: "A multi-feed RSS reader with full color customization.",
  preview: true
});

/**
 * 2. THE VISUAL EDITOR
 */
class RabbitRSSEditor extends HTMLElement {
  constructor() {
    super();
    this._config = { 
      title: "Rabbit RSS", 
      feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"],
      refresh_interval: 30,
      max_articles: 20,
      header_color: "#03a9f4",
      header_text_color: "#ffffff",
      bg_color: "#ffffff",
      title_text_color: "#000000",
      meta_text_color: "#666666",
      summary_text_color: "#555555"
    };
  }

  setConfig(config) {
    this._config = { ...this._config, ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._config || this._rendered) return;

    this.innerHTML = `
      <style>
        .card-config { padding: 10px; font-family: sans-serif; display: flex; flex-direction: column; gap: 12px; }
        .config-label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
        .input-box { 
          width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; 
          box-sizing: border-box; background: white; color: black;
        }
        .number-input {
          width: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;
          box-sizing: border-box; background: white; color: black;
        }
        .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .color-row { display: flex; align-items: center; gap: 10px; }
        .color-picker { width: 40px; height: 30px; padding: 0; border: none; cursor: pointer; }
        .feed-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .btn { padding: 8px 12px; cursor: pointer; background: #03a9f4; color: white; border: none; border-radius: 4px; }
        .btn-delete { background: #f44336; }
        .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 10px; }
        .interval-row { display: flex; align-items: center; gap: 10px; }
        .help-text { font-size: 12px; color: #666; margin-top: 5px; }
      </style>
      <div class="card-config">
        <div>
          <label class="config-label">Card Title</label>
          <input type="text" class="input-box" id="title-input" value="${this._config.title || ''}">
        </div>

        <div>
          <label class="config-label">Refresh Interval (minutes)</label>
          <div class="interval-row">
            <input type="number" class="number-input" id="refresh-interval-input" 
                   value="${this._config.refresh_interval || 30}" min="1" max="1440">
            <span>minutes</span>
          </div>
          <div class="help-text">Feeds will automatically refresh at this interval (1-1440 minutes)</div>
        </div>

        <div class="section-title">Colors</div>
        <div class="color-grid">
          <div class="color-row">
            <input type="color" class="color-picker" id="header-color-picker" value="${this._config.header_color || '#03a9f4'}">
            <label>Header Bg</label>
          </div>
          <div class="color-row">
            <input type="color" class="color-picker" id="header-text-picker" value="${this._config.header_text_color || '#ffffff'}">
            <label>Header Text</label>
          </div>
          <div class="color-row">
            <input type="color" class="color-picker" id="bg-color-picker" value="${this._config.bg_color || '#ffffff'}">
            <label>Card Bg</label>
          </div>
          <div class="color-row">
            <input type="color" class="color-picker" id="title-text-picker" value="${this._config.title_text_color || '#000000'}">
            <label>Article Title</label>
          </div>
          <div class="color-row">
            <input type="color" class="color-picker" id="meta-text-picker" value="${this._config.meta_text_color || '#666666'}">
            <label>Meta Text</label>
          </div>
          <div class="color-row">
            <input type="color" class="color-picker" id="summary-text-picker" value="${this._config.summary_text_color || '#555555'}">
            <label>Summary Text</label>
          </div>
        </div>

        <div class="section-title">RSS Feeds</div>
        <div id="feeds-container">
          ${(this._config.feeds || []).map((url, idx) => `
            <div class="feed-row">
              <input type="text" class="input-box feed-input" data-index="${idx}" value="${url}" style="margin-bottom:0;">
              <button class="btn btn-delete remove-feed" data-index="${idx}">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" id="add-feed">+ Add Feed URL</button>
      </div>
    `;

    this.querySelector('#title-input').addEventListener('change', (e) => this._updateConfig({ title: e.target.value }));
    this.querySelector('#refresh-interval-input').addEventListener('change', (e) => {
      const value = Math.max(1, Math.min(1440, parseInt(e.target.value) || 30));
      e.target.value = value;
      this._updateConfig({ refresh_interval: value });
    });
    this.querySelector('#header-color-picker').addEventListener('change', (e) => this._updateConfig({ header_color: e.target.value }));
    this.querySelector('#header-text-picker').addEventListener('change', (e) => this._updateConfig({ header_text_color: e.target.value }));
    this.querySelector('#bg-color-picker').addEventListener('change', (e) => this._updateConfig({ bg_color: e.target.value }));
    this.querySelector('#title-text-picker').addEventListener('change', (e) => this._updateConfig({ title_text_color: e.target.value }));
    this.querySelector('#meta-text-picker').addEventListener('change', (e) => this._updateConfig({ meta_text_color: e.target.value }));
    this.querySelector('#summary-text-picker').addEventListener('change', (e) => this._updateConfig({ summary_text_color: e.target.value }));

    this.querySelectorAll('.feed-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const newFeeds = [...this._config.feeds];
        newFeeds[e.target.dataset.index] = e.target.value;
        this._updateConfig({ feeds: newFeeds });
      });
    });

    this.querySelector('#add-feed').addEventListener('click', () => {
      const newFeeds = [...(this._config.feeds || []), ""];
      this._rendered = false; 
      this._updateConfig({ feeds: newFeeds });
    });

    this.querySelectorAll('.remove-feed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newFeeds = [...this._config.feeds];
        newFeeds.splice(e.target.dataset.index, 1);
        this._rendered = false;
        this._updateConfig({ feeds: newFeeds });
      });
    });

    this._rendered = true;
  }

  _updateConfig(newValues) {
    const event = new CustomEvent("config-changed", {
      detail: { config: { ...this._config, ...newValues } },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}
customElements.define("rabbit-rss-editor", RabbitRSSEditor);

/**
 * 3. THE MAIN CARD LOGIC
 */
class RabbitRSSCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("rabbit-rss-editor");
  }

  static getStubConfig() {
    return { 
      title: "Rabbit RSS",
      feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"],
      refresh_interval: 30,
      max_articles: 20,
      header_color: "#03a9f4",
      header_text_color: "#ffffff",
      bg_color: "#ffffff",
      title_text_color: "#000000",
      meta_text_color: "#666666",
      summary_text_color: "#555555"
    };
  }

  setConfig(config) {
    const oldFeeds = JSON.stringify(this._config?.feeds);
    const oldInterval = this._config?.refresh_interval;
    const oldMaxArticles = this._config?.max_articles;
    this._config = config || {};
    this._applyStyles();

    if (oldFeeds !== JSON.stringify(config.feeds) && this.content) {
      this._fetchRSS();
    }

    // Update auto-refresh interval if changed
    if (oldInterval !== config.refresh_interval) {
      this._setupAutoRefresh();
    }

    // Re-render if max articles changed
    if (oldMaxArticles !== config.max_articles && this._cachedArticles) {
      this._render(this._cachedArticles);
    }
  }

  _applyStyles() {
    if (!this.container) return;
    this.headerTitle.innerText = this._config.title || "Rabbit RSS";
    
    const header = this.querySelector(".header");
    header.style.backgroundColor = this._config.header_color || "#03a9f4";
    header.style.color = this._config.header_text_color || "#ffffff";
    
    this.container.style.backgroundColor = this._config.bg_color || "#ffffff";
    this.content.style.backgroundColor = this._config.bg_color || "#ffffff";
    
    this.container.style.setProperty('--article-title-color', this._config.title_text_color || "#000000");
    this.container.style.setProperty('--article-meta-color', this._config.meta_text_color || "#666666");
    this.container.style.setProperty('--article-summary-color', this._config.summary_text_color || "#555555");
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) this._init();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%; transition: all 0.3s ease; }
        .header { padding: 16px; font-weight: bold; font-size: 1.1em; display: flex; justify-content: space-between; align-items: center; }
        .refresh-btn { cursor: pointer; transition: transform 0.2s; }
        .refresh-btn:active { transform: rotate(180deg); }
        .article-list { max-height: 450px; overflow-y: auto; }
        .article { 
          padding: 12px 16px; 
          border-bottom: 1px solid var(--divider-color); 
          cursor: pointer; 
          display: flex; 
          gap: 12px;
          text-decoration: none; 
        }
        .article:hover { background: rgba(125, 125, 125, 0.1); }
        .article-thumbnail { 
          width: 120px; 
          height: 80px; 
          flex-shrink: 0;
          object-fit: cover; 
          border-radius: 4px;
          background: #e0e0e0;
        }
        .article-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .title { 
          font-weight: 500; 
          color: var(--article-title-color); 
          line-height: 1.4; 
          transition: color 0.3s;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .summary {
          font-size: 0.85em;
          color: var(--article-summary-color);
          line-height: 1.4;
          transition: color 0.3s;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .meta { 
          font-size: 0.8em; 
          color: var(--article-meta-color); 
          transition: color 0.3s; 
        }
      </style>
      <ha-card id="card-container">
        <div class="header">
          <span id="header-title"></span>
          <ha-icon id="refresh-icon" class="refresh-btn" icon="mdi:refresh"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading feeds...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.container = this.querySelector("#card-container");
    this.headerTitle = this.querySelector("#header-title");
    
    this.querySelector("#refresh-icon").onclick = () => this._fetchRSS();
    
    this._applyStyles();
    this._fetchRSS();
    this._setupAutoRefresh();
  }

  _setupAutoRefresh() {
    // Clear existing interval if any
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }

    // Set up new interval (convert minutes to milliseconds)
    const intervalMinutes = this._config.refresh_interval || 30;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this._refreshInterval = setInterval(() => {
      this._fetchRSS();
    }, intervalMs);
  }

  disconnectedCallback() {
    // Clean up interval when card is removed
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _fetchRSS() {
    const feeds = (this._config && this._config.feeds) || [];
    const validFeeds = feeds.filter(url => url && url.trim().startsWith("http"));
    if (validFeeds.length === 0) {
      if (this.content) this.content.innerHTML = `<div style="padding:20px;">No valid feeds.</div>`;
      return;
    }
    
    if (this.content) this.content.style.opacity = "0.5";

    try {
      const promises = validFeeds.map(url => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&cache_boost=${Date.now()}`).then(res => res.json()));
      const results = await Promise.all(promises);
      let allItems = [];
      results.forEach(data => {
        if (data.status === 'ok') {
          allItems = [...allItems, ...data.items.map(item => ({ ...item, source: data.feed.title }))];
        }
      });
      allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      // Cache all articles for potential re-rendering with different max_articles
      this._cachedArticles = allItems;
      this._render(allItems);
    } catch (e) {
      if(this.content) this.content.innerHTML = `<div style="padding:20px;">Error loading feeds.</div>`;
    } finally {
      if (this.content) this.content.style.opacity = "1";
    }
  }

  _stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  _render(articles) {
    if (!this.content) return;
    
    // Limit articles based on max_articles config
    const maxArticles = this._config.max_articles || 20;
    const displayArticles = articles.slice(0, maxArticles);
    
    this.content.innerHTML = displayArticles.map(item => {
      const thumbnail = item.thumbnail || item.enclosure?.link || '';
      const description = this._stripHtml(item.description || item.content || '');
      const summary = description.substring(0, 150) + (description.length > 150 ? '...' : '');
      
      return `
        <div class="article" onclick="window.open('${item.link}', '_blank')">
          ${thumbnail ? `<img class="article-thumbnail" src="${thumbnail}" alt="" loading="lazy">` : ''}
          <div class="article-content">
            <span class="title">${item.title}</span>
            ${summary ? `<span class="summary">${summary}</span>` : ''}
            <span class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.source}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
