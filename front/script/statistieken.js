'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);
const API = `http://${lanIP}/api/v1`;

// #region ***  DOM references                           ***********
let htmlAantalServes, htmlAantalFouten, htmlFoutPercentage;
let htmlFilterSpeler, htmlFilterMatch, htmlMatchenTable;
let htmlChartTrend, htmlChartSpelers;

let spelers = [];
let matchen = [];
let serves = [];
let chartTrend;
let chartSpelers;
// #endregion

const berekenDuur = (startTijd, eindTijd) => {
    const start = new Date(startTijd.replace(' ', 'T'));
    const einde = new Date(eindTijd.replace(' ', 'T'));

    return (einde - start) / 1000;
};

const isFout = (serve) => {
    return berekenDuur(serve.start_tijd, serve.eind_tijd) > 8;
};

const formatDatum = (datum) => {
    const date = new Date(datum);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const getSpelerById = (spelerId) => {
    return spelers.find((speler) => Number(speler.speler_id) === Number(spelerId));
};

const getMatchById = (matchId) => {
    return matchen.find((match) => Number(match.match_id) === Number(matchId));
};

// #region ***  Callback-Visualisation - show___         ***********
const showFilters = () => {
    let htmlSpelersString = `<option value="all">Alle spelers</option>`;
    let htmlMatchenString = `<option value="all">Alle matchen</option>`;

    for (const speler of spelers) {
        htmlSpelersString += `<option value="${speler.speler_id}">#${speler.rugnummer} ${speler.voornaam} ${speler.naam}</option>`;
    }

    for (const match of matchen) {
        htmlMatchenString += `<option value="${match.match_id}">${formatDatum(match.datum)} - Match ${match.match_id}</option>`;
    }

    htmlFilterSpeler.innerHTML = htmlSpelersString;
    htmlFilterMatch.innerHTML = htmlMatchenString;
};

const showStatistieken = () => {
    const spelerFilter = htmlFilterSpeler.value;
    const matchFilter = htmlFilterMatch.value;

    let gefilterdeServes = serves;

    if (spelerFilter !== 'all') {
        gefilterdeServes = gefilterdeServes.filter((serve) => Number(serve.speler_id) === Number(spelerFilter));
    }

    if (matchFilter !== 'all') {
        gefilterdeServes = gefilterdeServes.filter((serve) => Number(serve.match_id) === Number(matchFilter));
    }

    const aantalServes = gefilterdeServes.length;
    const aantalFouten = gefilterdeServes.filter((serve) => isFout(serve)).length;

    let percentage = 0;

    if (aantalServes > 0) {
        percentage = (aantalFouten / aantalServes) * 100;
    }

    htmlAantalServes.innerHTML = aantalServes;
    htmlAantalFouten.innerHTML = aantalFouten;
    htmlFoutPercentage.innerHTML = `${percentage.toFixed(1)}%`;

    showTrendGrafiek();
    showSpelersGrafiek();
    showMatchenTable();
};

const showTrendGrafiek = () => {
    const spelerFilter = htmlFilterSpeler.value;

    let trendServes = serves;

    if (spelerFilter !== 'all') {
        trendServes = trendServes.filter((serve) => Number(serve.speler_id) === Number(spelerFilter));
    }

    const labels = [];
    const data = [];

    for (const match of matchen) {
        const servesVanMatch = trendServes.filter((serve) => Number(serve.match_id) === Number(match.match_id));
        const foutenVanMatch = servesVanMatch.filter((serve) => isFout(serve)).length;

        labels.push(formatDatum(match.datum));
        data.push(foutenVanMatch);
    }

    const options = {
        chart: {
            type: 'line',
            height: 260,
            toolbar: {
                show: false
            }
        },
        colors: ['#F2C41C'],
        series: [
            {
                name: 'Voetfouten',
                data: data
            }
        ],
        xaxis: {
            categories: labels
        },
        yaxis: {
            min: 0,
            forceNiceScale: true
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        markers: {
            size: 4
        }
    };

    if (chartTrend) {
        chartTrend.updateOptions(options);
    } else {
        chartTrend = new ApexCharts(htmlChartTrend, options);
        chartTrend.render();
    }
};

const showSpelersGrafiek = () => {
    const matchFilter = htmlFilterMatch.value;
    const spelerFilter = htmlFilterSpeler.value;

    let grafiekServes = serves;

    if (matchFilter !== 'all') {
        grafiekServes = grafiekServes.filter((serve) => Number(serve.match_id) === Number(matchFilter));
    }

    if (spelerFilter !== 'all') {
        grafiekServes = grafiekServes.filter((serve) => Number(serve.speler_id) === Number(spelerFilter));
    }

    const labels = [];
    const data = [];

    for (const speler of spelers) {
        if (spelerFilter !== 'all' && Number(speler.speler_id) !== Number(spelerFilter)) {
            continue;
        }

        const servesVanSpeler = grafiekServes.filter((serve) => Number(serve.speler_id) === Number(speler.speler_id));
        const foutenVanSpeler = servesVanSpeler.filter((serve) => isFout(serve)).length;

        if (foutenVanSpeler > 0 || spelerFilter !== 'all') {
            labels.push(speler.voornaam);
            data.push(foutenVanSpeler);
        }
    }

    const options = {
        chart: {
            type: 'bar',
            height: 260,
            toolbar: {
                show: false
            }
        },
        colors: ['#F2C41C'],
        series: [
            {
                name: 'Voetfouten',
                data: data
            }
        ],
        xaxis: {
            categories: labels
        },
        yaxis: {
            min: 0,
            forceNiceScale: true
        },
        plotOptions: {
            bar: {
                borderRadius: 6
            }
        }
    };

    if (chartSpelers) {
        chartSpelers.updateOptions(options);
    } else {
        chartSpelers = new ApexCharts(htmlChartSpelers, options);
        chartSpelers.render();
    }
};

const showMatchenTable = () => {
    const spelerFilter = htmlFilterSpeler.value;
    const matchFilter = htmlFilterMatch.value;

    let htmlString = ``;

    for (const match of matchen) {
        if (matchFilter !== 'all' && Number(match.match_id) !== Number(matchFilter)) {
            continue;
        }

        let servesVanMatch = serves.filter((serve) => Number(serve.match_id) === Number(match.match_id));

        if (spelerFilter !== 'all') {
            servesVanMatch = servesVanMatch.filter((serve) => Number(serve.speler_id) === Number(spelerFilter));
        }

        const aantalServes = servesVanMatch.length;
        const aantalFouten = servesVanMatch.filter((serve) => isFout(serve)).length;

        let foutPercentage = 0;

        if (aantalServes > 0) {
            foutPercentage = (aantalFouten / aantalServes) * 100;
        }

        htmlString += `
            <tr>
                <td>${formatDatum(match.datum)}</td>
                <td>${aantalServes}</td>
                <td>${aantalFouten}</td>
                <td>${foutPercentage.toFixed(1)}%</td>
                <td><a class="c-table__detail" href="matchdetails.html?matchId=${match.match_id}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-search-icon lucide-search">
                                            <path d="m21 21-4.34-4.34" />
                                            <circle cx="11" cy="11" r="8" />
                                        </svg> Detail
                                    </a></td>
            </tr>`;
    }

    htmlMatchenTable.innerHTML = htmlString;
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getSpelers = async () => {
    const url = `${API}/actievespelers`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    spelers = json.spelers;
};

const getMatchen = async () => {
    const url = `${API}/matchen`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    matchen = json.matchen;
};

const getServes = async () => {
    const url = `${API}/serves`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    serves = json.serves;
};
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToFilters = () => {
    htmlFilterSpeler.addEventListener('change', () => {
        showStatistieken();
    });

    htmlFilterMatch.addEventListener('change', () => {
        showStatistieken();
    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = async () => {
    console.info('Statistieken pagina geladen');

    htmlAantalServes = document.querySelector('.js-aantal-serves');
    htmlAantalFouten = document.querySelector('.js-aantal-fouten');
    htmlFoutPercentage = document.querySelector('.js-fout-percentage');

    htmlFilterSpeler = document.querySelector('.js-filter-speler');
    htmlFilterMatch = document.querySelector('.js-filter-match');
    htmlMatchenTable = document.querySelector('.js-matchen-table');

    htmlChartTrend = document.querySelector('.js-chart-trend');
    htmlChartSpelers = document.querySelector('.js-chart-spelers');

    await getSpelers();
    await getMatchen();
    await getServes();

    showFilters();
    showStatistieken();
    listenToFilters();
};

document.addEventListener('DOMContentLoaded', init);

// #endregion