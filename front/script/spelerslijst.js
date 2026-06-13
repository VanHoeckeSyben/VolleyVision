'use strict';

const lanIP = `${window.location.hostname}:8000`;
const API = `http://${lanIP}/api/v1`
const socketio = io(lanIP);

// #region ***  DOM references                           ***********
let htmlModal, htmlSpelerRow, htmlRugnummerVal, htmlVoornaamVal, htmlNaamVal, htmlPositieVal, htmlRugnummerError, 
htmlVoornaamError, htmlNaamError, htmlPositieError, htmlInfoError;

let currentSpelerId = null;
// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showSpelers = (json) => {
    const spelers = json.spelers;
    let htmlSpelersString = ``;

    for (const speler of spelers) {
        htmlSpelersString += `<tr>
                        <td>${speler.rugnummer}</td>
                        <td class="c-table__voornaam">${speler.voornaam}</td>
                        <td class="c-table__naam">${speler.naam}</td>
                        <td>${speler.positie}</td>
                        <td class="c-table__buttons"><button class="c-table__edit c-table__button js-speler-edit"
                                data-spelerid="${speler.speler_id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round"
                                    class="lucide lucide-pencil-icon lucide-pencil">
                                    <path
                                        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                    <path d="m15 5 4 4" />
                                </svg></button><button class="c-table__delete c-table__button js-speler-delete" data-spelerid="${speler.speler_id}"><svg
                                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg></button></td>
                    </tr>`;
    };

    htmlSpelerRow.innerHTML = htmlSpelersString;
    listenToEditSpeler();
    listenToDeleteSpeler();
};

const showAddSpeler = (json) => {
    console.log(json);
    htmlModal.classList.remove('u-active');
    document.querySelector('.js-modal-form').reset();
}

const showError = () => {
    htmlRugnummerError.innerHTML = '*';
    htmlVoornaamError.innerHTML = '*';
    htmlNaamError.innerHTML = '*';
    htmlPositieError.innerHTML = '*';

    if (htmlRugnummerVal.value === '') {
        htmlRugnummerError.innerHTML = '* Dit veld is verplicht';
    };

    if (htmlVoornaamVal.value === '') {
        htmlVoornaamError.innerHTML = '* Dit veld is verplicht';
    };

    if (htmlNaamVal.value === '') {
        htmlNaamError.innerHTML = '* Dit veld is verplicht';
    };
    
    if (htmlPositieVal.value === '') {
        htmlPositieError.innerHTML = '* Dit veld is verplicht';
    };

    if (/\d/.test(htmlVoornaamVal.value)) {
        htmlVoornaamError.innerHTML = '* Dit is geen geldige voornaam (geen nummers)';
    };

    if (/\d/.test(htmlNaamVal.value)) {
        htmlNaamError.innerHTML = '* Dit is geen geldige naam (geen nummers)';
    };
};

const showSpeler = (json) => {
    htmlRugnummerVal.value = json.rugnummer;
    htmlVoornaamVal.value = json.voornaam;
    htmlNaamVal.value = json.naam;
    htmlPositieVal.value = json.positie;

    currentSpelerId = json.speler_id;

    listenToEditSpeler();
}

const showUpdateError = () => {
    htmlInfoError.classList.add('u-active');
    htmlInfoError.innerHTML = 'Er zijn geen gegevens veranderd';
};

const showTeVeelSpelers = () => {
    htmlInfoError.classList.add('u-active');
    htmlInfoError.innerHTML = 'Dit team is vol! maximum 12 spelers';
};

const showDeleteSpeler = (json) => {
    console.log(json);
    const htmlMessage = document.querySelector('.js-delete_info');

    htmlMessage.innerHTML = 'Speler verwijderd';

    setTimeout(() => {
        htmlMessage.innerHTML = '';
    }, 3000);
};

const showDeleteModal = () => {
    document.querySelector('.js-modal-verwijderen').classList.add('u-active');
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
};

const getAddSpeler = async () => {
    try {
        const body = JSON.stringify({
            naam: htmlNaamVal.value,
            voornaam: htmlVoornaamVal.value,
            rugnummer: htmlRugnummerVal.value,
            positie: htmlPositieVal.value
        });
        const url = `${API}/spelers`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        if (response.status === 200) {
            const json = await response.json();
            showAddSpeler(json);
        } else if (response.status === 422) {
            const errormessage = await response.json()
            console.log(errormessage.detail);
            showError();
        } else if (response.status === 400) {
            const errormessage = await response.json()
            console.log(errormessage.detail)
            showTeVeelSpelers();
        };
    }
    catch (error) {
        console.log('An error occured:', error);
    };
};

const getSpeler = async (spelerid) => {
    const url = `${API}/spelers/${spelerid}`;
    const response = await fetch(url).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));

    showSpeler(json);
}

