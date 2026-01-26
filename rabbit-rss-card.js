/**
 * Rabbit RSS Card
 * GitHub: https://github.com/jamesmcginnis/rabbit-rss-card
 */

// 1. REGISTER THE CARD FOR THE PICKER
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
    if (!this._config) return;
    this.innerHTML = `
      <div class="card-config" style="padding: 10px;">
        <ha-textfield
          label="Card Title"
          .value="${this._config.title || ''}"
          .configValue="${'title'}"
          @input="${this._valueChanged}"
          style="width: 100%; display: block; margin-bottom: 15px;"
        ></ha-textfield>

        <ha-textfield
          label="RSS Feed URL"
          .value="${this._config.url || ''}"
          .configValue="${'url'}"
          @input="${this._valueChanged}"
          style="width: 100%; display: block; margin-bottom: 20px;"
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
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const value = target.tagName === 'HA-SWITCH' ? target.checked : target.value;
    
    const event = new CustomEvent("config-changed", {
      detail: { config: { ...this._config, [target.configValue]: value } },
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
    if (!config.url) throw new Error("Please enter an RSS URL");
    const oldConfig = this._config;
    this._config = config;

    if (this.content) {
      // Re-fetch if URL changes
      if (!oldConfig || oldConfig.url !== config.url) {
        this._fetchRSS();
      }
      // Update Title instantly
      if (this.headerTitle) {
        this.headerTitle.innerText = this._config.title || "Rabbit RSS";
      }
      this._updateTheme();
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
        ha-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%; transition: all 0.3s ease; }
        .header { padding: 16px; font-weight: bold; font-size: 1.1em; background: var(--primary-color); color: white; display: flex; justify-content: space-between; align-items: center; }
        .article-list { max-height: 450px; overflow-y: auto; background: var(--card-background-color); }
        .article { 
          padding: 12px 16px; 
          border-bottom: 1px solid var(--divider-color); 
          cursor: pointer; 
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
        }
        .article:hover { background: rgba(var(--rgb-primary-text-color), 0.05); }
        .title { font-weight: 500; color: var(--primary-text-color); line-height: 1.4; margin-bottom: 4px; }
        .meta { font-size: 0.8em; color: var(--secondary-text-color); }
        
        .forced-dark { 
          background-color: #1c1c1c !important; 
          --card-background-color: #1c1c1c; 
          --primary-text-color: #e1e1e1; 
          --secondary-text-color: #999; 
          --divider-color: #333; 
        }
        .forced-dark .article-list { background: #1c1c1c; }
      </style>
      <ha-card id="container">
        <div class="header">
          <span id="header-title">${this._config.title || "Rabbit RSS"}</span>
          <ha-icon icon="mdi:rss"></ha-icon>
        </div>
        <div id="content" class="article-list">Loading feed...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.container = this.querySelector("#container");
    this.headerTitle = this.querySelector("#header-title");
    this._updateTheme();
    this._fetchRSS();
  }

  async _fetchRSS() {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this._config.url)}`);
      const data = await response.json();
      if (data.status === 'ok') {
        this._render(data.items);
      } else {
        this.content.innerHTML = `<div style="padding:20px;">Unable to load feed. Check the URL.</div>`;
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

  _updateTheme() {
    if (!this.container) return;
    if (this._config.dark_mode === true) {
      this.container.classList.add('forced-dark');
    } else {
      this.container.classList.remove('forced-dark');
    }
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
