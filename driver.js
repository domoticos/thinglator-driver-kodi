const bonjour = require('nbonjour').create();

const deviceCache = {};
const activeDevices = [];
const eventCallbackFunctionInstances = {};
const eventsFired = {};
const connections = {}


const commandPlay = (device, events, createEvent, props) => { connections[device.specs.originalId].Player.PlayPause(1, true)};
const commandPause = (device, events, createEvent, props) => connections[device.specs.originalId].Player.PlayPause(1, false);
const commandStop = (device, events, createEvent, props) => connections[device.specs.originalId].Player.Stop(1);
const commandPrevious = (device, events, createEvent, props) => connections[device.specs.originalId].Player.GoTo(1, 'previous');
const commandNext = (device, events, createEvent, props) => connections[device.specs.originalId].Player.GoTo(1, 'next');
const commandSetVolume = (device, events, createEvent, props) => connections[device.specs.originalId].Application.SetVolume(props.volume);
const commandSetMuted = (device, events, createEvent, props) => connections[device.specs.originalId].Application.SetMute(props.muted);


const initDevices = async (devices, commsInterface, kodi, events, createEvent) => {
  // To listen for events from the kodi library requires that we initialise each kodi instance as a
  // class and attach an event listener to it

  // remove existing event listeners
  Object.keys(deviceCache).forEach((deviceId) => {
    deviceCache[deviceId].removeListener('binaryState', eventCallbackFunctionInstances[deviceId]);
    delete deviceCache[deviceId];
  });
 /*
  // get the new callback url
  const cbUrl = kodi.getCallbackURL();

  // loop through the devices and initialise them
  devices.forEach((device) => {
    const newDevice = Object.assign(device, {});
    // update the callback url
    newDevice.specs.additionalInfo.callbackURL = cbUrl;

    deviceCache[newDevice._id] = kodi.client(newDevice.specs.additionalInfo);

    eventCallbackFunctionInstances[newDevice._id] = (value) => {
      // as soon as we setup the event listener this event will fire. We want to ignore this initial event..
      if (typeof eventsFired[newDevice._id] === 'undefined') {
        eventsFired[newDevice._id] = true;
        return;
      }

      if (value === '1') {
        createEvent(events.ON, newDevice._id, {
          on: true,
        });
      } else {
        createEvent(events.ON, newDevice._id, {
          on: false,
        });
      }
    };

    deviceCache[newDevice._id].on('binaryState', eventCallbackFunctionInstances[newDevice._id]);

    deviceCache[newDevice._id].on('error', (err) => {
      if ((err.code === 'EHOSTUNREACH') || (err.code === 'ECONNREFUSED') || (err.code === 'ETIMEDOUT')) {
        // activeDevices = activeDevices.filter(item => item.additionalInfo.host !== err.address);
      }
    });
  });

  */
};

const discover = async () => Promise.resolve(activeDevices);


module.exports = async (getSettings, updateSettings, commsInterface, kodi, events, createEvent) => {
  // find all HTTP services in the network (there is no decent way to find only Kodi instances)
  bonjour.find({ type: 'http' }, function (service) {
    if(service.addresses.length > 0) {
      // try connect to Kodi on port 9090
      // TODO: 9090 is the default Kodi WS port, but this has to be configurable
      kodi(service.addresses[0], 9090).then((connection) => {
        connections[connection.socket.url] = connection;
        const device = {
          originalId: connection.socket.url,
          name: service.name,
          address: connection.socket.url,
          commands: {
            setMuted: true,
            setVolume: true,
            next: true,
            pause: true,
            play: true,
            previous: true,
            stop: true,
          },
          events: {
          }
        };
        activeDevices.push(device);

      }).catch((e) => { /* it's OK, it's just not a Kodi instance */ });
    }
  })

  return {
    initDevices: async devices => initDevices(devices, commsInterface, kodi, events, createEvent),
    authentication_getSteps: [],
    discover: async () => discover(),
    command_play: async device => commandPlay(device, events, createEvent),
    command_pause: async device => commandPause(device,events, createEvent),
    command_stop: async device => commandStop(device, events, createEvent),
    command_previous: async device => commandPrevious(device, events, createEvent),
    command_next: async device => commandNext(device, events, createEvent),
    command_setMuted: async (device, props) => commandSetMuted(device, events, createEvent, props),
    command_setVolume: async (device, props) => commandSetVolume(device, events, createEvent, props),
  };
};
