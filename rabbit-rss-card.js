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
 * 2. THE VISUAL EDITOR (With Shadow DOM for click stability)
 */
class RabbitRSSEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

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
    if (!this._config) return;

    // Use ShadowRoot to ensure inputs are clickable and isolated
    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family, inherit);
        }
        .feed-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        ha-textfield {
          flex-grow: 1;
          display: block;
        }
        .header-label {
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 4px;
        }
        ha-button {
          align-self: flex-start;
          cursor: pointer;
        }
        ha-icon-button {
          --mdc-icon-size: 20px;
          color: var(--error-color);
          cursor: pointer;
        }
      </style>
      <div class="card-config">
        <div>
          <div class="header-label">Card Title</div>
          <ha-textfield
            .value="${this._config.title}"
            .configValue="${'title'}"
            @change="${this._valueChanged}"
          ></ha-textfield>
        </div>

        <div>
          <div class="header-label">RSS Feeds</div>
          <div id="feeds-list">
            ${(this._config.feeds || []).map((url, idx) => `
              <div class="feed-row">
                <ha-textfield
                  placeholder="https://example.com/rss"
                  .value="${url}"
                  .index="${idx}"
                  @change="${this._feedChanged}"
                ></ha-textfield>
                <ha-icon-button
                  .index="${idx}"
                  @click="${this._removeFeed}"
                >
                  <ha-icon icon="mdi:delete"></ha-icon>
                </ha-icon-button>
              </div>
            `).join('')}
          </div>
          <ha-button @click="${this._addFeed}" raised>
            + Add Feed URL
          </ha-button>
        </div>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config) return;
    this._updateConfig({ [ev.target.configValue]: ev.target.value });
  }

  _feedChanged(ev) {
    const feeds = [...this._config.feeds];
    feeds[ev.target.index] = ev.target.value;
    this._updateConfig({ feeds });
  }

  _addFeed() {
    const feeds = [...(this._config.feeds || []), ""];
    this._updateConfig({ feeds });
  }

  _removeFeed(ev) {
    const index = ev.currentTarget.index;
    const feeds = [...this._config.feeds];
    feeds.splice(index, 1);
    this._updateConfig({ feeds });
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
    if (!config) return;
    const oldFeeds = JSON.stringify(this._config?.feeds);
    const newFeeds = JSON.stringify(config.feeds);

    this._config = config;

    if (this.headerTitle) {
      this.headerTitle.innerText = this._config.title || "Rabbit RSS";
    }

    if (oldFeeds !== newFeeds) {
      this._fetchRSS();
    }
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
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .refresh-btn { cursor: pointer; }
        .article-list { max-height: 450px; overflow-y: auto; background: var(--card-background-color); }
        .article { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; flex-direction: column; }
        .article:hover { background: rgba(var(--rgb-primary-text-color), 0.05); }
        .title { font-weight: 500; color: var(--primary-text-color); line-height: 1.4; margin-bottom: 4px; }
        .meta { font-size: 0.8em; color: var(--secondary-text-color); }
      </style>
      <ha-card id="container">
        <div class="header">
          <span id="header-title">${this._config.title || "Rabbit RSS"}</span>
          <div class="header-actions">
            <ha-icon id="refresh-icon" class="refresh-btn" icon="mdi:refresh"></ha-icon>
            <ha-icon icon="mdi:rss"></ha-icon>
          </div>
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
    if (feeds.length === 0 || (feeds.length === 1 && feeds[0] === "")) {
      this.content.innerHTML = `<div style="padding:20px;">No feeds configured.</div>`;
      return;
    }

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
          const feedTitle = data.feed.title || "RSS Feed";
          allItems = [...allItems, ...data.items.map(item => ({ ...item, source: feedTitle }))];
        }
      });

      allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      if (allItems.length > 0) {
        this._render(allItems);
      } else {
        this.content.innerHTML = `<div style="padding:20px;">No articles found.</div>`;
      }
    } catch (e) {
      this.content.innerHTML = `<div style="padding:20px;">Error loading feeds.</div>`;
    }
  }

  _render(articles) {
    this.content.innerHTML = articles.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        <span class="title">${item.title}</span>
        <span class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.source}</span>
      </div>
    `).join('');
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
