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
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  _render() {
    if (!this._config || this._rendered) return;
    this.innerHTML = `
      <style>
        .card-config { padding: 10px; display: flex; flex-direction: column; gap: 12px; font-family: sans-serif; }
        .config-label { font-weight: bold; font-size: 14px; margin-bottom: 4px; display: block; }
        .input-box, .number-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .color-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .color-picker { width: 30px; height: 30px; border: none; cursor: pointer; padding: 0; }
        .feed-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .btn { padding: 8px; cursor: pointer; background: #03a9f4; color: white; border: none; border-radius: 4px; }
      </style>
      <div class="card-config">
        <label class="config-label">Card Title</label>
        <input type="text" class="input-box" id="title-input" value="${this._config.title || ''}">
        
        <label class="config-label">Maximum Articles</label>
        <input type="number" class="number-input" id="max-articles-input" value="${this._config.max_articles || 20}">

        <div class="color-grid">
          <div class="color-row"><input type="color" class="color-picker" id="header-bg" value="${this._config.header_color || '#03a9f4'}"> Header</div>
          <div class="color-row"><input type="color" class="color-picker" id="card-bg" value="${this._config.bg_color || '#ffffff'}"> Card</div>
        </div>

        <label class="config-label">Feeds</label>
        <div id="feeds-container">
          ${(this._config.feeds || []).map((url, idx) => `
            <div class="feed-row">
              <input type="text" class="input-box feed-input" data-index="${idx}" value="${url}">
              <button class="btn remove-feed" data-index="${idx}">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" id="add-feed">+ Add Feed</button>
      </div>
    `;

    this.querySelector('#title-input').addEventListener('change', (e) => this._updateConfig({ title: e.target.value }));
    this.querySelector('#max-articles-input').addEventListener('change', (e) => this._updateConfig({ max_articles: parseInt(e.target.value) }));
    this.querySelector('#header-bg').addEventListener('change', (e) => this._updateConfig({ header_color: e.target.value }));
    this.querySelector('#card-bg').addEventListener('change', (e) => this._updateConfig({ bg_color: e.target.value }));
    
    this.querySelectorAll('.feed-input').forEach(i => i.addEventListener('change', (e) => {
      const f = [...this._config.feeds]; f[e.target.dataset.index] = e.target.value;
      this._updateConfig({ feeds: f });
    }));

    this.querySelector('#add-feed').addEventListener('click', () => {
      this._rendered = false;
      this._updateConfig({ feeds: [...(this._config.feeds || []), ""] });
    });

    this._rendered = true;
  }
  _updateConfig(newVal) {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...this._config, ...newVal } }, bubbles: true, composed: true }));
  }
}
customElements.define("rabbit-rss-editor", RabbitRSSEditor);

class RabbitRSSCard extends HTMLElement {
  static getConfigElement() { return document.createElement("rabbit-rss-editor"); }
  
  setConfig(config) {
    this._config = config;
    if (this.container) this._applyStyles();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.container) this._init();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { display: flex; flex-direction: column; overflow: hidden; }
        .header { padding: 16px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .article-list { max-height: 500px; overflow-y: auto; }
        .article { padding: 12px; border-bottom: 1px solid #eee; display: flex; gap: 12px; cursor: pointer; }
        .article-thumb { width: 100px; height: 70px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: #eee; }
        .article-title { font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
      </style>
      <ha-card id="card-container">
        <div class="header" id="card-header">
          <span id="title-text"></span>
          <ha-icon id="refresh-btn" icon="mdi:refresh" style="cursor:pointer"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading...</div>
      </ha-card>
    `;
    this.container = this.querySelector("#card-container");
    this.content = this.querySelector("#content");
    this.refreshBtn = this.querySelector("#refresh-btn");
    
    this.refreshBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._fetchRSS();
    });

    this._applyStyles();
    this._fetchRSS();
  }

  _applyStyles() {
    this.querySelector("#title-text").innerText = this._config.title || "Rabbit RSS";
    const head = this.querySelector("#card-header");
    head.style.background = this._config.header_color || "#03a9f4";
    head.style.color = "#fff";
    this.container.style.background = this._config.bg_color || "#ffffff";
  }

  async _fetchRSS() {
    if (!this._config.feeds || this._config.feeds.length === 0) return;
    this.refreshBtn.classList.add('spinning');

    try {
      const promises = this._config.feeds.map(url => 
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&t=${Date.now()}`)
        .then(res => res.json())
      );

      const results = await Promise.all(promises);
      let all = [];
      results.forEach(res => {
        if (res.status === 'ok') {
          all = [...all, ...res.items.map(i => ({ ...i, source: res.feed.title }))];
        }
      });

      all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      this._render(all);
    } catch (e) {
      this.content.innerHTML = "Failed to load.";
    } finally {
      this.refreshBtn.classList.remove('spinning');
    }
  }

  _render(articles) {
    const max = parseInt(this._config.max_articles) || 20;
    const items = articles.slice(0, max);

    this.content.innerHTML = items.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        ${item.thumbnail || item.enclosure?.link ? `<img class="article-thumb" src="${item.thumbnail || item.enclosure.link}">` : ''}
        <div class="article-title">${item.title}</div>
      </div>
    `).join('');
  }
}
customElements.define("rabbit-rss-card", RabbitRSSCard);
