'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://127.0.0.1:8000/api/v1`
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
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
  console.info('DOM geladen');

  listenToSocket();

};

document.addEventListener('DOMContentLoaded', init);

// #endregion