/**
 * Rabbit RSS Card - Home Assistant Custom Card
 */

// 1. Tell Home Assistant about the card so it shows in the picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: "rabbit-rss-card",
  name: "Rabbit RSS Reader",
  description: "A sleek RSS reader with a visual configuration editor.",
  preview: true
});

/**
 * --- THE VISUAL EDITOR ---
 * This part creates the UI you see when clicking "Configure"
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
          label="RSS Feed URL"
          .value="${this._config.url || ''}"
          .configValue="${'url'}"
          @input="${this._valueChanged}"
          style="width: 100%; display: block; margin-bottom: 20px;"
        ></ha-textfield>
        
        <ha-formfield label="Dark Mode">
          <ha-switch
            .checked=${this._config.dark_mode === true}
            .configValue="${'dark_mode'}"
            @change="${this._valueChanged}"
          ></ha-switch>
        </ha-formfield>
        <p style="font-size: 0.8em; color: var(--secondary-text-color);">
          Note: Some RSS feeds may require a proxy if they block direct browser access.
        </p>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const value = target.tagName === 'HA-SWITCH' ? target.checked : target.value;
    
    // Fire the config-changed event to let Home Assistant save the settings
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
 * --- THE MAIN CARD ---
 */
class RabbitRSSCard extends HTMLElement {
  // Link the card to its editor
  static getConfigElement() {
    return document.createElement("rabbit-rss-editor");
  }

  static getStubConfig() {
    return { 
        url: "https://news.ycombinator.com/rss", 
        dark_mode: false 
    };
  }

  setConfig(config) {
    if (!config.url) throw new Error("Please enter an RSS URL");
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._init();
    }
    this._updateTheme();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding: 0; overflow: hidden; height: 100%; }
        .card-header { padding: 16px; font-weight: bold; font-size: 1.2em; background: var(--primary-color); color: white; }
        .article-list { max-height: 400px; overflow-y: auto; }
        .article { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); cursor: pointer; transition: background 0.2s; }
        .article:hover { background: rgba(var(--rgb-primary-text-color), 0.05); }
        .title { font-weight: 500; line-height: 1.3; margin-bottom: 4px; display: block; }
        .meta { font-size: 0.75em; color: var(--secondary-text-color); }
        .dark-mode-active { background: #1c1c1c !important; color: #eee !important; }
        .dark-mode-active .article { border-color: #333; }
        .dark-mode-active .meta { color: #999; }
      </style>
      <ha-card id="container">
        <div class="card-header">Rabbit RSS</div>
        <div id="content" class="article-list">Loading feed...</div>
      </ha-card>
    `;
    this.content = this.querySelector("#content");
    this.container = this.querySelector("#container");
    this._fetchRSS();
  }

  async _fetchRSS() {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this._config.url)}`);
      const data = await response.json();
      if (data.status === 'ok') {
        this._renderArticles(data.items);
      } else {
        this.content.innerHTML = `<div style="padding:16px;">Feed could not be loaded.</div>`;
      }
    } catch (e) {
      this.content.innerHTML = `<div style="padding:16px;">Error: ${e.message}</div>`;
    }
  }

  _renderArticles(articles) {
    this.content.innerHTML = articles.map(item => `
      <div class="article" onclick="window.open('${item.link}', '_blank')">
        <span class="title">${item.title}</span>
        <div class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.author || 'RSS'}</div>
      </div>
    `).join('');
  }

  _updateTheme() {
    if (this._config.dark_mode) {
      this.container.classList.add('dark-mode-active');
    } else {
      this.container.classList.remove('dark-mode-active');
    }
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
