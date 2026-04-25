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
      auto_scroll: false,
      scroll_speed: "medium",
      list_scroll: "scroll",
      article_view: "browser",
      header_color: "#03a9f4",
      header_text_color: "#ffffff",
      bg_color: "#ffffff",
      title_text_color: "#000000",
      meta_text_color: "#666666",
      summary_text_color: "#555555"
    };
    this._initialized = false;
  }

  setConfig(config) {
    this._config = { ...this._config, ...config };
    if (!this._initialized && this._hass) this._render();
    else if (this._initialized) this._syncUI();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) this._render();
  }

  _syncUI() {
    const titleInput = this.querySelector('#title-input');
    if (titleInput && document.activeElement !== titleInput) titleInput.value = this._config.title || '';

    const refreshInput = this.querySelector('#refresh-interval-input');
    if (refreshInput && document.activeElement !== refreshInput) refreshInput.value = this._config.refresh_interval || 30;

    const maxInput = this.querySelector('#max-articles-input');
    if (maxInput && document.activeElement !== maxInput) maxInput.value = this._config.max_articles || 20;

    ['browser','panel'].forEach(v => {
      const el = this.querySelector(`#av_${v}`);
      if (el) el.checked = (this._config.article_view || 'browser') === v;
    });

    const autoScrollToggle = this.querySelector('#auto-scroll-toggle');
    if (autoScrollToggle) autoScrollToggle.checked = !!this._config.auto_scroll;

    const scrollSpeedRow = this.querySelector('#scroll-speed-row');
    if (scrollSpeedRow) scrollSpeedRow.style.display = this._config.auto_scroll ? '' : 'none';

    const scrollSpeedSelect = this.querySelector('#scroll-speed-select');
    if (scrollSpeedSelect) scrollSpeedSelect.value = this._config.scroll_speed || 'medium';

    ['scroll','drag'].forEach(v => {
      const el = this.querySelector(`#ls_${v}`);
      if (el) el.checked = (this._config.list_scroll || 'scroll') === v;
    });

    this.querySelectorAll('.colour-card').forEach(card => {
      const key = card.dataset.key;
      const val = this._config[key] || card.querySelector('.colour-hex').placeholder;
      card.querySelector('.colour-swatch-preview').style.background = val;
      card.querySelector('.colour-dot').style.background = val;
      const picker = card.querySelector('input[type=color]');
      if (/^#[0-9a-fA-F]{6}$/.test(val)) picker.value = val;
      const hexInput = card.querySelector('.colour-hex');
      if (document.activeElement !== hexInput) hexInput.value = this._config[key] || '';
    });
  }

  _render() {
    if (!this._config) return;
    this._initialized = true;

    const autoScrollChecked = this._config.auto_scroll ? "checked" : "";
    const scrollSpeedValue  = this._config.scroll_speed || "medium";
    const articleView       = this._config.article_view || "browser";

    this.innerHTML = `
      <style>
        .rss-editor { display:flex; flex-direction:column; gap:20px; padding:12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:var(--primary-text-color); }
        .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#888; margin-bottom:2px; }
        .card-block { background:var(--card-background-color); border:1px solid rgba(255,255,255,0.08); border-radius:12px; overflow:hidden; }

        .toggle-list { display:flex; flex-direction:column; }
        .toggle-item { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-bottom:1px solid rgba(255,255,255,0.06); min-height:52px; }
        .toggle-item:last-child { border-bottom:none; }
        .toggle-label { font-size:14px; font-weight:500; flex:1; padding-right:12px; }
        .toggle-sublabel { font-size:11px; color:#888; margin-top:2px; line-height:1.4; }

        .toggle-switch { position:relative; width:51px; height:31px; flex-shrink:0; }
        .toggle-switch input { opacity:0; width:0; height:0; position:absolute; }
        .toggle-track { position:absolute; inset:0; border-radius:31px; background:rgba(120,120,128,0.32); cursor:pointer; transition:background 0.25s ease; }
        .toggle-track::after { content:''; position:absolute; width:27px; height:27px; border-radius:50%; background:#fff; top:2px; left:2px; box-shadow:0 2px 6px rgba(0,0,0,0.3); transition:transform 0.25s ease; }
        .toggle-switch input:checked + .toggle-track { background:#34C759; }
        .toggle-switch input:checked + .toggle-track::after { transform:translateX(20px); }

        .segmented { display:flex; background:rgba(118,118,128,0.2); border-radius:9px; padding:2px; gap:2px; }
        .segmented input[type="radio"] { display:none; }
        .segmented label { flex:1; text-align:center; padding:8px 4px; font-size:13px; font-weight:500; border-radius:7px; cursor:pointer; color:var(--primary-text-color); transition:all 0.2s ease; white-space:nowrap; }
        .segmented input[type="radio"]:checked + label { background:#03a9f4; color:#ffffff; box-shadow:0 1px 4px rgba(0,0,0,0.3); }

        .text-input { width:100%; box-sizing:border-box; background:var(--card-background-color); color:var(--primary-text-color); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:10px 12px; font-size:14px; }
        .number-input { width:70px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:6px 8px; color:var(--primary-text-color); font-size:14px; font-family:inherit; text-align:center; outline:none; }
        .select-input { background:var(--card-background-color); color:var(--primary-text-color); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; font-size:14px; cursor:pointer; -webkit-appearance:none; appearance:none; }

        .feed-row { display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .feed-row:last-child { border-bottom:none; }
        .feed-input { flex:1; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 10px; color:var(--primary-text-color); font-size:13px; font-family:inherit; outline:none; min-width:0; }
        .btn-delete { background:rgba(255,69,58,0.15); border:1px solid rgba(255,69,58,0.3); color:#ff453a; border-radius:8px; padding:7px 10px; cursor:pointer; font-size:14px; flex-shrink:0; }
        .btn-add { display:flex; align-items:center; justify-content:center; gap:6px; width:calc(100% - 24px); margin:10px 12px; padding:10px; background:rgba(3,169,244,0.12); border:1px solid rgba(3,169,244,0.3); color:#03a9f4; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; }

        .colour-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:10px; }
        .colour-card { border:1px solid var(--divider-color,rgba(0,0,0,0.12)); border-radius:10px; overflow:hidden; cursor:pointer; transition:box-shadow 0.15s,border-color 0.15s; position:relative; }
        .colour-card:hover { box-shadow:0 2px 10px rgba(0,0,0,0.12); border-color:#03a9f4; }
        .colour-swatch { height:44px; width:100%; display:block; position:relative; }
        .colour-swatch input[type="color"] { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; border:none; padding:0; }
        .colour-swatch-preview { position:absolute; inset:0; pointer-events:none; }
        .colour-swatch::before { content:''; position:absolute; inset:0; background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%); background-size:8px 8px; background-position:0 0,0 4px,4px -4px,-4px 0px; opacity:0.3; pointer-events:none; }
        .colour-info { padding:6px 8px 7px; background:var(--card-background-color,#fff); }
        .colour-label { font-size:11px; font-weight:700; color:var(--primary-text-color); letter-spacing:0.02em; margin-bottom:1px; }
        .colour-desc { font-size:10px; color:var(--secondary-text-color,#6b7280); margin-bottom:4px; line-height:1.3; }
        .colour-hex-row { display:flex; align-items:center; gap:4px; }
        .colour-dot { width:12px; height:12px; border-radius:50%; border:1px solid rgba(0,0,0,0.15); flex-shrink:0; }
        .colour-hex { flex:1; font-size:11px; font-family:monospace; border:none; background:none; color:var(--secondary-text-color,#6b7280); padding:0; width:0; min-width:0; }
        .colour-hex:focus { outline:none; color:var(--primary-text-color); }
        .colour-edit-icon { opacity:0; transition:opacity 0.15s; color:var(--secondary-text-color); font-size:14px; line-height:1; }
        .colour-card:hover .colour-edit-icon { opacity:1; }

        .inline-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid rgba(255,255,255,0.06); }
        .inline-row-label { font-size:13px; color:var(--secondary-text-color,#888); }
        .hint { font-size:11px; color:#888; line-height:1.5; padding:8px 0 0; }
      </style>

      <div class="rss-editor">

        <!-- Card Settings -->
        <div>
          <div class="section-title">Card Settings</div>
          <div class="card-block">
            <div class="toggle-list">
              <div class="toggle-item">
                <div><div class="toggle-label">Card Title</div></div>
                <input type="text" class="text-input" id="title-input" value="${this._config.title || ''}" style="width:150px;font-size:13px;padding:7px 10px;">
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Refresh Interval</div>
                  <div class="toggle-sublabel">How often to fetch new articles</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <input type="number" class="number-input" id="refresh-interval-input" value="${this._config.refresh_interval || 30}" min="1" max="1440">
                  <span style="font-size:12px;color:#888;">min</span>
                </div>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Max Articles</div>
                  <div class="toggle-sublabel">Maximum number of articles to show</div>
                </div>
                <input type="number" class="number-input" id="max-articles-input" value="${this._config.max_articles || 20}" min="1" max="200">
              </div>
            </div>
          </div>
        </div>

        <!-- Article Viewing -->
        <div>
          <div class="section-title">Article Viewing</div>
          <div class="card-block" style="padding:12px;">
            <div style="font-size:13px;font-weight:500;margin-bottom:10px;">When an article is tapped</div>
            <div class="segmented">
              <input type="radio" name="article_view" id="av_browser" value="browser" ${articleView === 'browser' ? 'checked' : ''}><label for="av_browser">Open in Browser</label>
              <input type="radio" name="article_view" id="av_panel"   value="panel"   ${articleView === 'panel'   ? 'checked' : ''}><label for="av_panel">Read in Card</label>
            </div>
            <div class="hint">
              <b>Open in Browser</b> — opens the full article in a new tab ·
              <b>Read in Card</b> — shows a text-only summary reader inside the card
            </div>
          </div>
        </div>

        <!-- Scrolling -->
        <div>
          <div class="section-title">Scrolling</div>
          <div class="card-block" style="padding:12px;">
            <div style="font-size:13px;font-weight:500;margin-bottom:10px;">Article List Scroll Mode</div>
            <div class="segmented">
              <input type="radio" name="list_scroll" id="ls_scroll" value="scroll" ${(this._config.list_scroll||'scroll')==='scroll'?'checked':''}><label for="ls_scroll">Normal Scroll</label>
              <input type="radio" name="list_scroll" id="ls_drag"   value="drag"   ${(this._config.list_scroll||'scroll')==='drag'  ?'checked':''}><label for="ls_drag">Drag Scroll</label>
            </div>
            <div class="hint">
              <b>Normal Scroll</b> — standard touch/mouse-wheel scroll with scrollbar ·
              <b>Drag Scroll</b> — click or touch and drag up/down to pan through articles, no scrollbar
            </div>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07);">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:0;">
                <div>
                  <div style="font-size:14px;font-weight:500;">Continuous Auto-Scroll</div>
                  <div style="font-size:11px;color:#888;margin-top:2px;line-height:1.4;">Articles scroll continuously and loop</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="auto-scroll-toggle" ${autoScrollChecked}>
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
            <div id="scroll-speed-row" class="inline-row" style="${this._config.auto_scroll ? '' : 'display:none'}">
              <span class="inline-row-label">Scroll Speed</span>
              <select class="select-input" id="scroll-speed-select">
                <option value="slow"   ${scrollSpeedValue === 'slow'   ? 'selected' : ''}>🐢 Slow</option>
                <option value="medium" ${scrollSpeedValue === 'medium' ? 'selected' : ''}>🐇 Medium</option>
                <option value="fast"   ${scrollSpeedValue === 'fast'   ? 'selected' : ''}>⚡ Fast</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Colours -->
        <div>
          <div class="section-title">Colours</div>
          <div class="card-block">
            <div class="colour-grid" id="colour-grid"></div>
          </div>
        </div>

        <!-- RSS Feeds -->
        <div>
          <div class="section-title">RSS Feeds</div>
          <div class="card-block">
            <div id="feeds-container">
              ${(this._config.feeds || []).map((url, idx) => `
                <div class="feed-row">
                  <input type="text" class="feed-input feed-url" data-index="${idx}" value="${url}" placeholder="https://example.com/feed.xml">
                  <button class="btn-delete remove-feed" data-index="${idx}">✕</button>
                </div>
              `).join('')}
            </div>
            <button class="btn-add" id="add-feed">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
              Add Feed URL
            </button>
          </div>
        </div>

      </div>
    `;

    this._buildColourCards();
    this._wireEvents();
  }

  _buildColourCards() {
    const COLOUR_FIELDS = [
      { key: 'header_color',       label: 'Header Background', desc: 'Card header background colour', default: '#03a9f4' },
      { key: 'header_text_color',  label: 'Header Text',       desc: 'Card header text colour',       default: '#ffffff' },
      { key: 'bg_color',           label: 'Card Background',   desc: 'Main card background colour',   default: '#ffffff' },
      { key: 'title_text_color',   label: 'Article Title',     desc: 'Article headline colour',       default: '#000000' },
      { key: 'meta_text_color',    label: 'Meta Text',         desc: 'Date and source label colour',  default: '#666666' },
      { key: 'summary_text_color', label: 'Summary Text',      desc: 'Article summary text colour',  default: '#555555' },
    ];

    const grid = this.querySelector('#colour-grid');
    for (const field of COLOUR_FIELDS) {
      const savedVal  = this._config[field.key] || '';
      const swatchVal = savedVal || field.default;
      const card = document.createElement('div');
      card.className   = 'colour-card';
      card.dataset.key = field.key;
      card.innerHTML = `
        <label class="colour-swatch">
          <div class="colour-swatch-preview" style="background:${swatchVal}"></div>
          <input type="color" value="${/^#[0-9a-fA-F]{6}$/.test(swatchVal) ? swatchVal : swatchVal.substring(0,7)}">
        </label>
        <div class="colour-info">
          <div class="colour-label">${field.label}</div>
          <div class="colour-desc">${field.desc}</div>
          <div class="colour-hex-row">
            <div class="colour-dot" style="background:${swatchVal}"></div>
            <input class="colour-hex" type="text" value="${savedVal}" maxlength="7" placeholder="${field.default}" spellcheck="false">
            <span class="colour-edit-icon">✎</span>
          </div>
        </div>`;

      const nativePicker = card.querySelector('input[type=color]');
      const hexInput     = card.querySelector('.colour-hex');
      const preview      = card.querySelector('.colour-swatch-preview');
      const dot          = card.querySelector('.colour-dot');

      const apply = (val) => {
        preview.style.background = val;
        dot.style.background     = val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) nativePicker.value = val;
        hexInput.value = val;
        this._updateConfig(field.key, val);
      };

      nativePicker.addEventListener('input',  () => apply(nativePicker.value));
      nativePicker.addEventListener('change', () => apply(nativePicker.value));
      hexInput.addEventListener('input', () => {
        const v = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) apply(v);
      });
      hexInput.addEventListener('blur', () => {
        const cur = this._config[field.key] || field.default;
        if (!/^#[0-9a-fA-F]{6}$/.test(hexInput.value.trim())) hexInput.value = cur;
      });
      hexInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') hexInput.blur(); });

      grid.appendChild(card);
    }
  }

  _wireEvents() {
    this.querySelector('#title-input').addEventListener('change', (e) =>
      this._updateConfig('title', e.target.value));

    this.querySelector('#refresh-interval-input').addEventListener('change', (e) => {
      const value = Math.max(1, Math.min(1440, parseInt(e.target.value) || 30));
      e.target.value = value;
      this._updateConfig('refresh_interval', value);
    });

    this.querySelector('#max-articles-input').addEventListener('change', (e) => {
      const value = Math.max(1, Math.min(200, parseInt(e.target.value) || 20));
      e.target.value = value;
      this._updateConfig('max_articles', value);
    });

    ['browser','panel'].forEach(v => {
      const el = this.querySelector(`#av_${v}`);
      if (el) el.addEventListener('change', () => this._updateConfig('article_view', v));
    });

    const autoScrollToggle = this.querySelector('#auto-scroll-toggle');
    const scrollSpeedRow   = this.querySelector('#scroll-speed-row');
    autoScrollToggle.addEventListener('change', (e) => {
      scrollSpeedRow.style.display = e.target.checked ? '' : 'none';
      this._updateConfig('auto_scroll', e.target.checked);
    });

    this.querySelector('#scroll-speed-select').addEventListener('change', (e) =>
      this._updateConfig('scroll_speed', e.target.value));

    ['scroll','drag'].forEach(v => {
      const el = this.querySelector(`#ls_${v}`);
      if (el) el.addEventListener('change', () => this._updateConfig('list_scroll', v));
    });

    this.querySelector('#feeds-container').addEventListener('change', (e) => {
      const input = e.target.closest('.feed-url');
      if (!input) return;
      const newFeeds = [...this._config.feeds];
      newFeeds[input.dataset.index] = input.value;
      this._updateConfig('feeds', newFeeds);
    });

    this.querySelector('#feeds-container').addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-feed');
      if (!btn) return;
      const newFeeds = [...this._config.feeds];
      newFeeds.splice(btn.dataset.index, 1);
      this._initialized = false;
      this._updateConfig('feeds', newFeeds);
    });

    this.querySelector('#add-feed').addEventListener('click', () => {
      const newFeeds = [...(this._config.feeds || []), ""];
      this._initialized = false;
      this._updateConfig('feeds', newFeeds);
    });
  }

  _updateConfig(key, value) {
    if (typeof key === 'object') {
      // Legacy: called with a newValues object
      this._config = { ...this._config, ...key };
    } else {
      this._config = { ...this._config, [key]: value };
    }
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config } },
      bubbles: true,
      composed: true,
    }));
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
      auto_scroll: false,
      scroll_speed: "medium",
      list_scroll: "scroll",
      article_view: "browser",
      header_color: "#03a9f4",
      header_text_color: "#ffffff",
      bg_color: "#ffffff",
      title_text_color: "#000000",
      meta_text_color: "#666666",
      summary_text_color: "#555555"
    };
  }

  setConfig(config) {
    const oldFeeds       = JSON.stringify(this._config?.feeds);
    const oldInterval    = this._config?.refresh_interval;
    const oldMaxArticles = this._config?.max_articles;
    const oldAutoScroll  = this._config?.auto_scroll;
    const oldScrollSpeed = this._config?.scroll_speed;
    const oldListScroll  = this._config?.list_scroll;

    this._config = config || {};
    this._applyStyles();

    if (oldFeeds !== JSON.stringify(config.feeds) && this.content) {
      this._fetchRSS();
    }
    if (oldInterval !== config.refresh_interval) {
      this._setupAutoRefresh();
    }
    if (oldMaxArticles !== config.max_articles && this._cachedArticles) {
      this._render(this._cachedArticles);
    }
    if (
      (oldAutoScroll !== config.auto_scroll || oldScrollSpeed !== config.scroll_speed || oldListScroll !== config.list_scroll)
      && this._cachedArticles
    ) {
      this._render(this._cachedArticles);
    }
  }

  _applyStyles() {
    if (!this.container) return;
    this.headerTitle.innerText = this._config.title || "Rabbit RSS";

    const header = this.querySelector(".header");
    header.style.backgroundColor = this._config.header_color || "#03a9f4";
    header.style.color            = this._config.header_text_color || "#ffffff";

    this.container.style.backgroundColor = this._config.bg_color || "#ffffff";
    this.content.style.backgroundColor   = this._config.bg_color || "#ffffff";

    this.container.style.setProperty('--article-title-color',   this._config.title_text_color   || "#000000");
    this.container.style.setProperty('--article-meta-color',    this._config.meta_text_color    || "#666666");
    this.container.style.setProperty('--article-summary-color', this._config.summary_text_color || "#555555");
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) this._init();
  }

  _init() {
    this.innerHTML = `
      <style>
        ha-card { padding:0; overflow:hidden; display:flex; flex-direction:column; height:100%; transition:all 0.3s ease; }
        .header { padding:16px; font-weight:bold; font-size:1.1em; display:flex; justify-content:space-between; align-items:center; }
        .refresh-btn { cursor:pointer; transition:transform 0.2s; }
        .refresh-btn:active { transform:rotate(180deg); }

        .article-list { max-height:450px; overflow-y:auto; }
        .article-list.auto-scroll-active { height:450px; max-height:450px; overflow:hidden; position:relative; }
        .article-list.drag-scroll { overflow-y:scroll; cursor:grab; user-select:none; -webkit-user-select:none; scrollbar-width:none; }
        .article-list.drag-scroll::-webkit-scrollbar { display:none; }
        .article-list.drag-scroll.is-dragging { cursor:grabbing; }
        .scroll-track { will-change:transform; }

        .article { padding:12px 16px; border-bottom:1px solid var(--divider-color); display:flex; gap:12px; text-decoration:none; cursor:pointer; }
        .article:hover { background:rgba(125,125,125,0.1); }
        .article-thumbnail { width:120px; height:80px; flex-shrink:0; object-fit:cover; border-radius:4px; background:#e0e0e0; }
        .article-content { flex:1; display:flex; flex-direction:column; gap:4px; min-width:0; }
        .title { font-weight:500; color:var(--article-title-color); line-height:1.4; transition:color 0.3s; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .summary { font-size:0.85em; color:var(--article-summary-color); line-height:1.4; transition:color 0.3s; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .meta { font-size:0.8em; color:var(--article-meta-color); transition:color 0.3s; }

        /* ── In-card article reader ── */
        .card-wrapper { position:relative; flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .reader-panel { position:absolute; inset:0; z-index:10; background:var(--card-background-color,#fff); display:flex; flex-direction:column; overflow:hidden; transition:transform 0.25s ease,opacity 0.25s ease; }
        .reader-panel.hidden { transform:translateX(100%); opacity:0; pointer-events:none; }
        .reader-header { display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid var(--divider-color); flex-shrink:0; }
        .reader-back { background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center; color:var(--primary-text-color); flex-shrink:0; border-radius:50%; transition:background 0.15s; }
        .reader-back:active { background:rgba(0,0,0,0.08); }
        .reader-back svg { width:20px; height:20px; fill:currentColor; display:block; }
        .reader-open-btn { margin-left:auto; flex-shrink:0; background:rgba(3,169,244,0.12); border:1px solid rgba(3,169,244,0.3); color:#03a9f4; border-radius:8px; padding:5px 10px; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:4px; transition:background 0.15s; }
        .reader-open-btn:active { background:rgba(3,169,244,0.22); }
        .reader-open-btn svg { width:12px; height:12px; fill:currentColor; }
        .reader-panel-title { font-size:13px; font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--primary-text-color); }
        .reader-body { flex:1; overflow-y:auto; padding:16px; }
        .reader-article-title { font-size:17px; font-weight:700; line-height:1.4; color:var(--primary-text-color); margin-bottom:6px; }
        .reader-meta { font-size:12px; color:#888; margin-bottom:14px; }
        .reader-text { font-size:14px; line-height:1.75; color:var(--primary-text-color); opacity:0.85; white-space:pre-wrap; word-break:break-word; }
        .reader-footer { margin-top:20px; padding-top:14px; border-top:1px solid var(--divider-color); font-size:11px; color:#888; line-height:1.6; }
        @keyframes rss-spin { to { transform:rotate(360deg); } }
      </style>
      <ha-card id="card-container">
        <div class="header">
          <span id="header-title"></span>
          <ha-icon id="refresh-icon" class="refresh-btn" icon="mdi:refresh"></ha-icon>
        </div>
        <div class="card-wrapper">
          <div id="content" class="article-list">Loading feeds...</div>
          <!-- In-card reader panel -->
          <div class="reader-panel hidden" id="readerPanel">
            <div class="reader-header">
              <button class="reader-back" id="readerBack" title="Back to feed">
                <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <span class="reader-panel-title" id="readerPanelTitle"></span>
              <button class="reader-open-btn" id="readerOpenBtn">
                <svg viewBox="0 0 24 24"><path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/></svg>
                Open
              </button>
            </div>
            <div class="reader-body" id="readerBody"></div>
          </div>
        </div>
      </ha-card>
    `;

    this.content         = this.querySelector("#content");
    this.container       = this.querySelector("#card-container");
    this.headerTitle     = this.querySelector("#header-title");
    this._readerPanel    = this.querySelector("#readerPanel");
    this._readerBody     = this.querySelector("#readerBody");
    this._readerTitle    = this.querySelector("#readerPanelTitle");
    this._readerOpenBtn  = this.querySelector("#readerOpenBtn");

    this.querySelector("#refresh-icon").onclick = () => this._fetchRSS();
    this.querySelector("#readerBack").onclick   = () => this._closeReader();

    this._applyStyles();
    this._fetchRSS();
    this._setupAutoRefresh();
  }

  _setupAutoRefresh() {
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    const intervalMs = (this._config.refresh_interval || 30) * 60 * 1000;
    this._refreshInterval = setInterval(() => this._fetchRSS(), intervalMs);
  }

  // ── Reader panel ────────────────────────────────────────────────────────────

  _openReader(item) {
    if (!this._readerPanel) return;
    this._readerPanel.classList.remove('hidden');
    this._readerTitle.textContent = item.title || '';
    this._readerOpenBtn.onclick = () => window.open(item.link, '_blank');

    // Build reader content from the RSS feed data (text only, no cross-origin fetch)
    const rawDescription = item.description || item.content || '';
    const text = this._stripHtml(rawDescription);
    const date = item.pubDate
      ? new Date(item.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const source = item.source || '';

    this._readerBody.innerHTML = `
      <div class="reader-article-title">${this._escapeHtml(item.title || '')}</div>
      <div class="reader-meta">${[date, source].filter(Boolean).join(' · ')}</div>
      ${text
        ? `<div class="reader-text">${this._escapeHtml(text)}</div>`
        : `<div class="reader-text" style="opacity:0.4;font-style:italic;">No summary available for this article.</div>`
      }
      <div class="reader-footer">
        This is the article summary from the RSS feed.
        Tap <b>Open</b> above to read the full article in your browser.
      </div>
    `;
  }

  _closeReader() {
    if (this._readerPanel) this._readerPanel.classList.add('hidden');
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Auto-scroll helpers ─────────────────────────────────────────────────────

  _scrollPps() {
    const map = { slow: 25, medium: 55, fast: 110 };
    return map[this._config.scroll_speed || "medium"];
  }

  _startAutoScroll() {
    this._stopAutoScroll();
    const el  = this.content;
    const pps = this._scrollPps();
    let lastTs = null;

    const tick = (ts) => {
      if (!this._config.auto_scroll) { this._stopAutoScroll(); return; }
      if (lastTs === null) lastTs = ts;
      const delta = ts - lastTs;
      lastTs = ts;
      const track = el.querySelector(".scroll-track");
      if (!track) { this._stopAutoScroll(); return; }
      this._scrollPos = (this._scrollPos || 0) + (pps * delta) / 1000;
      const halfHeight = track.scrollHeight / 2;
      if (this._scrollPos >= halfHeight) this._scrollPos -= halfHeight;
      track.style.transform = `translateY(-${this._scrollPos}px)`;
      this._rafId = requestAnimationFrame(tick);
    };

    this._scrollPos = 0;
    this._rafId = requestAnimationFrame(tick);
  }

  _stopAutoScroll() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  // ── Drag-scroll ─────────────────────────────────────────────────────────────

  _setupDragScroll(el) {
    // Tear down any previous listeners before re-attaching
    this._teardownDragScroll(el);

    let startY = 0, startScrollTop = 0, isDragging = false, hasMoved = false;
    let velY = 0, lastY = 0, lastT = 0, rafId = null;

    const CLICK_THRESHOLD = 5; // px — below this is a tap, not a drag

    const getY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const onMouseDown = (e) => {
      isDragging = true;
      hasMoved   = false;
      startY         = getY(e);
      startScrollTop = el.scrollTop;
      lastY = startY;
      lastT = Date.now();
      velY  = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      el.classList.add('is-dragging');
      // Attach move/up to document so drag works even if cursor leaves the element
      document.addEventListener('mousemove', onMouseMove, { passive: false });
      document.addEventListener('mouseup',   onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientY = getY(e);
      const dy = clientY - startY;
      if (Math.abs(dy) > CLICK_THRESHOLD) hasMoved = true;
      const now = Date.now();
      const dt  = now - lastT || 1;
      velY  = (clientY - lastY) / dt;
      lastY = clientY;
      lastT = now;
      el.scrollTop = startScrollTop - dy;
      e.preventDefault();
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      _startMomentum();
    };

    // Touch events stay on the element (browsers require passive:false for preventDefault)
    const onTouchStart = (e) => {
      isDragging = true;
      hasMoved   = false;
      startY         = getY(e);
      startScrollTop = el.scrollTop;
      lastY = startY;
      lastT = Date.now();
      velY  = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      el.classList.add('is-dragging');
      e.preventDefault();
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const clientY = getY(e);
      const dy = clientY - startY;
      if (Math.abs(dy) > CLICK_THRESHOLD) hasMoved = true;
      const now = Date.now();
      const dt  = now - lastT || 1;
      velY  = (clientY - lastY) / dt;
      lastY = clientY;
      lastT = now;
      el.scrollTop = startScrollTop - dy;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('is-dragging');
      _startMomentum();
    };

    const _startMomentum = () => {
      if (!hasMoved) return;
      const DECEL   = 0.92;
      const MIN_VEL = 0.05;
      const step = () => {
        velY *= DECEL;
        if (Math.abs(velY) < MIN_VEL) return;
        el.scrollTop -= velY * 16;
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    el.addEventListener('mousedown',  onMouseDown,  { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);

    // Suppress click events that follow a real drag (not a tap)
    el._dragClickSuppressor = (e) => {
      if (hasMoved) e.stopImmediatePropagation();
    };
    el.addEventListener('click', el._dragClickSuppressor, true);

    // Store cleanup refs
    el._dragHandlers = { onMouseDown, onTouchStart, onTouchMove, onTouchEnd };
    el._dragDocHandlers = { onMouseMove, onMouseUp };
    el._dragRafRef   = () => { if (rafId) cancelAnimationFrame(rafId); };
  }

  _teardownDragScroll(el) {
    if (!el._dragHandlers) return;
    const { onMouseDown, onTouchStart, onTouchMove, onTouchEnd } = el._dragHandlers;
    el.removeEventListener('mousedown',  onMouseDown);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove',  onTouchMove);
    el.removeEventListener('touchend',   onTouchEnd);
    // Also clean up any document-level listeners that may still be attached
    if (el._dragDocHandlers) {
      document.removeEventListener('mousemove', el._dragDocHandlers.onMouseMove);
      document.removeEventListener('mouseup',   el._dragDocHandlers.onMouseUp);
      delete el._dragDocHandlers;
    }
    if (el._dragClickSuppressor) {
      el.removeEventListener('click', el._dragClickSuppressor, true);
      delete el._dragClickSuppressor;
    }
    if (el._dragRafRef) { el._dragRafRef(); delete el._dragRafRef; }
    delete el._dragHandlers;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  disconnectedCallback() {
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._stopAutoScroll();
  }

  // ── Data fetching ───────────────────────────────────────────────────────────

  async _fetchRSS() {
    const feeds      = (this._config && this._config.feeds) || [];
    const validFeeds = feeds.filter(url => url && url.trim().startsWith("http"));
    if (validFeeds.length === 0) {
      if (this.content) this.content.innerHTML = `<div style="padding:20px;">No valid feeds.</div>`;
      return;
    }

    if (this.content) this.content.style.opacity = "0.5";

    try {
      const promises = validFeeds.map(url =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&cache_boost=${Date.now()}`)
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
      if (this.content) this.content.innerHTML = `<div style="padding:20px;">Error loading feeds.</div>`;
    } finally {
      if (this.content) this.content.style.opacity = "1";
    }
  }

  _stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  _render(articles) {
    if (!this.content) return;
    this._stopAutoScroll();

    const maxArticles     = this._config.max_articles || 20;
    const displayArticles = articles.slice(0, maxArticles);
    const articleView     = this._config.article_view || 'browser';

    // Store items keyed by index for the panel reader
    this._articleMap = {};

    const articleHTML = displayArticles.map((item, idx) => {
      const thumbnail   = item.thumbnail || item.enclosure?.link || '';
      const description = this._stripHtml(item.description || item.content || '');
      const summary     = description.substring(0, 150) + (description.length > 150 ? '...' : '');

      this._articleMap[idx] = item;

      if (articleView === 'panel') {
        return `
          <div class="article" data-rss-idx="${idx}">
            ${thumbnail ? `<img class="article-thumbnail" src="${thumbnail}" alt="" loading="lazy">` : ''}
            <div class="article-content">
              <span class="title">${item.title}</span>
              ${summary ? `<span class="summary">${summary}</span>` : ''}
              <span class="meta">${new Date(item.pubDate).toLocaleDateString()} • ${item.source}</span>
            </div>
          </div>
        `;
      }
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

    if (this._config.auto_scroll && displayArticles.length > 0) {
      this.content.classList.add("auto-scroll-active");
      this.content.innerHTML = `<div class="scroll-track">${articleHTML}${articleHTML}</div>`;
      this._startAutoScroll();
    } else {
      this.content.classList.remove("auto-scroll-active");
      this.content.innerHTML = articleHTML;
    }

    // Apply drag-scroll mode
    const listScroll = this._config.list_scroll || 'scroll';
    if (!this._config.auto_scroll && listScroll === 'drag') {
      this.content.classList.add('drag-scroll');
      this._setupDragScroll(this.content);
    } else {
      this.content.classList.remove('drag-scroll');
      this._teardownDragScroll(this.content);
    }

    // Wire panel-mode click handlers
    if (articleView === 'panel') {
      this.content.querySelectorAll('.article[data-rss-idx]').forEach(el => {
        el.addEventListener('click', () => {
          const item = this._articleMap[el.dataset.rssIdx];
          if (item) this._openReader(item);
        });
      });
    }
  }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);