'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);
const API = `http://${lanIP}/api/v1`;

// #region ***  DOM references                           ***********
let htmlMatchTitel, htmlMatchInfo, htmlDetailServes, htmlDetailFouten, htmlDetailPercentage, htmlServesPerSpeler, htmlFoutenPerSpeler, htmlDetailServesTable;

let matchId;
let match;
let spelers = [];
let serves = [];
// #endregion

const getMatchIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('matchId');
};

const formatDatum = (datum) => {
    const date = new Date(datum);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatTijd = (tijd) => {
    const date = new Date(tijd.replace(' ', 'T'));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

const berekenDuur = (startTijd, eindTijd) => {
    const start = new Date(startTijd.replace(' ', 'T'));
    const einde = new Date(eindTijd.replace(' ', 'T'));
    return (einde - start) / 1000;
};

const isFout = (serve) => {
    return berekenDuur(serve.start_tijd, serve.eind_tijd) > 8;
};

const getSpelerById = (spelerId) => {
    return spelers.find((speler) => Number(speler.speler_id) === Number(spelerId));
};

// #region ***  Callback-Visualisation - show___         ***********
const showMatch = (json) => {
    match = json;
    showDetailPage();
};

const showSpelers = (json) => {
    spelers = json.spelers;
    showDetailPage();
};

const showServes = (json) => {
    serves = json.serves;
    showDetailPage();
};

const showMatchInfo = () => {
    const aantalServes = serves.length;
    const aantalFouten = serves.filter((serve) => isFout(serve)).length;
    const percentage = aantalServes > 0 ? (aantalFouten / aantalServes) * 100 : 0;

    htmlMatchTitel.innerHTML = `Match ${match.match_id}`;
    htmlMatchInfo.innerHTML = `${formatDatum(match.datum)} · ${aantalServes} serves · ${aantalFouten} voetfouten`;

    htmlDetailServes.innerHTML = aantalServes;
    htmlDetailFouten.innerHTML = aantalFouten;
    htmlDetailPercentage.innerHTML = `${percentage.toFixed(1)}%`;
};

const showPlayerBars = () => {
    let spelerStats = [];

    for (const speler of spelers) {
        const servesVanSpeler = serves.filter((serve) => Number(serve.speler_id) === Number(speler.speler_id));
        const foutenVanSpeler = servesVanSpeler.filter((serve) => isFout(serve));

        if (servesVanSpeler.length > 0) {
            spelerStats.push({
                speler: speler,
                serves: servesVanSpeler.length,
                fouten: foutenVanSpeler.length
            });
        }
    }

    const maxServes = Math.max(...spelerStats.map((stat) => stat.serves), 1);
    const maxFouten = Math.max(...spelerStats.map((stat) => stat.fouten), 1);

    let htmlServesString = ``;
    let htmlFoutenString = ``;

    for (const stat of spelerStats) {
        htmlServesString += `
            <div class="c-playerbar">
                <span class="c-playerbar__name">#${stat.speler.rugnummer} ${stat.speler.voornaam}</span>
                <div class="c-playerbar__track">
                    <div class="c-playerbar__fill" style="width: ${(stat.serves / maxServes) * 100}%"></div>
                </div>
                <span class="c-playerbar__value">${stat.serves}</span>
            </div>`;

        htmlFoutenString += `
            <div class="c-playerbar">
                <span class="c-playerbar__name">#${stat.speler.rugnummer} ${stat.speler.voornaam}</span>
                <div class="c-playerbar__track">
                    <div class="c-playerbar__fill c-playerbar__fill--error" style="width: ${(stat.fouten / maxFouten) * 100}%"></div>
                </div>
                <span class="c-playerbar__value">${stat.fouten}</span>
            </div>`;
    }

    htmlServesPerSpeler.innerHTML = htmlServesString;
    htmlFoutenPerSpeler.innerHTML = htmlFoutenString;
};

const showServesTable = () => {
    let htmlString = ``;
    let teller = 1;

    for (const serve of serves) {
        const speler = getSpelerById(serve.speler_id);
        const duur = berekenDuur(serve.start_tijd, serve.eind_tijd);
        const fout = isFout(serve);

        htmlString += `
            <tr>
                <td>${teller}</td>
                <td>${speler ? `#${speler.rugnummer} ${speler.voornaam}` : serve.speler_id}</td>
                <td>${duur.toFixed(1)}s</td>
                <td><span class="c-badge ${fout ? 'c-badge--error' : 'c-badge--success'}">${fout ? 'Fout' : 'Geen'}</span></td>
                <td>${formatTijd(serve.eind_tijd)}</td>
            </tr>`;

        teller++;
    }

    htmlDetailServesTable.innerHTML = htmlString;
};

const showDetailPage = () => {
    if (!match || spelers.length === 0) {
        return;
    }

    showMatchInfo();
    showPlayerBars();
    showServesTable();
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getMatch = async () => {
    const url = `${API}/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showMatch(json);
};

const getSpelers = async () => {
    const url = `${API}/spelers`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showSpelers(json);
};

const getServes = async () => {
    const url = `${API}/serves/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));

    if (!response || response.status === 404) {
        showServes({ serves: [] });
        return;
    }

    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showServes(json);
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('Match detail pagina geladen');

    htmlMatchTitel = document.querySelector('.js-matchtitel');
    htmlMatchInfo = document.querySelector('.js-matchinfo');
    htmlDetailServes = document.querySelector('.js-detail-serves');
    htmlDetailFouten = document.querySelector('.js-detail-fouten');
    htmlDetailPercentage = document.querySelector('.js-detail-percentage');
    htmlServesPerSpeler = document.querySelector('.js-serves-per-speler');
    htmlFoutenPerSpeler = document.querySelector('.js-fouten-per-speler');
    htmlDetailServesTable = document.querySelector('.js-detail-serves-table');

    matchId = getMatchIdFromUrl();

    getMatch();
    getSpelers();
    getServes();
};

document.addEventListener('DOMContentLoaded', init);
// #endregion