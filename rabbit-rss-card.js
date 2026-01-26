class RabbitRSSCard extends HTMLElement {
  constructor() {
    super();
    this.state = {
      feeds: JSON.parse(localStorage.getItem('rss-feeds')) || [{ url: 'https://news.ycombinator.com/rss', name: 'Hacker News' }],
      articles: [],
      readArticles: new Set(JSON.parse(localStorage.getItem('rss-read-articles')) || []),
      expandedArticle: null,
      showEditor: false,
      loading: false
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.init();
    }
  }

  init() {
    this.innerHTML = `
      <style>
        :host {
          --rss-card-bg: var(--ha-card-background, var(--card-background-color, white));
          --rss-primary-text: var(--primary-text-color);
          --rss-secondary-text: var(--secondary-text-color);
          --rss-accent: var(--primary-color, #3b82f6);
        }
        .rss-container { 
          background: var(--rss-card-bg); 
          color: var(--rss-primary-text);
          border-radius: var(--ha-card-border-radius, 12px);
          overflow: hidden;
          font-family: sans-serif;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      </style>
      <ha-card class="rss-container">
        <div id="app-root"></div>
      </ha-card>
    `;
    this.content = this.querySelector('#app-root');
    this.render();
    this.fetchFeeds();
  }

  async fetchFeeds() {
    this.state.loading = true;
    this.render();
    
    let allArticles = [];
    for (const feed of this.state.feeds) {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await response.json();
        if (data.items) {
          allArticles.push(...data.items.map(item => ({
            ...item,
            feedName: feed.name,
            id: btoa(item.link).substring(0, 16) // Simplified ID
          })));
        }
      } catch (e) { console.error("Feed error", e); }
    }
    
    this.state.articles = allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    this.state.loading = false;
    this.render();
  }

  render() {
    if (!this.content) return;

    this.content.innerHTML = `
      <div class="p-4 bg-blue-600 text-white flex justify-between items-center">
        <h2 class="font-bold">Rabbit RSS</h2>
        <button id="toggle-settings" class="p-1 hover:bg-white/20 rounded">Settings</button>
      </div>

      ${this.state.showEditor ? this.renderEditor() : ''}

      <div class="articles-list" style="max-height: 500px; overflow-y: auto;">
        ${this.state.loading ? '<div class="p-10 text-center">Loading...</div>' : 
          this.state.articles.map((art, idx) => `
          <div class="article-item p-4 border-b cursor-pointer hover:bg-black/5 ${this.state.readArticles.has(art.id) ? 'opacity-50' : ''}" 
               data-idx="${idx}">
            <div class="flex gap-3">
              ${art.thumbnail ? `<img src="${art.thumbnail}" class="w-16 h-16 rounded object-cover">` : ''}
              <div>
                <div class="font-bold line-clamp-2">${art.title}</div>
                <div class="text-sm opacity-70">${art.feedName} ¥ ${new Date(art.pubDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${this.state.expandedArticle ? this.renderModal() : ''}
    `;

    this.attachEventListeners();
  }

  renderEditor() {
    return `
      <div class="p-4 bg-gray-100 dark:bg-gray-800 border-b">
        <div class="text-sm font-bold mb-2">Manage Feeds</div>
        ${this.state.feeds.map((f, i) => `
          <div class="flex gap-2 mb-2">
            <input class="flex-1 p-1 text-black" value="${f.url}" placeholder="URL" data-feed-idx="${i}">
            <button class="remove-feed text-red-500" data-idx="${i}">?</button>
          </div>
        `).join('')}
        <button id="add-feed" class="text-blue-500 text-sm">+ Add Feed</button>
      </div>
    `;
  }

  renderModal() {
    const art = this.state.expandedArticle;
    return `
      <div class="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto p-4">
        <button id="close-modal" class="mb-4 p-2 bg-gray-200 dark:bg-gray-700 rounded">? Back</button>
        <h1 class="text-xl font-bold mb-2">${art.title}</h1>
        <div class="opacity-70 mb-4">${art.feedName}</div>
        <div class="prose dark:prose-invert">${art.description}</div>
        <a href="${art.link}" target="_blank" class="block mt-6 p-3 bg-blue-600 text-center text-white rounded">Read Original</a>
      </div>
    `;
  }

  attachEventListeners() {
    this.querySelector('#toggle-settings')?.addEventListener('click', () => {
      this.state.showEditor = !this.state.showEditor;
      this.render();
    });

    this.querySelectorAll('.article-item').forEach(el => {
      el.addEventListener('click', () => {
        const art = this.state.articles[el.dataset.idx];
        this.state.expandedArticle = art;
        this.state.readArticles.add(art.id);
        localStorage.setItem('rss-read-articles', JSON.stringify([...this.state.readArticles]));
        this.render();
      });
    });

    this.querySelector('#close-modal')?.addEventListener('click', () => {
      this.state.expandedArticle = null;
      this.render();
    });

    this.querySelector('#add-feed')?.addEventListener('click', () => {
      this.state.feeds.push({ url: '', name: 'New Feed' });
      this.render();
    });

    this.querySelectorAll('.remove-feed').forEach(el => {
      el.addEventListener('click', () => {
        this.state.feeds.splice(el.dataset.idx, 1);
        localStorage.setItem('rss-feeds', JSON.stringify(this.state.feeds));
        this.render();
      });
    });
  }

  getCardSize() { return 4; }
}

customElements.define("rabbit-rss-card", RabbitRSSCard);
