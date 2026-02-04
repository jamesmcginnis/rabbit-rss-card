# Rabbit RSS Card

A sleek, multi-feed RSS reader for Home Assistant with a built-in visual editor and deep color customization.

![JavaScript](https://img.shields.io/badge/JavaScript-Module-yellow.svg)
![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)

## Previews

| Card View | Visual Editor |
| :---: | :---: |
| ![Preview 1](Preview1.png) | ![Preview 2](Preview2.png) |

---

## Features

- **Multi-Feed Support**: Aggregate news from multiple sources into a single, unified list
- **Visual Editor**: No YAML required! Add feeds and customize colors directly in the Home Assistant UI
- **Full Customization**: Change background colors, header colors, and text styles to match your dashboard theme
- **Auto-Sorting**: Articles are automatically sorted by date, regardless of which feed they come from
- **Responsive Design**: Optimized for both desktop and mobile viewports
- **Clean Interface**: Scrollable article list with a maximum height of 450px keeps your dashboard organized

## Installation

### HACS Installation (Recommended)

1. Open HACS in your Home Assistant instance
2. Click on **Frontend**
3. Click the **three dots** in the top right corner and select **Custom repositories**
4. Add the repository URL: `https://github.com/jamesmcginnis/rabbit-rss-card`
5. Select category: **Dashboard**
6. Click **Add**
7. Find **Rabbit RSS Card** in the list and click **Download**
8. Restart Home Assistant
9. Clear your browser cache

### Manual Installation

1. Download the `rabbit-rss-card.js` file from this repository
2. Upload it to your Home Assistant instance under the `/www/` folder (e.g., `/config/www/rabbit-rss-card.js`)
3. Add the resource to your Home Assistant Dashboard:
   - Go to **Settings** > **Dashboards**
   - Click the **three dots** in the top right and select **Resources**
   - Click **Add Resource**
   - Set the URL to `/local/rabbit-rss-card.js` and the type to **JavaScript Module**
4. Refresh your browser (clear cache if necessary)

## Configuration

### Visual Configuration (Recommended)

The Rabbit RSS Card is designed to be configured through the UI:

1. Add a new card to your dashboard
2. Select **Custom: Rabbit RSS Card**
3. Use the visual editor to:
   - Add RSS feed URLs
   - Customize colors and appearance
   - Set your card title

### YAML Configuration (Optional)

If you prefer manual YAML configuration, you can use the following structure:

```yaml
type: custom:rabbit-rss-card
title: "Tech News"
header_color: "#2c3e50"
header_text_color: "#ecf0f1"
bg_color: "#ffffff"
title_text_color: "#000000"
meta_text_color: "#666666"
feeds:
  - [https://www.theverge.com/rss/index.xml](https://www.theverge.com/rss/index.xml)
  - [https://techcrunch.com/feed/](https://techcrunch.com/feed/)
