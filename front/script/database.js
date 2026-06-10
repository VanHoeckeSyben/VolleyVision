'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://127.0.0.1:8000/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let htmlDashboard, htmlDatabase, htmlDevices, htmlDeviceTypes, htmlMatchen, htmlOpstellingen, htmlSensorEvents, htmlServes, htmlSpelers, htmlSettings;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showLiveSensoren = (json) => {
  let htmlSensorVal = document.querySelectorAll('.js-sensorvalue');
  for (let item of htmlSensorVal) {
    if (item.dataset.sensor == json.sensornaam) {
      item.innerHTML = json.value;
    }
  }
}

const showDevices = (json) => {
  console.log(json)
  let devices = json.devices

  let htmlDevicesString = ``;

  for (let device of devices) {
    htmlDevicesString += `<tr>
                    <td>${device.device_id}</td>
                    <td>${device.device_type_id}</td>
                    <td>${device.naam}</td>
                    <td>${device.beschrijving}</td>
                </tr>`
  }

  htmlDevices.innerHTML = htmlDevicesString;
}

const showDeviceTypes = (json) => {
  console.log(json)
  let deviceTypes = json.device_types

  let htmlDeviceTypesString = ``;

  for (let deviceType of deviceTypes) {
    htmlDeviceTypesString += `<tr>
                    <td>${deviceType.device_type_id}</td>
                    <td>${deviceType.type}</td>
                </tr>`
  }

  htmlDeviceTypes.innerHTML = htmlDeviceTypesString;
}

const showMatchen = (json) => {
  console.log(json)
  let matchen = json.matchen

  let htmlMatchenString = ``;

  for (let match of matchen) {
    htmlMatchenString += `<tr>
                    <td>${match.match_id}</td>
                    <td>${match.match_naam}</td>
                    <td>${match.datum}</td>
                    <td>${match.locatie}</td>
                </tr>`
  }

  htmlMatchen.innerHTML = htmlMatchenString;
}

const showOpstellingen = (json) => {
  console.log(json)
  let opstellingen = json.Speler_opstellingen

  let htmlOpstellingenString = ``;

  for (let opstelling of opstellingen) {
    htmlOpstellingenString += `<tr>
                    <td>${opstelling.match_id}</td>
                    <td>${opstelling.naam}</td>
                    <td>${opstelling.voornaam}</td>
                    <td>${opstelling.rugnummer}</td>
                    <td>${opstelling.veld_positie}</td>
                </tr>`
  }

  htmlOpstellingen.innerHTML = htmlOpstellingenString;
}

const showSensorEvents = (json) => {
  console.log(json)
  let sensorEvents = json.sensorevents

  let htmlSensorEventsString = ``;

  for (let sensorEvent of sensorEvents) {
    htmlSensorEventsString += `<tr>
                    <td>${sensorEvent.event_id}</td>
                    <td>${sensorEvent.serve_id}</td>
                    <td>${sensorEvent.device_id}</td>
                    <td>${sensorEvent.waarde}</td>
                    <td>${sensorEvent.event_tijd}</td>
                </tr>`
  }

  htmlSensorEvents.innerHTML = htmlSensorEventsString;
}

const showServes = (json) => {
  console.log(json)
  let serves = json.serves

  let htmlServesString = ``;

  for (let serve of serves) {
    htmlServesString += `<tr>
                    <td>${serve.serve_id}</td>
                    <td>${serve.speler_id}</td>
                    <td>${serve.match_id}</td>
                    <td>${serve.start_tijd}</td>
                    <td>${serve.eind_tijd}</td>
                </tr>`
  }

  htmlServes.innerHTML = htmlServesString;
}

const showSpelers = (json) => {
  console.log(json)
  let spelers = json.spelers

  let htmlSpelersString = ``;

  for (let speler of spelers) {
    htmlSpelersString += `<tr>
                    <td>${speler.speler_id}</td>
                    <td>${speler.naam}</td>
                    <td>${speler.voornaam}</td>
                    <td>${speler.rugnummer}</td>
                    <td>${speler.positie}</td>
                    <td>${speler.active}</td>
                </tr>`
  }

  htmlSpelers.innerHTML = htmlSpelersString;
}

const showSettings = (json) => {
  console.log(json)
  let settings = json.instellingen

  let htmlSettingsString = ``;

  for (let setting of settings) {
    htmlSettingsString += `<tr>
                    <td>${setting.instelling_id}</td>
                    <td>${setting.naam}</td>
                    <td>${setting.value}</td>
                </tr>`
  }

  htmlSettings.innerHTML = htmlSettingsString;
}
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
const getDevices = async () => {
  const url = `${API}/devices`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showDevices(json);
}

const getDeviceTypes = async () => {
  const url = `${API}/devicetypes`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showDeviceTypes(json);
}

const getMatchen = async () => {
  const url = `${API}/matchen`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showMatchen(json);
}

const getOpstellingen = async () => {
  const url = `${API}/opstelling`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));
  
  showOpstellingen(json);
}

const getSensorEvents = async () => {
  const url = `${API}/sensorevents`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showSensorEvents(json);
}

const getServes = async () => {
  const url = `${API}/serves`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showServes(json);
}

const getSpelers = async () => {
  const url = `${API}/spelers`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showSpelers(json);
}

const getSettings = async () => {
  const url = `${API}/instellingen`;
  const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
  const json = await response.json().catch((err) => console.error('JSON-error:', err));

  showSettings(json);
}
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

const listenToSocketDatabase = () => {
  socketio.on('B2F_verandering_database', (jsonObject) => {
    getSensorEvents();
    getServes();
  });
};

// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
  console.info('DOM geladen');

  htmlDevices = document.querySelector('.js-devices');
  htmlDeviceTypes = document.querySelector('.js-device_types');
  htmlMatchen = document.querySelector('.js-matchen');
  htmlOpstellingen = document.querySelector('.js-opstellingen');
  htmlSensorEvents = document.querySelector('.js-sensorevents');
  htmlServes = document.querySelector('.js-serves');
  htmlSpelers = document.querySelector('.js-spelers');
  htmlSettings = document.querySelector('.js-settings');

  htmlDashboard = document.querySelector('.js-dashboard');
  htmlDatabase = document.querySelector('.js-database');

  if (htmlDashboard) {
    listenToSocket();
  };

  if (htmlDatabase) {
    getDevices();
    getDeviceTypes();
    getMatchen();
    getOpstellingen();
    getSensorEvents();
    getServes();
    getSpelers();
    getSettings();
    listenToSocketDatabase();
  };
};

document.addEventListener('DOMContentLoaded', init);

// #endregion