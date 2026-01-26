// --- THE EDITOR COMPONENT ---
class RabbitRSSEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._config) return;
    
    this.innerHTML = `
      <div class="card-config">
        <div style="margin-bottom: 20px;">
          <p>Manage your RSS Feeds (URLs):</p>
          <div id="feeds-container">
            ${(this._config.feeds || []).map((feed, idx) => `
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <ha-textfield 
                  label="Feed URL" 
                  value="${feed}" 
                  style="flex: 1;" 
                  data-idx="${idx}"
                ></ha-textfield>
                <ha-icon-button
                  .index=${idx}
                  class="remove-feed"
                  style="--mdc-icon-size: 24px;"
                ><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button>
              </div>
            `).join('')}
          </div>
          <ha-button id="add-feed" raised>+ Add Feed</ha-button>
        </div>

        <hr>

        <div style="margin-top: 20px;">
          <ha-formfield label="Force Dark Mode">
            <ha-switch id="dark-mode" .checked=${this._config.dark_mode}></ha-switch>
          </ha-formfield>
        </div>
      </div>
    `;

    this.querySelectorAll('ha-textfield').forEach(el => {
      el.addEventListener('change', (ev) => this._updateFeed(ev));
    });

    this.querySelectorAll('.remove-feed').forEach(el => {
      el.addEventListener('click', (ev) => this._removeFeed(ev));
    });

    this.querySelector('#add-feed').addEventListener('click', () => this._addFeed());
    
    this.querySelector('#dark-mode').addEventListener('change', (ev) => {
      this._updateConfig({ dark_mode: ev.target.checked });
    });
  }

  _updateFeed(ev) {
    const idx = ev.target.dataset.idx;
    const newFeeds = [...this._config.feeds];
    newFeeds[idx] = ev.target.value;
    this._updateConfig({ feeds: newFeeds });
  }

  _addFeed() {
    const newFeeds = [...(this._config.feeds || []), ""];
    this._updateConfig({ feeds: newFeeds });
  }

  _removeFeed(ev) {
    const idx = ev.currentTarget.index;
    const newFeeds = [...this._config.feeds];
    newFeeds.splice(idx, 1);
    this._updateConfig({ feeds: newFeeds });
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


// --- THE MAIN CARD COMPONENT ---
class RabbitRSSCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("rabbit-rss-editor");
  }

  static getStubConfig() {
    return { feeds: ["https://news.ycombinator.com/rss"], dark_mode: false };
  }

  setConfig(config) {
    this._config = config;
    if (this.content) this.fetchFeeds();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) this.init();
  }

  init() {
    this.innerHTML = `
      <style>
        :host {
          --rss-bg: var(--ha-card-background, var(--card-background-color, white));
          --rss-text: var(--primary-text-color);
          --rss-subtext: var(--secondary-text-color);
        }
        .dark-theme {
          --rss-bg: #1c1c1c;
          --rss-text: #ffffff;
          --rss-subtext: #aaaaaa;
        }
        ha-card {
          background: var(--rss-bg);
          color: var(--rss-text);
          padding: 16px;
          height: 100%;
        }
        .header { font-size: 1.2em; font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; }
        .article { padding: 10px 0; border-bottom: 1px solid var(--divider-color); cursor: pointer; }
        .article:last-child { border: none; }
        .title { font-weight: 500; line-height: 1.2; }
        .meta { font-size: 0.8em; color: var(--rss-subtext); margin-top: 4px; }
        .modal {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: var(--rss-bg); z-index: 1000; padding: 20px;
          display: none; flex-direction: column;
        }
        .modal.open { display: flex; }
      </style>
      <ha-card id="card-container">
        <div class="header">
           <span>Rabbit RSS</span>
           <ha-icon icon="mdi:rss" style="color: var(--primary-color);"></ha-icon>
        </div>
        <div id="articles">Loading...</div>
      </ha-card>
      <div id="modal" class="modal">
         <ha-button id="close-btn">← Back</ha-button>
         <div id="modal-content" style="margin-top:20px; overflow-y: auto;"></div>
      </div>
    `;
    this.content = this.querySelector('#articles');
    this.container = this.querySelector('#card-container');
    this.modal = this.querySelector('#modal');
    
    this.querySelector('#close-btn').addEventListener('click', () => {
      this.modal.classList.remove('open');
    });

    this.fetchFeeds();
  }

  async fetchFeeds() {
    if (!this._config.feeds) return;
    
    if (this._config.dark_mode) {
      this.container.classList.add('dark-theme');
      this.modal.classList.add('dark-theme');
    } else {
      this.container.classList.remove('dark-theme');
      this.modal.classList.remove('dark-theme');
    }

    let allArticles = [];
    for (const url of this._config.feeds) {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.items) allArticles.push(...data.items);
      } catch (e) { console.error(e); }
    }

    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    this.renderArticles(allArticles);
  }

  renderArticles(articles) {
    this.content.innerHTML = articles.map((art, idx) => `
      <div class="article" data-idx="${idx}">
        <div class="title">${art.title}</div>
        <div class="meta">${new Date(art.pubDate).toLocaleDateString()}</div>
      </div>
    `).join('');

    this.querySelectorAll('.article').forEach(el => {
      el.addEventListener('click', () => {
        const art = articles[el.dataset.idx];
        this.openModal(art);
      });
    });
  }

  openModal(art) {
    const content = this.querySelector('#modal-content');
    content.innerHTML = `
      <h2>${art.title}</h2>
      <p style="color: var(--rss-subtext)">${art.author || 'RSS Feed'}</p>
      <hr>
      <div style="margin: 20px 0;">${art.description}</div>
      <ha-button raised onclick="window.open('${art.link}', '_blank')">Open Original Article</ha-button>
    `;
    this.modal.classList.add('open');
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
