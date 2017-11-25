const kodi = require('kodi-ws');
const driver = require('./driver');

module.exports = {
  initialise: (settings, updateSettings, commsInterface, events, createEvent) => driver(settings, updateSettings, commsInterface, kodi, events, createEvent),
  driverType: 'speaker',
  interface: 'http',
  driverId: 'thinglator-driver-kodi',
};
