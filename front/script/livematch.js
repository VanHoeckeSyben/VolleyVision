'use strict';

const lanIP = `${window.location.hostname}:8000`;
const socketio = io(lanIP);
const API = `http://${lanIP}/api/v1`;

// #region ***  DOM references                           ***********
let htmlVorigeServerNummer, htmlVorigeServerNaam, htmlHuidigeServerNummer, htmlHuidigeServerNaam;
let htmlVolgendeServerNummer, htmlVolgendeServerNaam, htmlVorigeServerBtn, htmlVolgendeServerBtn;
let htmlStartServe, htmlServeTijd, htmlServeProgress, htmlVoetfoutStatus, htmlServeStatus, htmlServeLog;
let htmlOpenWissel, htmlWisselModal, htmlCloseWissel, htmlSpelersVeld, htmlSpelersBank, htmlBevestigWissel, htmlServeLimiet;

let matchId;
let matchData;
let opstelling = [];
let actieveSpelers = [];
let serveActief = false;
let serveTimer;
let serveTeller = 0;
let serveStartTijd;
let geselecteerdeVeldSpeler = null;
let geselecteerdeBankSpeler = null;
let serveStartTimestamp = null;

let opslagGedaan = false;
let isTerugGegaan = false;
let magServeOpslaan = false;
let stopVerstuurd = false;
let serveLimiet = 0;
// #endregion

const formatDateTimeForApi = (date) => {
    const jaar = date.getFullYear();
    const maand = String(date.getMonth() + 1).padStart(2, '0');
    const dag = String(date.getDate()).padStart(2, '0');
    const uur = String(date.getHours()).padStart(2, '0');
    const minuten = String(date.getMinutes()).padStart(2, '0');
    const seconden = String(date.getSeconds()).padStart(2, '0');

    return `${jaar}-${maand}-${dag} ${uur}:${minuten}:${seconden}`;
};

const serveStart = (startTimeStamp) => {
    if (!serveActief) {
        serveActief = true;
        stopVerstuurd = false;
        serveStartTimestamp = Date.now();
        serveStartTijd = new Date(startTimeStamp);

        showStopServeButton();

        serveTimer = setInterval(() => {
            serveTeller = (Date.now() - serveStartTimestamp) / 1000;

            showServeTimer();
        }, 100);
    };
}

const serveStop = async () => {
    if (!serveActief) {
        return;
    }

    serveActief = false;
    clearInterval(serveTimer);

    serveTeller = 0;
    stopVerstuurd = false;

    showStartServeButton();

    opslagGedaan = true;
    magServeOpslaan = false;

    await getServesByMatch();
};

// #region ***  Callback-Visualisation - show___         ***********
const showServers = () => {
    const vorigeServer = getSpelerOpPositie(6);
    const huidigeServer = getSpelerOpPositie(1);
    const volgendeServer = getSpelerOpPositie(2);

    if (!vorigeServer || !huidigeServer || !volgendeServer) {
        console.error('Niet genoeg spelers op positie 1, 2 en 6 gevonden');
        return;
    }

    htmlVorigeServerNummer.innerHTML = `#${vorigeServer.rugnummer}`;
    htmlVorigeServerNaam.innerHTML = vorigeServer.voornaam;

    htmlHuidigeServerNummer.innerHTML = `#${huidigeServer.rugnummer}`;
    htmlHuidigeServerNaam.innerHTML = huidigeServer.voornaam;

    htmlVolgendeServerNummer.innerHTML = `#${volgendeServer.rugnummer}`;
    htmlVolgendeServerNaam.innerHTML = volgendeServer.voornaam;
};

const showServeTimer = () => {
    htmlServeTijd.innerHTML = `${serveTeller.toFixed(1)}s`;

    let percentage = (serveTeller / serveLimiet) * 100;

    if (percentage > 100) {
        percentage = 100;
    }

    htmlServeProgress.style.width = `${percentage}%`;
};

