/**
 * Rabbit RSS Card (Fixed)
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
    this._config = {};
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    if (!this._config) return;

    // Use a flag to avoid re-rendering the whole HTML structure if it exists
    if (this._rendered) {
      this.querySelector('#max-articles-input').value = this._config.max_articles || 20;
      return;
    }

    this.innerHTML = `
      <style>
        .card-config { padding: 10px; font-family: sans-serif; display: flex; flex-direction: column; gap: 12px; }
        .config-label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
        .input-box { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: white; color: black; }
        .number-input { width: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: white; color: black; }
        .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .color-row { display: flex; align-items: center; gap: 10px; }
        .color-picker { width: 40px; height: 30px; padding: 0; border: none; cursor: pointer; }
        .feed-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .btn { padding: 8px 12px; cursor: pointer; background: #03a9f4; color: white; border: none; border-radius: 4px; }
        .btn-delete { background: #f44336; }
        .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 10px; }
        .interval-row { display: flex; align-items: center; gap: 10px; }
      </style>
      <div class="card-config">
        <div>
          <label class="config-label">Card Title</label>
          <input type="text" class="input-box" id="title-input" value="${this._config.title || ''}">
        </div>

        <div>
          <label class="config-label">Maximum Articles</label>
          <div class="interval-row">
            <input type="number" class="number-input" id="max-articles-input" value="${this._config.max_articles || 20}" min="1" max="100">
            <span>articles</span>
          </div>
        </div>

        <div class="section-title">Colors</div>
        <div class="color-grid">
           <div class="color-row"><input type="color" class="color-picker" id="header-color-picker" value="${this._config.header_color || '#03a9f4'}"><label>Header Bg</label></div>
           <div class="color-row"><input type="color" class="color-picker" id="bg-color-picker" value="${this._config.bg_color || '#ffffff'}"><label>Card Bg</label></div>
        </div>

        <div class="section-title">RSS Feeds</div>
        <div id="feeds-container">
          ${(this._config.feeds || []).map((url, idx) => `
            <div class="feed-row">
              <input type="text" class="input-box feed-input" data-index="${idx}" value="${url}">
              <button class="btn btn-delete remove-feed" data-index="${idx}">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" id="add-feed">+ Add Feed URL</button>
      </div>
    `;

    this.querySelector('#title-input').addEventListener('change', (e) => this._updateConfig({ title: e.target.value }));
    this.querySelector('#max-articles-input').addEventListener('change', (e) => {
      this._updateConfig({ max_articles: parseInt(e.target.value) });
    });
    
    this.querySelector('#header-color-picker').addEventListener('change', (e) => this._updateConfig({ header_color: e.target.value }));
    this.querySelector('#bg-color-picker').addEventListener('change', (e) => this._updateConfig({ bg_color: e.target.value }));

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
  static getConfigElement() { return document.createElement("rabbit-rss-editor"); }

  static getStubConfig() {
    return { title: "Rabbit RSS", feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"], max_articles: 20 };
  }

  setConfig(config) {
    const oldMax = this._config?.max_articles;
    const oldFeeds = JSON.stringify(this._config?.feeds);
    
    this._config = config || {};

    if (this.content) {
      this._applyStyles();
      // If feeds changed, fetch new data. If only max_articles changed, re-render existing data.
      if (oldFeeds !== JSON.stringify(config.feeds)) {
        this._fetchRSS();
      } else if (oldMax !== config.max_articles && this._cachedArticles) {
        this._render(this._cachedArticles);
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) this._init();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
        .header { padding: 16px; font-weight: bold; font-size: 1.1em; display: flex; justify-content: space-between; }
        .article-list { max-height: 450px; overflow-y: auto; }
        .article { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; gap: 12px; text-decoration: none; }
        .article-thumbnail { width: 100px; height: 60px; flex-shrink: 0; object-fit: cover; border-radius: 4px; background: #eee; }
        .article-content { flex: 1; min-width: 0; }
        .title { font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--article-title-color); }
      </style>
      <ha-card id="card-container">
        <div class="header" id="card-header">
          <span id="header-title"></span>
          <ha-icon id="refresh-icon" icon="mdi:refresh" style="cursor:pointer"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.container = this.querySelector("#card-container");
    this.headerTitle = this.querySelector("#header-title");
    this.querySelector("#refresh-icon").onclick = () => this._fetchRSS();
    
    this._applyStyles();
    this._fetchRSS();
  }

  _applyStyles() {
    this.headerTitle.innerText = this._config.title || "Rabbit RSS";
    const header = this.querySelector("#card-header");
    header.style.backgroundColor = this._config.header_color || "#03a9f4";
    header.style.color = this._config.header_text_color || "#ffffff";
    this.container.style.backgroundColor = this._config.bg_color || "#ffffff";
  }

  async _fetchRSS() {
    const feeds = this._config.feeds || [];
    try {
      const promises = feeds.map(url => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`).then(res => res.json()));
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
    }
  }

  _render(articles) {
    const max = this._config.max_articles || 20;
    const displayItems = articles.slice(0, max);
    
    this.content.innerHTML = displayItems.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        ${item.thumbnail ? `<img class="article-thumbnail" src="${item.thumbnail}">` : ''}
        <div class="article-content">
          <div class="title">${item.title}</div>
          <div style="font-size:0.8em; color:gray;">${item.source}</div>
        </div>
      </div>
    `).join('');
  }
}
customElements.define("rabbit-rss-card", RabbitRSSCard);
