'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://127.0.0.1:8000/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let htmlModal;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToClickEvent = () => {
    const modalButton = document.querySelector('.js-addspeler');
    modalButton.addEventListener('click', (e) => {
        htmlModal.classList.add('c-modalactive');
    });

    const cancelButtons = document.querySelectorAll('.js-modal-sluit');
    for (const cancelButton of cancelButtons) {
    cancelButton.addEventListener('click', (e) => {
        htmlModal.classList.remove('c-modalactive');
    });
  }
}
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('DOM geladen');
    htmlModal = document.querySelector('.js-modal');

    listenToClickEvent();
}

document.addEventListener('DOMContentLoaded',init);
// #endregion