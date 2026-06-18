'use strict';

// #region ***  DOM references                           ***********
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToHamburgerMenu = () => {
    const header = document.querySelector('.c-header');
    const button = document.querySelector('.c-header__menu');

    if (!header || !button) return;

    button.addEventListener('click', () => {
      console.log('Test');
        header.classList.toggle('is-open');
    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const initAlgemeen = () => {
  console.info('DOM geladen');

  listenToHamburgerMenu();

};

document.addEventListener('DOMContentLoaded', initAlgemeen);

// #endregion