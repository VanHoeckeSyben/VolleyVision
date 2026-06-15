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

const showSaveSettings = (json) => {
    htmlSettingsFeedback.innerHTML = 'Instellingen opgeslagen';

    setTimeout(() => {
        htmlSettingsFeedback.innerHTML = '';
    }, 3000);
};

const showSensorUpdate = (json) => {
    const htmlSensor = document.querySelector(`.js-sensorvalue[data-sensor="${json.sensornaam}"]`);

    if (htmlSensor) {
        htmlSensor.innerHTML = `Huidige waarde: ${json.value}`;
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
    const body = JSON.stringify({
        instellingen: [
            {
                instelling_id: htmlDrukDrempel.dataset.settingid,
                value: htmlDrukDrempel.value
            },
            {
                instelling_id: htmlGeluidDrempel.dataset.settingid,
                value: htmlGeluidDrempel.value
            },
            {
                instelling_id: htmlLedAan.dataset.settingid,
                value: htmlLedAan.checked
            },
            {
                instelling_id: htmlServeTijdslimiet.dataset.settingid,
                value: htmlServeTijdslimiet.value
            },
            {
                instelling_id: htmlSpeakerAan.dataset.settingid,
                value: htmlSpeakerAan.checked
            }
        ]
    });

    const url = `${API}/instellingen`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showSaveSettings(json);
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
        htmlShutdownModal.classList.add('u-active');
    });

    htmlCloseShutdown.forEach((button) => {
        button.addEventListener('click', () => {
            htmlShutdownModal.classList.remove('u-active');
        });
    });

    htmlConfirmShutdown.addEventListener('click', () => {
        getShutdownPi();
        htmlShutdownModal.classList.remove('u-active');
    });
};

const listenToSocket = () => {

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