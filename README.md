# Rabbit RSS Card

A sleek, multi-feed RSS reader for Home Assistant with a built-in visual editor and deep color customization.

![JavaScript](https://img.shields.io/badge/JavaScript-Module-yellow.svg)

## Features

- **Multi-Feed Support**: Aggregate news from multiple sources into a single, unified list
- **Visual Editor**: No YAML required! Add feeds and customize colors directly in the Home Assistant UI
- **Full Customization**: Change background colors, header colors, and text styles to match your dashboard theme
- **Auto-Sorting**: Articles are automatically sorted by date, regardless of which feed they come from
- **Responsive Design**: Optimized for both desktop and mobile viewports
- **Clean Interface**: Scrollable article list with a maximum height of 450px keeps your dashboard organized

## Installation

### Manual Installation

1. Download the `rabbit-rss-card.js` file from this repository
2. Upload it to your Home Assistant instance under the `/www/` folder (e.g., `/config/www/rabbit-rss-card.js`)
3. Add the resource to your Home Assistant Dashboard:
   - Go to **Settings** > **Dashboards**
   - Click the **three dots** in the top right and select **Resources**
   - Click **Add Resource**
   - Set the URL to `/local/rabbit-rss-card.js` and the type to **JavaScript Module**
4. Refresh your browser (clear cache if necessary)

### HACS Installation (Coming Soon)

Support for Home Assistant Community Store (HACS) is planned for a future release.

## Configuration

### Visual Configuration (Recommended)

The Rabbit RSS Card is designed to be configured through the UI:

1. Add a new card to your dashboard
2. Select **Custom: Rabbit RSS Card**
3. Use the visual editor to:
   - Add RSS feed URLs
   - Customize colors and appearance
   - Set your card title
4. Save and enjoy!

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
  - https://www.theverge.com/rss/index.xml
  - https://techcrunch.com/feed/
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | **Required** | Must be `custom:rabbit-rss-card` |
| `title` | string | `"Rabbit RSS"` | The title displayed in the card header |
| `feeds` | list | `[]` | A list of RSS feed URLs |
| `header_color` | string | `"#03a9f4"` | Background color for the header |
| `header_text_color` | string | `"#ffffff"` | Text color for the header |
| `bg_color` | string | `"#ffffff"` | Background color for the card body |
| `title_text_color` | string | `"#000000"` | Text color for article titles |
| `meta_text_color` | string | `"#666666"` | Text color for dates and sources |

## Examples

### News Dashboard

```yaml
type: custom:rabbit-rss-card
title: "Daily News"
header_color: "#1e3a8a"
header_text_color: "#ffffff"
feeds:
  - https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
  - https://feeds.bbci.co.uk/news/rss.xml
```

### Tech News Dashboard

```yaml
type: custom:rabbit-rss-card
title: "Tech Updates"
header_color: "#10b981"
header_text_color: "#ffffff"
bg_color: "#f9fafb"
feeds:
  - https://www.theverge.com/rss/index.xml
  - https://techcrunch.com/feed/
  - https://arstechnica.com/feed/
```

### Dark Theme

```yaml
type: custom:rabbit-rss-card
title: "Night Reader"
header_color: "#1f2937"
header_text_color: "#f3f4f6"
bg_color: "#111827"
title_text_color: "#f9fafb"
meta_text_color: "#9ca3af"
feeds:
  - https://example.com/rss
```

## Technical Details

### RSS Parsing

This card uses the `rss2json` API to fetch and parse feeds. This approach:
- Ensures high compatibility across different RSS versions (RSS 2.0, Atom, etc.)
- Eliminates the need for a local proxy or server-side component
- Works with CORS-restricted feeds

### Card Height

The article list has a default maximum height of 450px. When content exceeds this limit, the list becomes scrollable, keeping your dashboard clean and organized.

## Troubleshooting

### Feeds not loading?

- Verify the URL is a valid RSS feed (must start with `http://` or `https://`)
- Check your browser's console for error messages
- Test the feed URL in your browser to ensure it's accessible
- Some feeds may be incompatible with the `rss2json` service

### Card not showing up?

- Ensure you've added the resource correctly in Dashboard settings
- Clear your browser cache and refresh the page
- Check that the file path is correct (`/local/rabbit-rss-card.js`)
- Verify the resource type is set to "JavaScript Module"

### Visual editor not working?

- Make sure you're using a recent version of Home Assistant
- Try refreshing your browser and clearing cache
- Check browser console for JavaScript errors

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source. Please check the repository for license details.

## Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information about your problem

## Roadmap

- [ ] HACS integration
- [ ] Configurable article limit per feed
- [ ] Custom date formatting options
- [ ] Feed health indicators
- [ ] Article preview/summary display
- [ ] Refresh interval configuration

---

**Made with ❤️ for the Home Assistant community**
