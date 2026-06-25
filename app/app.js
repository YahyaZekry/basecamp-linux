const {
  app,
  BrowserWindow,
  dialog,
  Menu,
  shell,
  Tray,
} = require('electron');
const appPackage = require('./package.json');
const icon = require('./icon');
const menus = require('./menus');
const notification = require('./notification');
const settings = require('./settings');
const versionChecker = require('./versionChecker');

const ELECTRON_VERSION = process.versions.electron;
const APP_NAME = app.name;
const APP_VERSION = app.getVersion();
const APP_DESCRIPTION = appPackage.description;
const BASECAMP_URL = 'https://launchpad.37signals.com/signin';

/** @type {BrowserWindow} */
let win;
let tray;
let unreadsNotified = false;

/**
 * The app builder object.
 */
const basecamp = {
  buildApp(url) {
    this.createWindow(url);
    this.addAppMenu();
    this.addContextMenu();
    this.addTrayIcon();
    this.setIcons();
    this.addWindowEvents();
    this.bootstrap();
  },

  /**
   * Creates the app window.
   */
  createWindow(url) {
    const config = {
      y: settings.get('posY'),
      x: settings.get('posX'),
      width: settings.get('width'),
      height: settings.get('height'),
      title: APP_NAME,
      icon: icon('icon'),
      autoHideMenuBar: settings.get('autoHideMenu'),
      backgroundColor: settings.get('appBackgroundColor'),
      webPreferences: {
        contextIsolation: true,
      },
    };

    win = new BrowserWindow(config);

    if (settings.get('isMaximized')) {
      win.maximize();
    }

    const chromeVer = process.versions.chrome;
    const osInfo = `${process.platform === 'win32' ? 'Windows NT 10.0' : process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'X11; Linux x86_64'}`;
    const cleanUA = `Mozilla/5.0 (${osInfo}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;
    win.webContents.userAgent = cleanUA;

    win.loadURL(url);
  },

  addWindowEvents() {
    win
      .on('close', () => {
        const bounds = win.getBounds();
        settings.set('posX', bounds.x);
        settings.set('posY', bounds.y);
        settings.set('width', bounds.width);
        settings.set('height', bounds.height);
        settings.set('isMaximized', win.isMaximized());
      })
      .on('closed', () => {
        tray = null;
        win = null;
      })
      .on('page-title-updated', (event, title) => {
        event.preventDefault();
        this.setTitles(title);
      });

    win.webContents.setWindowOpenHandler(({ url }) => {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'accounts.google.com' || urlObj.hostname.endsWith('.google.com') || urlObj.hostname.endsWith('37signals.com') || urlObj.hostname.endsWith('basecamp.com')) {
        return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('did-create-window', (popupWindow) => {
      popupWindow.setBounds({ width: 900, height: 720 });
      popupWindow.center();
    });

    win.webContents
      .on('did-navigate', () => {
        win.webContents.insertCSS(`
          [class*="upgrade"],[class*="update"],[class*="desktop"],[id*="upgrade"],
          [id*="update"],[id*="desktop"],[class*="interstitial"],[class*="overlay"],
          [class*="modal"][class*="backdrop"],div[style*="position:fixed"][style*="z-index"]
        { display:none!important; }
        body{overflow:auto!important;}
        `);
      })
      .on('did-finish-load', () => {
        win.webContents.executeJavaScript(`
          try{
            document.querySelectorAll('[class*="upgrade"],[class*="update"],[id*="upgrade"],[id*="update"]').forEach(e=>e.remove());
          }catch(e){}
        `).catch(()=>{});
      })
      .on('will-navigate', (event, linkUrl) => {
        const regex = /(37signals\.com|basecamp\.com|accounts\.google\.com)/;

        if (!linkUrl.match(regex)) {
          event.preventDefault();
          shell.openExternal(linkUrl);
        }
      });

    return win;
  },

  bootstrap() {
    if (settings.get('checkNewVersion')) {
      this.checkNewVersion();
    }
  },

  /**
   * Checks for new versions.
   */
  checkNewVersion(notifyLatest) {
    versionChecker.check().then((check) => {
      if (check.comparison === 1) {
        notification(`New version ${check.repoVersion} available`);
      } else if (notifyLatest === true) {
        notification(check.comparison === 0
          ? 'You have the latest version'
          : `This is an unreleased version ${check.appVersion}\n\nLatest published is ${check.repoVersion}`);
      }
    });
  },

  /**
   * Adds the app menu.
   */
  addAppMenu() {
    Menu.setApplicationMenu(menus.forApp(this));
  },

  /**
   * Adds the app context menu.
   */
  addContextMenu() {
    win.webContents.on('context-menu', (event, params) => {
      event.preventDefault();
      const { linkURL } = params;

      if (linkURL) {
        menus.forContext(linkURL).popup(win);
      }
    });
  },

  /**
   * Adds the tray icon.
   */
  addTrayIcon() {
    tray = new Tray(icon('tray'));
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(menus.forTray());
    tray.on('click', () => {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    });
  },

  /**
   * Enables or disables menu auto hiding
   */
  switchAutoHideMenu() {
    const isAutoHide = !settings.get('autoHideMenu');
    win.setAutoHideMenuBar(isAutoHide);
    win.setMenuBarVisibility(!isAutoHide);
    settings.set('autoHideMenu', isAutoHide);
  },

  /**
   * Go to previous page on history.
   */
  goBack() {
    if (win.webContents.canGoBack()) {
      win.webContents.goBack();
    }
  },

  /**
   * Go to next page on history.
   */
  goForward() {
    if (win.webContents.canGoForward()) {
      win.webContents.goForward();
    }
  },

  /**
   * Generates and displays a clear data dialog.
   */
  showClearDataDialog() {
    dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Yes', 'Cancel'],
      defaultId: 1,
      title: 'Clear data',
      message: 'This will clear all data.\n\nDo you want to proceed?',
    }).then((result) => {
      if (result.response === 0) {
        this.clearData();
      }
    });
  },

  /**
   * Generates and displays an about dialog.
   */
  showAboutDialog() {
    dialog.showMessageBox(win, {
      type: 'info',
      icon: icon('logo'),
      buttons: ['Ok'],
      defaultId: 0,
      title: 'About',
      message: `${APP_NAME} ${APP_VERSION}\n\n${APP_DESCRIPTION}\n\nElectron ${ELECTRON_VERSION}\n\n${win.webContents.getUserAgent()}`,
    });
  },

  /**
   * Sets the app & tray titles.
   *
   * @param {string} title The webpage title
   */
  setTitles(title) {
    let fixedTitle = title;

    let match = /^\((\d+)\)(.+)/.exec(title);
    if (match) {
      fixedTitle = match[2].trim();
    } else {
      match = /^(•)(.+)/.exec(title);
      if (match) {
        fixedTitle = match[2].trim();
      }
    }

    win.webContents.executeJavaScript('typeof BC !== \'undefined\' && BC.unreads ? BC.unreads.all || 0 : (typeof Launchpad !== \'undefined\' && Launchpad.unreads ? Launchpad.unreads : 0)').then((result) => {
      const unreads = result && result.length ? result.length : 0;

      win.setTitle(unreads > 0 ? `${fixedTitle} • ${unreads}` : fixedTitle);

      tray.setToolTip(unreads > 0 ? `${APP_NAME} • ${unreads}` : APP_NAME);

      if (unreads > 0) {
        if (!unreadsNotified) {
          notification(`You have ${unreads} unread notifications`);
          unreadsNotified = true;
        }

        if (settings.get('showBadge')) {
          this.setIcons(`-unreads-${(unreads > 10 ? '10p' : unreads)}`);
        } else {
          this.setIcons('-unreads');
        }
      } else {
        this.setIcons();
      }
    }).catch(() => {});
  },

  /**
   * Sets the app & tray icons.
   */
  setIcons(suffix) {
    win.setIcon(icon(`icon${suffix ? '-unreads' : ''}`));
    tray.setImage(icon(`tray${suffix || ''}`));
  },

  /**
   * Clears all the app data.
   */
  clearData() {
    const { session } = win.webContents;
    session.clearStorageData().then(() => {
      session.clearCache().then(() => {
        win.loadURL(BASECAMP_URL);
      });
    });
  },

  /**
   * Configures the icon scheme.
   *
   * @param {string} color
   */
  configureIconScheme(color) {
    settings.set('iconScheme', color);
    win.reload();
  },

  /**
   * Configures the icon badge showing.
   *
   * @param {string} color
   */
  configureShowBadge(config) {
    settings.set('showBadge', config);
    win.reload();
  },
};

// --- Build the app

app.disableHardwareAcceleration();

app
  .on('window-all-closed', () => {
    app.quit();
  })
  .on('ready', () => {
    basecamp.buildApp(BASECAMP_URL);
  })
  .on('activate', () => {
    if (win === null) {
      basecamp.buildApp(BASECAMP_URL);
    }
  });
