'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showLiveSensoren = (json) => {
  let sensorGegevens = json.sensoren
  let htmlSensorVal = document.querySelectorAll('.js-sensorvalue');
  for (let item of htmlSensorVal) {
    if (item.dataset.sensor == sensorGegevens.sensornaam) {
      item.innerHTML = sensorGegevens.value;
    }
  }
}
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
    showLiveSensoren(jsonObject);
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