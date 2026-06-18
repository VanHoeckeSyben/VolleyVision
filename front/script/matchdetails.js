'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);
const API = `http://${lanIP}/api/v1`;

// #region ***  DOM references                           ***********
let htmlMatchTitel, htmlMatchInfo, htmlDetailServes, htmlDetailFouten, htmlDetailPercentage, htmlServesPerSpeler, htmlFoutenPerSpeler, htmlDetailServesTable;

let matchId;
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
    if (!tijd) {
        return 'Bezig';
    }

    const date = new Date(tijd.replace(' ', 'T'));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

const isFout = (serve) => {
    return Number(serve.voetfout) === 1;
};

const getSpelerById = (spelerId) => {
    return spelers.find((speler) => Number(speler.speler_id) === Number(spelerId));
};

// #region ***  Callback-Visualisation - show___         ***********
const showMatchInfo = (json) => {
    htmlMatchTitel.innerHTML = `Match ${json.match_id}`;
    htmlMatchInfo.innerHTML = `${formatDatum(json.datum)}`;
};

const showServeInfo = (json) => {
    const serves = json.match_serves;
    const aantalServes = serves.length;
    const aantalFouten = serves.filter((serve) => isFout(serve)).length;
    const percentage = aantalServes > 0 ? (aantalFouten / aantalServes) * 100 : 0;

    htmlDetailServes.innerHTML = aantalServes;
    htmlDetailFouten.innerHTML = aantalFouten;
    htmlDetailPercentage.innerHTML = `${percentage.toFixed(1)} %`;
}

const showPlayerBars = (json) => {
    const serves = json.match_serves;
    const spelerStats = [];

    for (const serve of serves) {
        let stat = spelerStats.find((item) => Number(item.speler_id) === Number(serve.speler_id));

        if (!stat) {
            stat = {
                speler_id: serve.speler_id,
                rugnummer: serve.speler_rugnr,
                voornaam: serve.speler_voornaam,
                naam: serve.speler_naam,
                serves: 0,
                fouten: 0
            };

            spelerStats.push(stat);
        }

        stat.serves++;

        if (Number(serve.voetfout) === 1) {
            stat.fouten++;
        }
    }

    const maxServes = Math.max(...spelerStats.map((stat) => stat.serves), 1);
    const maxFouten = Math.max(...spelerStats.map((stat) => stat.fouten), 1);

    let htmlServesString = ``;
    let htmlFoutenString = ``;

    for (const stat of spelerStats) {
        htmlServesString += `
            <div class="c-playerbar">
                <span class="c-playerbar__name">#${stat.rugnummer} ${stat.voornaam}</span>
                <div class="c-playerbar__track">
                    <div class="c-playerbar__fill" style="width: ${(stat.serves / maxServes) * 100}%"></div>
                </div>
                <span class="c-playerbar__value">${stat.serves}</span>
            </div>`;

        htmlFoutenString += `
            <div class="c-playerbar">
                <span class="c-playerbar__name">#${stat.rugnummer} ${stat.voornaam}</span>
                <div class="c-playerbar__track">
                    <div class="c-playerbar__fill c-playerbar__fill--error" style="width: ${(stat.fouten / maxFouten) * 100}%"></div>
                </div>
                <span class="c-playerbar__value">${stat.fouten}</span>
            </div>`;
    }

    htmlServesPerSpeler.innerHTML = htmlServesString;
    htmlFoutenPerSpeler.innerHTML = htmlFoutenString;
};

const showServeLogs = (json) => {
    const serves = json.match_serves;
    let htmlString = ``;
    let fout = '';
    
    for (let serve of serves) {
        if (serve.voetfout === 1) {
            fout = 'Voetfout';
        } else {
            fout = 'Geen';
        };

        htmlString += `<tr>
                <td>${serve.serve_id}</td>
                <td>${serve.speler_rugnr} - ${serve.speler_voornaam} ${serve.speler_naam}</td>
                <td><span class="c-badge ${fout === 'Voetfout' ? 'c-badge--error' : 'c-badge--success'}">${fout}</span></td>
                <td>${formatTijd(serve.start_tijd)}</td>
            </tr>`;
    };

    htmlDetailServesTable.innerHTML = htmlString;
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getMatch = async () => {
    const url = `${API}/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showMatchInfo(json);
};

const getServes = async () => {
    const url = `${API}/serves/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showServeLogs(json);
    showServeInfo(json);
    showPlayerBars(json);
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
    getServes();
};

document.addEventListener('DOMContentLoaded', init);
// #endregion