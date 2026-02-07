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

class RabbitRSSEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
  }
  setConfig(config) {
    this._config = config;
    this._render();
  }
  _render() {
    if (!this._config || this._rendered) return;
    this.innerHTML = `
      <style>
        .card-config { padding: 10px; display: flex; flex-direction: column; gap: 12px; }
        .input-box, .number-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
      </style>
      <div class="card-config">
        <label>Card Title</label>
        <input type="text" class="input-box" id="title-input" value="${this._config.title || ''}">
        <label>Maximum Articles</label>
        <input type="number" class="number-input" id="max-articles-input" value="${this._config.max_articles || 20}">
        <div id="feeds-container">
          ${(this._config.feeds || []).map((url, idx) => `
            <div style="display:flex; gap:5px; margin-bottom:5px;">
              <input type="text" class="input-box feed-input" data-index="${idx}" value="${url}">
            </div>
          `).join('')}
        </div>
      </div>
    `;
    this.querySelector('#title-input').addEventListener('change', (e) => this._updateConfig({ title: e.target.value }));
    this.querySelector('#max-articles-input').addEventListener('change', (e) => this._updateConfig({ max_articles: parseInt(e.target.value) }));
    this._rendered = true;
  }
  _updateConfig(newValues) {
    const event = new CustomEvent("config-changed", {
      detail: { config: { ...this._config, ...newValues } },
      bubbles: true, composed: true,
    });
    this.dispatchEvent(event);
  }
}
customElements.define("rabbit-rss-editor", RabbitRSSEditor);

class RabbitRSSCard extends HTMLElement {
  static getConfigElement() { return document.createElement("rabbit-rss-editor"); }
  static getStubConfig() { return { title: "Rabbit RSS", feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"], max_articles: 20 }; }

  setConfig(config) {
    this._config = config;
    if (this.container) {
      this._applyStyles();
      // If we already have articles, just re-render with the new count
      if (this._cachedArticles) {
        this._render(this._cachedArticles);
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.container) this._init();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
        .header { padding: 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; background: var(--header-bg, #03a9f4); color: var(--header-color, #fff); }
        .article-list { max-height: 450px; overflow-y: auto; background: var(--card-bg, #fff); }
        .article { padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; gap: 10px; }
        .title { font-weight: 500; color: #333; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
      </style>
      <ha-card id="card-container">
        <div class="header">
          <span id="header-title"></span>
          <ha-icon id="refresh-icon" icon="mdi:refresh" style="cursor:pointer"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading...</div>
      </ha-card>
    `;
    this.container = this.querySelector("#card-container");
    this.content = this.querySelector("#content");
    this.headerTitle = this.querySelector("#header-title");
    this.refreshIcon = this.querySelector("#refresh-icon");

    // Re-bind the click event specifically to the icon
    this.refreshIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this._fetchRSS();
    });

    this._applyStyles();
    this._fetchRSS();
  }

  _applyStyles() {
    this.headerTitle.innerText = this._config.title || "Rabbit RSS";
    this.container.style.setProperty('--header-bg', this._config.header_color || "#03a9f4");
    this.container.style.setProperty('--header-color', this._config.header_text_color || "#ffffff");
    this.container.style.setProperty('--card-bg', this._config.bg_color || "#ffffff");
  }

  async _fetchRSS() {
    if (!this._config.feeds) return;
    
    // Visual feedback
    this.refreshIcon.classList.add('spinning');
    this.content.style.opacity = "0.5";

    try {
      const promises = this._config.feeds.map(url => 
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&t=${Date.now()}`)
        .then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      let allItems = [];
      results.forEach(data => {
        if (data.status === 'ok') {
          allItems = [...allItems, ...data.items.map(item => ({ ...item, source: data.feed.title }))];
        }
      });

      allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      this._cachedArticles = allItems;
      this._render(allItems);
    } catch (e) {
      this.content.innerHTML = "Error loading feeds.";
    } finally {
      this.refreshIcon.classList.remove('spinning');
      this.content.style.opacity = "1";
    }
  }

  _render(articles) {
    if (!this.content) return;
    const max = parseInt(this._config.max_articles) || 20;
    const displayItems = articles.slice(0, max);
    
    this.content.innerHTML = displayItems.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        <div class="article-content">
          <div class="title">${item.title}</div>
          <div style="font-size:0.8em; color:gray;">${item.source} • ${new Date(item.pubDate).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  }
}
customElements.define("rabbit-rss-card", RabbitRSSCard);
