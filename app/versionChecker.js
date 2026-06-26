const { app, net } = require('electron');
const compareVersions = require('./compareVersions');
const packageRepo = require('./package.json').repository.url;

module.exports = {
  config: {
    repositoryHost: 'raw.githubusercontent.com',
    repositoryPath: packageRepo.match(/https:\/\/github.com\/(.+).git/)[1],
    packageFilePath: 'main/app/package.json',
  },

  check() {
    return new Promise((resolve) => {
      const config = {
        method: 'GET',
        protocol: 'https:',
        hostname: this.config.repositoryHost,
        port: 443,
        path: `${this.config.repositoryPath}/${this.config.packageFilePath}`,
      };

      let body = '';
      const request = net.request(config);

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          body += chunk.toString();
        });

        response.on('end', () => {
          const repoVersion = JSON.parse(body.trim()).version;

          resolve({
            repoVersion,
            appVersion: app.getVersion(),
            comparison: this.compareVersions(app.getVersion(), repoVersion),
          });
        });
      });

      request.end();
    });
  },

  /**
   * Returns -1 if first parameter is higher, 0 if the same, 1 if second parameter is higher.
   */
  compareVersions,
};