const showStartServeButton = () => {
    htmlStartServe.classList.remove('c-startserve--actief');

    htmlStartServe.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
            viewBox="0 0 24 24" fill="none" stroke="currentColor" 
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
        </svg>
        Start Serve`;
};

const showStopServeButton = () => {
    htmlStartServe.classList.add('c-startserve--actief');

    htmlStartServe.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
            viewBox="0 0 24 24" fill="none" stroke="currentColor" 
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>
        Stop Serve`;
};

const showServeStatus = (voetfout) => {
    htmlVoetfoutStatus.innerHTML = voetfout;
    htmlServeStatus.innerHTML = voetfout === 'Geen' ? 'Serve geldig' : 'Serve fout';
};

const showServeLogs = (json) => {
    let htmlString = ``;


    console.log(json)

    htmlServeLog.innerHTML = htmlString;
};

const showWisselModal = () => {
    htmlWisselModal.classList.add('u-active');
};

const showCloseWisselModal = () => {
    htmlWisselModal.classList.remove('u-active');

    geselecteerdeVeldSpeler = null;
    geselecteerdeBankSpeler = null;
};

const showWisselSpelers = () => {
    let htmlVeldString = ``;
    let htmlBankString = ``;

    const spelersOpVeld = opstelling.filter((speler) => Number(speler.veld_positie) !== 0);
    const spelerIdsInOpstelling = opstelling.map((speler) => Number(speler.speler_id));

    for (const speler of spelersOpVeld) {
        htmlVeldString += `
            <button class="c-wissel__speler js-wissel-veldspeler"
                data-spelerid="${speler.speler_id}"
                data-veldpositie="${speler.veld_positie}">
                #${speler.rugnummer} ${speler.voornaam} ${speler.naam}
            </button>`;
    }

    for (const speler of actieveSpelers) {
        const spelerInOpstelling = spelerIdsInOpstelling.includes(Number(speler.speler_id));
        const spelerOpVeld = spelersOpVeld.some((veldspeler) => Number(veldspeler.speler_id) === Number(speler.speler_id));

        if (!spelerOpVeld) {
            htmlBankString += `
                <button class="c-wissel__speler js-wissel-bankspeler"
                    data-spelerid="${speler.speler_id}"
                    data-bestaatinopstelling="${spelerInOpstelling ? 1 : 0}">
                    #${speler.rugnummer} ${speler.voornaam} ${speler.naam}
                </button>`;
        }
    }

    htmlSpelersVeld.innerHTML = htmlVeldString;
    htmlSpelersBank.innerHTML = htmlBankString;

    listenToSelectWisselSpeler();
};

const showServeLimiet = () => {
    htmlServeLimiet.innerHTML = `max. ${serveLimiet} seconden`
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getMatchIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('matchId');
};

const getSpelerOpPositie = (positie) => {
    return opstelling.find((speler) => Number(speler.veld_positie) === Number(positie));
};

const getSpelerById = (spelerId) => {
    let speler = opstelling.find((speler) => Number(speler.speler_id) === Number(spelerId));

    if (!speler) {
        speler = actieveSpelers.find((speler) => Number(speler.speler_id) === Number(spelerId));
    }

    return speler;
};

const getMatch = async () => {
    const url = `${API}/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    matchData = json;
};

const getOpstelling = async () => {
    const url = `${API}/opstelling/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    opstelling = json.Speler_opstellingen;
    opstelling.sort((a, b) => Number(a.veld_positie) - Number(b.veld_positie));
};

const getActieveSpelers = async () => {
    const url = `${API}/actievespelers`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    actieveSpelers = json.spelers;
};

const getServesByMatch = async () => {
    const url = `${API}/serves/matchen/${matchId}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showServeLogs(json);
};

const getPatchOpstelling = async (spelerId, veldPositie) => {
    const body = JSON.stringify({
        veld_positie: Number(veldPositie)
    });

    const url = `${API}/opstelling/matchen/${matchId}/spelers/${spelerId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));

    const json = await response.json().catch((err) => console.error('JSON-error:', err));
    return json;
};

