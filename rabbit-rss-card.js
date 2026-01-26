/**
 * Rabbit RSS Card
 * GitHub: https://github.com/jamesmcginnis/rabbit-rss-card
 */

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rabbit-rss-card",
  name: "Rabbit RSS Card",
  description: "A multi-feed RSS reader with a native visual editor.",
  preview: true
});

/**
 * 2. THE VISUAL EDITOR
 */
class RabbitRSSEditor extends HTMLElement {
  setConfig(config) {
    this._config = { 
      title: "Rabbit RSS", 
      feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"], 
      ...config 
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered) return; // Only render once to keep focus stable

    this.innerHTML = `
      <style>
        .card-config { padding: 10px; font-family: sans-serif; }
        .config-label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
        .input-box { 
          width: 100%; 
          padding: 10px; 
          margin-bottom: 15px; 
          border: 1px solid #ccc; 
          border-radius: 4px; 
          box-sizing: border-box;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, black);
        }
        .feed-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .btn { 
          padding: 8px 12px; 
          cursor: pointer; 
          background: var(--primary-color, #03a9f4); 
          color: white; 
          border: none; 
          border-radius: 4px; 
        }
        .btn-delete { background: #f44336; }
      </style>
      <div class="card-config">
        <label class="config-label">Card Title</label>
        <input type="text" class="input-box" id="title-input" value="${this._config.title}">

        <label class="config-label">RSS Feeds</label>
        <div id="feeds-container">
          ${this._config.feeds.map((url, idx) => `
            <div class="feed-row">
              <input type="text" class="input-box feed-input" data-index="${idx}" value="${url}" style="margin-bottom:0;">
              <button class="btn btn-delete remove-feed" data-index="${idx}">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" id="add-feed" style="margin-top:10px;">+ Add Feed URL</button>
      </div>
    `;

    // Attach Event Listeners
    this.querySelector('#title-input').addEventListener('change', (e) => {
      this._updateConfig({ title: e.target.value });
    });

    this.querySelectorAll('.feed-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const feeds = [...this._config.feeds];
        feeds[e.target.dataset.index] = e.target.value;
        this._updateConfig({ feeds });
      });
    });

    this.querySelector('#add-feed').addEventListener('click', () => {
      const feeds = [...this._config.feeds, ""];
      this._rendered = false; // Allow re-render to show new row
      this._updateConfig({ feeds });
    });

    this.querySelectorAll('.remove-feed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const feeds = [...this._config.feeds];
        feeds.splice(e.target.dataset.index, 1);
        this._rendered = false; // Allow re-render
        this._updateConfig({ feeds });
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
      feeds: ["http://feeds.bbci.co.uk/news/world/rss.xml"]
    };
  }

  setConfig(config) {
    this._config = config;
    if (this.headerTitle) {
      this.headerTitle.innerText = this._config.title || "Rabbit RSS";
    }
    this._fetchRSS();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._init();
    }
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%; }
        .header { padding: 16px; font-weight: bold; font-size: 1.1em; background: var(--primary-color); color: white; display: flex; justify-content: space-between; align-items: center; }
        .refresh-btn { cursor: pointer; }
        .article-list { max-height: 450px; overflow-y: auto; background: var(--card-background-color); }
        .article { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; flex-direction: column; }
        .article:hover { background: rgba(var(--rgb-primary-text-color), 0.05); }
        .title { font-weight: 500; color: var(--primary-text-color); line-height: 1.4; margin-bottom: 4px; }
        .meta { font-size: 0.8em; color: var(--secondary-text-color); }
      </style>
      <ha-card>
        <div class="header">
          <span id="header-title">${this._config.title || "Rabbit RSS"}</span>
          <ha-icon id="refresh-icon" class="refresh-btn" icon="mdi:refresh"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading feeds...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.headerTitle = this.querySelector("#header-title");
    this.querySelector("#refresh-icon").addEventListener("click", () => this._fetchRSS());
    this._fetchRSS();
  }

  async _fetchRSS() {
    const feeds = this._config.feeds || [];
    if (!feeds.length) return;

    try {
      const promises = feeds
        .filter(url => url && url.trim() !== "")
        .map(url => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&cache_boost=${Date.now()}`)
          .then(res => res.json())
          .catch(() => ({ status: 'error' }))
        );

      const results = await Promise.all(promises);
      let allItems = [];

      results.forEach(data => {
        if (data.status === 'ok') {
          allItems = [...allItems, ...data.items.map(item => ({ ...item, source: data.feed.title }))];
        }
      });

      allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      this._render(allItems);
    } catch (e) {
      this.content.innerHTML = `<div style="padding:20px;">Error loading feeds.</div>`;
    }
  }

  _render(articles) {
    if (!articles.length) {
      this.content.innerHTML = `<div style="padding:20px;">No articles found.</div>`;
      return;
    }
    this.content.innerHTML = articles.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        <span class="title">${item.title}</span>
        <span class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.source}</span>
      </div>
    `).join('');
  }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
