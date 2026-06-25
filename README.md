<h1 align="center">
<img src="https://raw.githubusercontent.com/YahyaZekry/basecamp-linux/main/resources/basecamp-full-stacked.png" width="466" height="390">
</h1>

# Basecamp Desktop for Linux

Unofficial [Basecamp](https://basecamp.com/) GNU/Linux desktop client built with [Electron](http://electron.atom.io/). Works with both Basecamp 4 and the latest Basecamp 5.

## Features

- Native notifications
- Context menu on links
- Basic UI settings
- Tray icon with unread count badge
- BC5 compatible: multi-step login (email → password), Google sign-in, OAuth popups
- User-Agent stripped of Electron/Basecamp identifiers for BC5 compatibility
- Upgraded to Electron 42

## Privacy

No information is collected or tracked by the application. Use _File → Clear data_ to erase all stored sessions and cache.

## Installation

Download the [latest release](https://github.com/YahyaZekry/basecamp-linux/releases) and extract it. Run the `basecamp` binary.

## Build from source

```sh
npm install
npm run build
```

Output: `build/basecamp-linux-*/`

## License

MIT
