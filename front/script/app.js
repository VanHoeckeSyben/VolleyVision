'use strict';

// #region ***  DOM references                           ***********
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showOngoingMatch = (json) => {
  if (json.active) {
    document.querySelector('.js-livematchmenu').href = `livematch.html?matchId=${json.match_id}`;
  };
};
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
const getOngoingMatch = async () => {
    const url = `${API}/lastmatch`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showOngoingMatch(json);
}
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

const listenToLiveMatch = () => {
  socketio.on('B2F_nieuwe_match', (json) => {

    document.querySelector('.js-livematchmenu').href = `livematch.html?matchId=${json.match_id}`;
  });

    socketio.on('B2F_stop_match', (json) => {
      document.querySelector('.js-livematchmenu').href = `matchinstellen.html`;
  });
}
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const initAlgemeen = () => {
  console.info('DOM geladen');

  listenToHamburgerMenu();
  listenToLiveMatch();
  getOngoingMatch();

};

document.addEventListener('DOMContentLoaded', initAlgemeen);

// #endregion