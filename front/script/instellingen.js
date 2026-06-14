'use strict';


const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);
const API = `http://${lanIP}/api/v1`;

// #region ***  DOM references                           ***********
let htmlServeTijdslimiet, htmlGeluidDrempel, htmlDrukDrempel, htmlSpeakerAan, htmlLedAan, htmlSettingsFeedback, htmlShutdownModal, htmlOpenShutdown, htmlCloseShutdown, htmlConfirmShutdown;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showSettings = (json) => {
    console.log(json);
    const settings = json.instellingen;

    htmlServeTijdslimiet.value = settings[3].value;
    htmlGeluidDrempel.value = settings[1].value;
    htmlDrukDrempel.value = settings[0].value;
    htmlLedAan.checked = settings[2].value;
    htmlSpeakerAan.checked = settings[4].value;
};

const showSaveSettings = () => {
    htmlSettingsFeedback.innerHTML = 'Instellingen opgeslagen';
};

const showOpenShutdownModal = () => {
    htmlShutdownModal.classList.add('u-active');
};

const showCloseShutdownModal = () => {
    htmlShutdownModal.classList.remove('u-active');
};

const showSensorUpdate = (json) => {
    const htmlSensor = document.querySelector(`.js-sensorvalue[data-sensor="${json.sensornaam}"]`);

    if (htmlSensor) {
        htmlSensor.innerHTML = `Huidige waarde: ${json.waarde}`;
    }
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getSettings = async () => {
    const url = `${API}/instellingen`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showSettings(json);
}

const getSaveSettings = async () => {
    const url = ``;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));
};

const getShutdownPi = async () => {
    const url = `${API}/system/shutdown`;

    const response = await fetch(url, {
        method: 'POST'
    }).catch((err) => console.error('Fetch-error:', err));

    console.log(response);
};
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToSaveSettings = () => {
    document.querySelector('.js-save-settings').addEventListener('click', () => {
        getSaveSettings();
    });
};

const listenToShutdown = () => {
    htmlOpenShutdown.addEventListener('click', () => {
        showOpenShutdownModal();
    });

    htmlCloseShutdown.forEach((button) => {
        button.addEventListener('click', () => {
            showCloseShutdownModal();
        });
    });

    htmlConfirmShutdown.addEventListener('click', () => {
        getShutdownPi();
        showCloseShutdownModal();
    });
};

const listenToSocket = () => {
    const socketio = io(`${window.location.hostname}:8000`);

    socketio.on('B2F_verandering_sensoren', (json) => {
        showSensorUpdate(json);
    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('Instellingen pagina geladen');

    htmlServeTijdslimiet = document.querySelector('.js-serve-tijdslimiet');
    htmlGeluidDrempel = document.querySelector('.js-geluid-drempel');
    htmlDrukDrempel = document.querySelector('.js-druk-drempel');
    htmlSpeakerAan = document.querySelector('.js-speaker-aan');
    htmlLedAan = document.querySelector('.js-led-aan');

    htmlSettingsFeedback = document.querySelector('.js-settings-feedback');

    htmlShutdownModal = document.querySelector('.js-shutdown-modal');
    htmlOpenShutdown = document.querySelector('.js-open-shutdown');
    htmlCloseShutdown = document.querySelectorAll('.js-close-shutdown');
    htmlConfirmShutdown = document.querySelector('.js-confirm-shutdown');

    getSettings();

    listenToSaveSettings();
    listenToShutdown();
    listenToSocket();
};

document.addEventListener('DOMContentLoaded', init);
// #endregion