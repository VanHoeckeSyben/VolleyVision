'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToSocket = () => {
  socketio.on('connect', () => {
    console.log('verbonden met socket webserver');
  });

  socketio.on('B2F_verandering_sensoren', (jsonObject) => {
    console.log(jsonObject);
  });
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
  console.info('DOM geladen');
  listenToSocket();
};

document.addEventListener('DOMContentLoaded', init);

// #endregion