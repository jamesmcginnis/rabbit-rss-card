/**
 * Rabbit RSS Card
 * GitHub: https://github.com/jamesmcginnis/rabbit-rss-card
 */

// 1. REGISTER THE CARD
window.customCards = window.customCards || [];
window.customCards.push({
  type: "rabbit-rss-card",
  name: "Rabbit RSS Card",
  description: "A sleek RSS reader with a native visual editor.",
  preview: true
});

/**
 * 2. THE VISUAL EDITOR
 */
class RabbitRSSEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    // Safety check: if config isn't loaded yet, don't render the editor UI
    if (!this._config) return;
    if (this._rendered) return;

    this.innerHTML = `
      <div class="card-config" style="padding: 10px; display: flex; flex-direction: column; gap: 15px;">
        <ha-textfield
          label="Card Title"
          .value="${this._config.title || ''}"
          .configValue="${'title'}"
          @input="${this._valueChanged}"
          style="width: 100%;"
        ></ha-textfield>

        <ha-textfield
          label="RSS Feed URL"
          .value="${this._config.url || ''}"
          .configValue="${'url'}"
          @input="${this._valueChanged}"
          style="width: 100%;"
        ></ha-textfield>
        
        <ha-formfield label="Force Dark Mode">
          <ha-switch
            .checked=${this._config.dark_mode === true}
            .configValue="${'dark_mode'}"
            @change="${this._valueChanged}"
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
    this._rendered = true;
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const value = target.tagName === 'HA-SWITCH' ? target.checked : target.value;
    
    const newConfig = { ...this._config };
    newConfig[target.configValue] = value;

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
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
      url: "https://news.ycombinator.com/rss", 
      dark_mode: false 
    };
  }

  setConfig(config) {
    const oldUrl = this._config?.url;
    this._config = config || {}; // Safety: fallback to empty object

    if (this.container) {
      this._updateDisplay();
      if (oldUrl !== this._config.url) {
        this._fetchRSS();
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._init();
    }
  }

  _init() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%; }
        .header { padding: 16px; font-weight: bold; font-size: 1.1em; background: var(--primary-color); color: white; display: flex; justify-content: space-between; align-items: center; }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .refresh-btn { cursor: pointer; transition: transform 0.2s; }
        .refresh-btn:active { transform: rotate(180deg); }
        .article-list { max-height: 450px; overflow-y: auto; background: var(--card-background-color); }
        .article { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; flex-direction: column; }
        .article:hover { background: rgba(var(--rgb-primary-text-color), 0.05); }
        .title { font-weight: 500; color: var(--primary-text-color); line-height: 1.4; margin-bottom: 4px; }
        .meta { font-size: 0.8em; color: var(--secondary-text-color); }
        
        /* DARK MODE STYLES */
        #container.dark-theme {
          background-color: #1c1c1c !important;
          color: white !important;
          --card-background-color: #1c1c1c;
          --primary-text-color: #ffffff;
          --secondary-text-color: #aaaaaa;
          --divider-color: #333333;
        }
        #container.dark-theme .article-list { background-color: #1c1c1c !important; }
      </style>
      <ha-card id="container">
        <div class="header">
          <span id="header-title">${this._config.title || "Rabbit RSS"}</span>
          <div class="header-actions">
            <ha-icon id="refresh-icon" class="refresh-btn" icon="mdi:refresh"></ha-icon>
            <ha-icon icon="mdi:rss"></ha-icon>
          </div>
        </div>
        <div id="content" class="article-list">Loading feed...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.container = this.querySelector("#container");
    this.headerTitle = this.querySelector("#header-title");
    
    this.querySelector("#refresh-icon").addEventListener("click", () => this._fetchRSS());

    this._updateDisplay();
    this._fetchRSS();
  }

  _updateDisplay() {
    if (!this.container || !this._config) return;
    
    this.headerTitle.innerText = this._config.title || "Rabbit RSS";

    if (this._config.dark_mode === true) {
      this.container.classList.add('dark-theme');
    } else {
      this.container.classList.remove('dark-theme');
    }
  }

  async _fetchRSS() {
    if (!this._config || !this._config.url) return;
    this.content.innerHTML = `<div style="padding:20px;">Updating...</div>`;
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this._config.url)}&cache_boost=${Date.now()}`);
      const data = await response.json();
      if (data.status === 'ok') {
        this._render(data.items);
      } else {
        this.content.innerHTML = `<div style="padding:20px;">Unable to load feed. Check URL.</div>`;
      }
    } catch (e) {
      this.content.innerHTML = `<div style="padding:20px;">Error: ${e.message}</div>`;
    }
  }

  _render(articles) {
    this.content.innerHTML = articles.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        <span class="title">${item.title}</span>
        <span class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.author || 'News'}</span>
      </div>
    `).join('');
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