const getUpdateSpeler = async (spelerid) => {
    try {
        const body = JSON.stringify({
            naam: htmlNaamVal.value,
            voornaam: htmlVoornaamVal.value,
            rugnummer: htmlRugnummerVal.value,
            positie: htmlPositieVal.value
        });
        const url = `${API}/spelers/${spelerid}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        if (response.status === 200) {
            const json = await response.json();
            showAddSpeler(json);
        } else if (response.status === 404) {
            const errormessage = await response.json()
            console.log(errormessage.detail);
            showUpdateError();
        };
    }
    catch (error) {
        console.log('An error occured:', error);
    };
};

const getDeleteSpeler = async (spelerid) => {
    const body = JSON.stringify({
        actief: 0
    })
    const url = `${API}/spelers/${spelerid}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).catch((err) => console.error('Fetch-error:', err));
    const json = await response.json().catch((err) => console.error('JSON-error:', err));
    
    showDeleteSpeler(json);
}
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToClickEvent = () => {
    const modalButton = document.querySelector('.js-addspeler');
    modalButton.addEventListener('click', (e) => {
        htmlModal.classList.add('u-active');
        document.querySelector('.js-modal-toevoegen').classList.add('u-active')
        document.querySelector('.js-modal-aanpassen').classList.remove('u-active');
        htmlInfoError.classList.remove('u-active');
        const errormsgs = document.querySelectorAll('.c-veld__errormsg');
        for (const errormsg of errormsgs) {
            errormsg.innerHTML = '*';
        };
    });

    const cancelButtons = document.querySelectorAll('.js-modal-sluit');
    for (const cancelButton of cancelButtons) {
        cancelButton.addEventListener('click', (e) => {
            htmlModal.classList.remove('u-active');
            document.querySelector('.js-modal-form').reset();
        });
    };

  const spelerAddButton = document.querySelector('.js-modal-toevoegen');
  spelerAddButton.addEventListener('click', (e) => {
    getAddSpeler();
  });
};

const listenToEditSpeler = () => {
    const editButtons = document.querySelectorAll('.js-speler-edit');
    for (const editButton of editButtons) {
        editButton.addEventListener('click', (e) => {
            htmlModal.classList.add('u-active');
            document.querySelector('.js-modal-toevoegen').classList.remove('u-active');
            document.querySelector('.js-modal-aanpassen').classList.add('u-active');
            htmlInfoError.classList.remove('u-active');

            const errormsgs = document.querySelectorAll('.c-veld__errormsg');
            for (const errormsg of errormsgs) {
                errormsg.innerHTML = '*';
            };

            getSpeler(editButton.dataset.spelerid);
        });
    };

    const spelerAanpassenButton = document.querySelector('.js-modal-aanpassen');
    spelerAanpassenButton.onclick = (e) => {
        getUpdateSpeler(currentSpelerId);
    };
};

const listenToDeleteSpeler = () => {
    const deleteButtons = document.querySelectorAll('.js-speler-delete');

    for (const deleteButton of deleteButtons) {
        deleteButton.addEventListener('click', (e) => {
            currentSpelerId = e.currentTarget.dataset.spelerid;
            showDeleteModal();
        });
    };

    const bevestigButton = document.querySelector('.js-modal-verwijderen-bevestig');

    if (bevestigButton) {
        bevestigButton.onclick = () => {
            getDeleteSpeler(currentSpelerId);
            document.querySelector('.js-modal-verwijderen').classList.remove('u-active');
        };
    }

    const cancelButtons = document.querySelectorAll('.js-modal-verwijderen-sluit');

    for (const cancelButton of cancelButtons) {
        cancelButton.onclick = () => {
            document.querySelector('.js-modal-verwijderen').classList.remove('u-active');
        };
    };
};

const listenToSocket = () => {
    socketio.on('B2F_nieuwe_speler', (value) => {
        getSpelers();
    });

    socketio.on('B2F_update_speler', (value) => {
        getSpelers();
    });

    socketio.on('B2F_delete_speler', (value) => {
        getSpelers();
    });
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = () => {
    console.info('Spelerslijst pagina geladen');
    htmlModal = document.querySelector('.js-modal');
    htmlSpelerRow = document.querySelector('.js-spelerrow');
    htmlRugnummerError = document.querySelector('.js-rugnummererror');
    htmlVoornaamError = document.querySelector('.js-voornaamerror');
    htmlNaamError = document.querySelector('.js-naamerror');
    htmlPositieError = document.querySelector('.js-positieerror');
    htmlNaamVal = document.querySelector('.js-naam');
    htmlVoornaamVal = document.querySelector('.js-voornaam');
    htmlRugnummerVal = document.querySelector('.js-rugnummer');
    htmlPositieVal = document.querySelector('.js-positie');
    htmlInfoError = document.querySelector('.js-modal__info_error');

    listenToClickEvent();
    getSpelers();
    listenToSocket();
}

document.addEventListener('DOMContentLoaded',init);
// #endregion