const getPostOpstelling = async (spelerId, veldPositie) => {
    const body = JSON.stringify({
        match_id: Number(matchId),
        speler_id: Number(spelerId),
        veld_positie: Number(veldPositie)
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

const getRotateVolgendeServer = async () => {
    const spelersOpVeld = opstelling.filter((speler) => Number(speler.veld_positie) !== 0);

    for (const speler of spelersOpVeld) {
        let nieuwePositie = Number(speler.veld_positie) - 1;

        if (nieuwePositie === 0) {
            nieuwePositie = 6;
        }

        await getPatchOpstelling(speler.speler_id, nieuwePositie);
    }

    await getOpstelling();
    showServers();
};

const getRotateVorigeServer = async () => {
    const spelersOpVeld = opstelling.filter((speler) => Number(speler.veld_positie) !== 0);

    for (const speler of spelersOpVeld) {
        let nieuwePositie = Number(speler.veld_positie) + 1;

        if (nieuwePositie === 7) {
            nieuwePositie = 1;
        }

        await getPatchOpstelling(speler.speler_id, nieuwePositie);
    }

    await getOpstelling();
    showServers();
};

const getPatchWissel = async () => {
    const oudeVeldPositie = Number(geselecteerdeVeldSpeler.veld_positie);

    await getPatchOpstelling(geselecteerdeVeldSpeler.speler_id, 0);

    if (Number(geselecteerdeBankSpeler.bestaat_in_opstelling) === 1) {
        await getPatchOpstelling(geselecteerdeBankSpeler.speler_id, oudeVeldPositie);
    } else {
        await getPostOpstelling(geselecteerdeBankSpeler.speler_id, oudeVeldPositie);
    }

    await getOpstelling();

    showServers();
    showCloseWisselModal();
};

const getServeLimiet = async () => {
    const url = `${API}/instellingen/4`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    serveLimiet = json.value;
};

const getStopMatch = async () => {
    const body = JSON.stringify({});
    const url = `${API}/matchen/${matchId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));
}
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToStartServe = () => {
    htmlStartServe.addEventListener('click', () => {
        magServeOpslaan = true;

        if (!serveActief) {
            socketio.emit('F2B_serve_status', {'status': true});
        } else {
            socketio.emit('F2B_serve_status', {'status': false});
        }
    });
};

const listenToServerButtons = () => {
    htmlVolgendeServerBtn.addEventListener('click', async () => {
        if (opslagGedaan) {
            await getRotateVolgendeServer();
            opslagGedaan = false;
            isTerugGegaan = false;
            socketio.emit('F2B_volgende_speler', {'opslagGedaan': false, 'isTerugGegaan': false});
        };
    });

    htmlVorigeServerBtn.addEventListener('click', async () => {
        if (!opslagGedaan && !isTerugGegaan) {
            await getRotateVorigeServer();
            opslagGedaan = false;
            isTerugGegaan = true;
            socketio.emit('F2B_vorige_speler', {'opslagGedaan': false, 'isTerugGegaan': true});
        };
    });
};

const listenToWisselModal = () => {
    htmlOpenWissel.addEventListener('click', () => {
        showWisselSpelers();
        showWisselModal();
    });

    htmlCloseWissel.forEach((btn) => {
        btn.addEventListener('click', () => {
            showCloseWisselModal();
        });
    });

    htmlBevestigWissel.addEventListener('click', () => {
        if (!geselecteerdeVeldSpeler || !geselecteerdeBankSpeler) {
            alert('Selecteer eerst een veldspeler en een bankspeler.');
            return;
        }

        getPatchWissel();
    });
};

const listenToSelectWisselSpeler = () => {
    const veldButtons = document.querySelectorAll('.js-wissel-veldspeler');
    const bankButtons = document.querySelectorAll('.js-wissel-bankspeler');

    for (const btn of veldButtons) {
        btn.addEventListener('click', () => {
            veldButtons.forEach((button) => button.classList.remove('is-selected'));
            btn.classList.add('is-selected');

            geselecteerdeVeldSpeler = {
                speler_id: Number(btn.dataset.spelerid),
                veld_positie: Number(btn.dataset.veldpositie)
            };
        });
    }

    for (const btn of bankButtons) {
        btn.addEventListener('click', () => {
            bankButtons.forEach((button) => button.classList.remove('is-selected'));
            btn.classList.add('is-selected');

            geselecteerdeBankSpeler = {
                speler_id: Number(btn.dataset.spelerid),
                bestaat_in_opstelling: Number(btn.dataset.bestaatinopstelling)
            };
        });
    }
};

const listenToStopButton = () => {
    const stopButton = document.querySelector('.js-stopmatch');
    stopButton.addEventListener('click', (e) => {
        window.location.href = `index.html`;
        getStopMatch();
    })
}

const listenToSocket = () => {
    socketio.on('B2F_nieuwe_serve', () => {
        getServesByMatch();
    });

    socketio.on('B2F_serve_status', (json) => {
        if (json.status) {
            serveStart(json.startTimeStamp);
        } else {
            serveStop();
        }
    });

    socketio.on('B2F_volgende_speler', async (json) => {
        opslagGedaan = json.opslagGedaan;
        isTerugGegaan = json.isTerugGegaan;
        await getOpstelling();
        showServers();
    });

    socketio.on('B2F_vorige_speler', async (json) => {
        opslagGedaan = json.opslagGedaan;
        isTerugGegaan = json.isTerugGegaan;
        await getOpstelling();
        showServers();
    });

    socketio.on('B2F_voetfout', (json) => {
        showServeStatus(json.status);
    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = async () => {
    console.info('Live match pagina geladen');

    htmlVorigeServerNummer = document.querySelector('.js-vorige-server-nummer');
    htmlVorigeServerNaam = document.querySelector('.js-vorige-server-naam');
    htmlHuidigeServerNummer = document.querySelector('.js-huidige-server-nummer');
    htmlHuidigeServerNaam = document.querySelector('.js-huidige-server-naam');
    htmlVolgendeServerNummer = document.querySelector('.js-volgende-server-nummer');
    htmlVolgendeServerNaam = document.querySelector('.js-volgende-server-naam');

    htmlVorigeServerBtn = document.querySelector('.js-vorige-server');
    htmlVolgendeServerBtn = document.querySelector('.js-volgende-server');

    htmlStartServe = document.querySelector('.js-start-serve');
    htmlServeTijd = document.querySelector('.js-serve-tijd');
    htmlServeProgress = document.querySelector('.js-serve-progress');
    htmlVoetfoutStatus = document.querySelector('.js-voetfout-status');
    htmlServeStatus = document.querySelector('.js-serve-status');
    htmlServeLog = document.querySelector('.js-servelog');

    htmlOpenWissel = document.querySelector('.js-open-wissel');
    htmlWisselModal = document.querySelector('.js-wissel-modal');
    htmlCloseWissel = document.querySelectorAll('.js-close-wissel');
    htmlSpelersVeld = document.querySelector('.js-spelers-veld');
    htmlSpelersBank = document.querySelector('.js-spelers-bank');
    htmlBevestigWissel = document.querySelector('.js-bevestig-wissel');

    htmlServeLimiet = document.querySelector('.js-serve-limiet');

    matchId = getMatchIdFromUrl();

    await getServeLimiet();

    showServeLimiet();

    if (!matchId) {
        alert('Geen matchId gevonden.');
        return;
    }

    await getMatch();
    await getOpstelling();
    await getActieveSpelers();

    showServers();
    showServeTimer();
    showServeStatus('Geen');
    showStartServeButton();

    await getServesByMatch();

    listenToStartServe();
    listenToServerButtons();
    listenToWisselModal();
    listenToStopButton();
    listenToSocket();
};

document.addEventListener('DOMContentLoaded', init);

// #endregion