'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://${lanIP}/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let serveActief = false;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToStartServe = () => {
    const htmlStartServe = document.querySelector('.js-start-serve');

    htmlStartServe.addEventListener('click', () => {

        serveActief = !serveActief;

        if (serveActief) {
            htmlStartServe.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-square-icon lucide-square">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                </svg> Stop Serve`;
        } else {
            htmlStartServe.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-play-icon lucide-play">
                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                </svg> Start Serve`;
        };

    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.log('Live match pagina geladen');

    listenToStartServe();
}

document.addEventListener('DOMContentLoaded',init);
// #endregion