# Rabbit RSS Card

A sleek, multi-feed RSS reader for Home Assistant with a built-in visual editor and deep color customization.

## Key Features

✨ **Visual Editor** - Configure everything through the UI, no YAML editing required

📰 **Multi-Feed Support** - Combine multiple RSS feeds into one unified view

🎨 **Full Customization** - Customize header colors, background colors, and text colors to match your dashboard

📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices

🔄 **Auto-Sorting** - Articles automatically sorted by date across all feeds

🎯 **Clean Interface** - Scrollable list keeps your dashboard organized

## Quick Start

1. Add the card to your dashboard
2. Use the visual editor to add your RSS feed URLs
3. Customize colors to match your theme
4. Done!

## Perfect For

- News aggregation from multiple sources
- Blog reading
- Podcast feed monitoring
- YouTube channel updates
- Any RSS/Atom feed

## Example Feeds

- **News**: New York Times, BBC, Reuters
- **Tech**: The Verge, TechCrunch, Ars Technica
- **Blogs**: Medium, WordPress blogs
- **YouTube**: Channel RSS feeds
- **Podcasts**: Most podcast RSS feeds

## Configuration

All configuration can be done through the visual editor, or manually via YAML if preferred.

### Available Options

- **Title**: Set your card header title
- **Feeds**: Add multiple RSS feed URLs
- **Header Color**: Customize the header background
- **Header Text Color**: Customize the header text
- **Background Color**: Set the card body background
- **Title Text Color**: Color for article titles
- **Meta Text Color**: Color for dates and source names

## Technical Notes

- Uses the rss2json API for feed parsing
- Compatible with RSS 2.0 and Atom feeds
- Maximum card height: 450px (scrollable)
- Articles sorted by publication date
- CORS-friendly implementation

## Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/jamesmcginnis/rabbit-rss-card).