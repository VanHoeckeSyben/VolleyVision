'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://${lanIP}/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let htmlMiniChart, htmlLiveMatch, htmlNieuweMatch;

let matchen = [];
let serves = [];
let miniChart;
// #endregion

const berekenDuur = (startTijd, eindTijd) => {
    const start = new Date(startTijd.replace(' ', 'T'));
    const einde = new Date(eindTijd.replace(' ', 'T'));

    return (einde - start) / 1000;
};

const isFout = (serve) => {
    return berekenDuur(serve.start_tijd, serve.eind_tijd) > 8;
};

// #region ***  Callback-Visualisation - show___         ***********
const showMatchen = (json) => {
    matchen = json.matchen;
    showDashboard();
};

const showServes = (json) => {
    serves = json.serves;
    showDashboard();
};

const showDashboard = () => {
    if (!htmlMiniChart || matchen.length === 0) {
        return;
    }

    showMiniChart();
};

const showMiniChart = () => {
    const laatsteMatchen = [...matchen]
        .sort((a, b) => new Date(a.datum) - new Date(b.datum))
        .slice(-6);

    const data = [];

    for (const match of laatsteMatchen) {
        const fouten = serves.filter(
            (serve) =>
                Number(serve.match_id) === Number(match.match_id) &&
                isFout(serve)
        ).length;

        data.push(fouten);
    }

    const options = {
        chart: {
            type: 'line',
            height: 80,
            sparkline: {
                enabled: true
            },
            toolbar: {
                show: false
            },
            fontFamily: 'Inter, sans-serif'
        },
        series: [
            {
                name: 'Voetfouten',
                data: data
            }
        ],
        stroke: {
            width: 3,
            curve: 'smooth'
        },
        colors: ['#F2C41C'],
        tooltip: {
            enabled: true
        }
    };

    if (miniChart) {
        miniChart.updateOptions(options);
    } else {
        miniChart = new ApexCharts(htmlMiniChart, options);
        miniChart.render();
    }
};

const showLiveMatch = (json) => {
    htmlLiveMatch.classList.add('u-active');
    htmlNieuweMatch.classList.add('u-disabled');
    htmlLiveMatch.href = `livematch.html?matchId=${json.match_id}`;
};

const showLastMatch = (json) => {
    console.log(json)
    if (json.active) {
        htmlLiveMatch.classList.add('u-active');
        htmlNieuweMatch.classList.add('u-disabled');
        htmlLiveMatch.href = `livematch.html?matchId=${json.match_id}`;
    } else {
        htmlLiveMatch.classList.remove('u-active');
        htmlNieuweMatch.classList.remove('u-disabled');
    }
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getMatchen = async () => {
    const url = `${API}/matchen`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showMatchen(json);
};

const getServes = async () => {
    const url = `${API}/serves`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));

    if (!response || response.status === 404) {
        showServes({ serves: [] });
        return;
    }

    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showServes(json);
};

const getLastMatch = async () => {
    const url = `${API}/lastmatch`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showLastMatch(json);
}
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToSocket = () => {

    socketio.on('B2F_nieuwe_match', (json) => {
        showLiveMatch(json);
    });

    socketio.on('B2F_stop_match', (json) => {
        htmlLiveMatch.classList.remove('u-active');
        htmlNieuweMatch.classList.remove('u-disabled');
    })
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('Dashboard pagina geladen');

    htmlMiniChart = document.querySelector('.js-mini-chart');
    htmlLiveMatch = document.querySelector('.js-livematch');
    htmlNieuweMatch = document.querySelector('.js-nieuwematch');

    getLastMatch();

    if (htmlMiniChart) {
        getMatchen();
        getServes();
    }

    listenToSocket()
};

document.addEventListener('DOMContentLoaded', init);
// #endregion