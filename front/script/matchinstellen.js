'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://${lanIP}/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let htmlVeldPositie, htmlStartMatch, htmlOpslagToggle, htmlPloegOpslag;
let opslag_wij = 0;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showSpelers = (json) => {
    console.log(json);
    const spelers = json.spelers;
    let htmlSpelersString = ``;

    for (const speler of spelers) {
        htmlSpelersString += `<option value="${speler.speler_id}">${speler.rugnummer} - ${speler.voornaam} ${speler.naam}</option>`;
    };

    htmlVeldPositie.forEach(select => {
        select.insertAdjacentHTML('beforeend', htmlSpelersString);
    });
};

const showUpdateDropdowns = () => {
    const gekozenSpelers = [];

    htmlVeldPositie.forEach(select => {
        if (select.value !== '') {
            gekozenSpelers.push(select.value);
        }
    });

    htmlVeldPositie.forEach(select => {
        [...select.options].forEach(option => {
            option.disabled = false;
        });
    });

    htmlVeldPositie.forEach(select => {
        [...select.options].forEach(option => {
            if (
                gekozenSpelers.includes(option.value) &&
                option.value !== select.value &&
                option.value !== ''
            ) {
                option.disabled = true;
            }
        });
    });
};
// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
const getSpelers = async () => {
    const url = `${API}/actievespelers`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));
    
    showSpelers(json);
}

const getPostMatch = async () => {
    const body = JSON.stringify({
        locatie: 'Sporthal De Warande (Wetteren)',
        opslag_wij: opslag_wij
    });
    const url = `${API}/matchen`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    return json.match_id;
};

const getPostOpstelling = async (matchId, spelerId, veldPositie) => {
    const body = JSON.stringify({
        match_id: matchId,
        speler_id: spelerId,
        veld_positie: veldPositie
    });
    const url = `${API}/opstelling`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    return json;
};
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToDropdowns = () => {
    htmlVeldPositie.forEach(select => {
        select.addEventListener('change', showUpdateDropdowns);
    });
};

const listenToStartMatch = () => {
    htmlStartMatch.addEventListener('click', async () => {

        const allePositiesIngevuld = [...htmlVeldPositie].every(
            select => select.value !== ''
        );

        if (!allePositiesIngevuld) {
            alert('Selecteer eerst 6 spelers.');
            return;
        }

        try {
            const matchId = await getPostMatch();

            if (!matchId) {
                throw new Error('Match kon niet aangemaakt worden');
            }

            for (const select of htmlVeldPositie) {
                const spelerId = select.value;
                const veldPositie = select.dataset.positie;

                const response = await getPostOpstelling(
                    matchId,
                    spelerId,
                    veldPositie
                );

                if (!response) {
                    throw new Error('Opstelling kon niet aangemaakt worden');
                }
            }

            window.location.href = `livematch.html?matchId=${matchId}`;

        } catch (error) {
            console.error(error);
            alert('Er is iets misgelopen bij het aanmaken van de match.');
        }
    });
};

const listenToOpslagToggle = () => {
    htmlOpslagToggle.addEventListener('change', () => {

        if (htmlOpslagToggle.checked) {
            htmlPloegOpslag.innerHTML = 'Wij';
            opslag_wij = 1;
        } else {
            htmlPloegOpslag.innerHTML = 'Tegenstander';
            opslag_wij = 0;
        }

    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('Match instellen pagina geladen');
    htmlVeldPositie = document.querySelectorAll('.js-veldpositie');
    htmlStartMatch = document.querySelector('.c-startmatch');
    htmlOpslagToggle = document.querySelector('.js-opslag-toggle');
    htmlPloegOpslag = document.querySelector('.js-ploeg-opslag')

    getSpelers();
    listenToDropdowns();
    listenToStartMatch();
    listenToOpslagToggle();
}

document.addEventListener('DOMContentLoaded',init);
// #endregion