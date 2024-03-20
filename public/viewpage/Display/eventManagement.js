import { menu, root } from "./elements.js";
import * as Util from "../util.js";
import { currentUser, getSkills, addEvent, getUserOrganizerEventsUUIDs, getEventByUUID, updateStatusByUUID, getFirstLastNameFromEmailList, getDataFromVolunteerAttendeeListViaUUID, addOrganizersByEmailAndEvent, addAttendeeByEmailAndEvent, removeVolunteerByEmailAndEvent, removeAttendeeByEmailAndEvent, addVolunteerByEmailAndEvent, getUserSkills } from "../../controller/firebaseController.js";
import { ROUTE_PATH, SKILLS, COLOR, STATUS, EVENT_NOTIFICATIONS, COLLECTION } from "../../model/constants.js";
import { notificationPing, notificationPingAddOne, redirect } from "../Observer/notificationObserver.js";
import { Events } from "../../model/events.js";

export function addEventListener() {
    menu.eventManagement.addEventListener('click', async () => {
        eventManagement_page();
    });
}

export async function eventManagement_page() {
    history.pushState(null, null, ROUTE_PATH.EVENT_MANAGEMENT);
    if (currentUser) {
        notificationPing();
        Util.activeMenuButton(menu.eventManagement);
        root.innerHTML = Util.loadingPane;
        let html;
        const response = await fetch('/viewpage/templates/eventManagement_page.html', { cache: 'no-store' });
        html = await response.text();
        root.innerHTML = html;

        getScreenElements();
        await addListeners();
    }
}

let screen = {
    createEvent: null,
    createEventButton: null,
    editEvent: null,
    editEventButton: null,
    pastEvent: null,
    pastEventButton: null,
    participant: null,
    participantButton: null,
    note: null,
}

let skillsCount;
let uuidsCount;

function getScreenElements() {
    screen.createEvent = document.getElementById('create-event');
    screen.createEventButton = document.getElementById('create-event-button');
    screen.editEvent = document.getElementById('edit-events');
    screen.editEventButton = document.getElementById('edit-events-button');
    screen.pastEvent = document.getElementById('past-events');
    screen.pastEventButton = document.getElementById('past-events-button');
    screen.participant = document.getElementById('participant');
    screen.participantButton = document.getElementById('participant-button');
    screen.note = document.getElementById('note');
}

async function addListeners() {
    screen.createEventButton.addEventListener('click', async () => {
        if (screen.createEvent.innerHTML == "") {
            removeEverythingExpectButtons();
            screen.createEvent.innerHTML = Util.loadingCard;
            screen.createEvent.innerHTML = await createEvent_card();
            createEvent_card_addListeners();
        } else {
            screen.createEvent.innerHTML = "";
        }
    });
    screen.editEventButton.addEventListener('click', async () => {
        if (screen.editEvent.innerHTML == "") {
            removeEverythingExpectButtons();
            screen.editEvent.innerHTML = Util.loadingCard;
            screen.editEvent.innerHTML = await editEvent_card();
            editEvent_card_addListeners();
        } else {
            screen.editEvent.innerHTML = "";
        }
    });
    screen.pastEventButton.addEventListener('click', async () => {
        if (screen.pastEvent.innerHTML == ""){
            removeEverythingExpectButtons();
            screen.pastEvent.innerHTML = Util.loadingCard;
            screen.pastEvent.innerHTML = await pastEvent_card();
            pastEvent_card_addListeners();
        } else {
            screen.pastEvent.innerHTML = "";
        }
    });
    screen.participantButton.addEventListener('click', async () => {
        if (screen.participant.innerHTML == ""){
            removeEverythingExpectButtons();
            screen.participant.innerHTML = Util.loadingCard;
            screen.participant.innerHTML = await participant_card();
            await participant_card_addListeners();
        } else {
            screen.participant.innerHTML = "";
        }
    });
}

function removeEverythingExpectButtons(){
    screen.createEvent.innerHTML = "";
    screen.editEvent.innerHTML = "";
    screen.pastEvent.innerHTML = "";
    screen.participant.innerHTML = "";
    screen.note.innerHTML = "";
}

export async function participant_card(){
    notificationPing();
    const uuids = await getUserOrganizerEventsUUIDs();
    let card = Util.loadingCard;
    card = '<div class="card card-body"> Select an event: <div>';
    uuidsCount = 0;
    Object.values(uuids).forEach(uuid => {
        if (uuid.status == STATUS.UPCOMING || uuid.status == STATUS.ON_HOLD) {
            card += `
            <input type="radio" id="uuid-input-${uuidsCount}" name="event-uuid" class="btn-check" value="${uuid.uuid}">
            <label id="uuid-label-${uuidsCount}" for="uuid-button-${uuidsCount}" class="btn btn-outline-light btn-sm" data-uuid=${uuid.uuid}>${uuid.name} (${uuid.uuid})</label>`;
            uuidsCount++
        }
    });
    card += '</div><div id="view-participant-card"></div></div>';
    return card;
}

export async function participant_card_addListeners() {
    let card = document.getElementById('view-participant-card');
    for (let i = 0; i < uuidsCount; i++) {
        let button = document.getElementById('uuid-label-' + i);
        button.addEventListener('click', async () => {
            card.innerHTML = Util.loadingCard;
            Util.resetButtonStyle(uuidsCount, 'uuid-label-', 'btn btn-outline-light btn-sm');
            button.classList = 'btn btn-outline-warning btn-sm';
            let event = await getEventByUUID(button.getAttribute('data-uuid'));
            card.innerHTML = `</p>
            <div class="card-header">
                <h2>${event.name}</h2> ${event.uuid}
                <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)}. (${event.status})
            </div>`;

            let cardTable = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col">Participant Type</th>
                        <th scope="col">Email</th>
                        <th scope="col">First and Last Name</th>
                        <th scope="col">Joined</th>
                        <th scope="col">Action <t id="notification-history-help-button">❔</t></th>
                    </tr>
                </thead>`;
                let fnameLname = await getFirstLastNameFromEmailList(event.organizersEmail);
                fnameLname.forEach((person) => {
                    cardTable += `
                    <tr>
                      <td>Organizer</td>
                      <td>${person.email}</td>
                      <td>${person.fname} ${person.lname}</td>
                      <td>-</td>
                      <td><button type="button" class="btn btn-danger btn-sm" disabled>Remove</button></td>
                    </tr>`;
                });
                let i = 0;
                fnameLname = await getDataFromVolunteerAttendeeListViaUUID(event.uuid);
                fnameLname.forEach((person) => {
                    cardTable += `
                    <tr>
                      <td>${Util.capitalizeFirstLetter(person.type)}</td>
                      <td>${person.email}</td>
                      <td>${person.fname} ${person.lname}</td>
                      <td>${person.join}</td>
                      <td><button id="remove-${i}" type="button" class="btn btn-danger btn-sm" data-email="${person.email}" data-type="${person.type}">Remove</button></td>
                    </tr>`;
                    i++;
                });
                cardTable += `
                </table>
                <div class="card-body">
                    <button id="add-organizers-button" type="button" class="btn btn-primary" data-name="${event.name}">Add Organizers</button>
                    <button id="add-volunteers-button" type="button" class="btn btn-primary">Add Volunteers</button>
                    <button id="add-attendees-button" type="button" class="btn btn-primary">Add Attendees</button>
                </div>`;
                card.innerHTML += cardTable;
                participant_render_card_addListeners(event, i);
        });
    }
    async function participant_render_card_addListeners(event, i) {
        let organizersButton = document.getElementById('add-organizers-button');
        let addVolunteersButton = document.getElementById('add-volunteers-button');
        let addAttendeesButton = document.getElementById('add-attendees-button');

        addVolunteersButton.disabled = !event.allowVolunteers;
        addAttendeesButton.disabled = !event.allowAttendees;
        let eventName = organizersButton.getAttribute('data-name'); 
        let inputBox = `
        <div class="input-group flex-nowrap">
            <input id="modal-email" type="email" class="form-control" placeholder="User Email" aria-label="email" aria-describedby="addon-wrapping">
        </div>
        `
        organizersButton.addEventListener('click', () =>{
            Util.modal("<b>" + eventName + "</b>: Add Organizers", `Organizers have full access to the event and are able to change anything.
            Once a user is added it <b>cannot be undone</b>. The user will be notified.`+inputBox,
            `<div>
                <button id="modal-submit" class="btn btn-primary">Submit</button>
            </div>`);
            participant_render_organizers_addListeners(event);
        });

        addVolunteersButton.addEventListener('click', () =>{
            Util.modal("<b>" + eventName + "</b>: Add Volunteers", `The user will be notified of this event and have the option to join.`+inputBox +`
            <div id="skill-area"></div>`,
            `<div>
            <button id="modal-skills" class="btn btn-outline-success"> Skills Look Up</button> <button id="modal-submit-vol" class="btn btn-primary">Submit</button>
            </div>`);
            participant_render_vols_addListeners(event);
        });

        addAttendeesButton.addEventListener('click', () => {
            Util.modal("<b>" + eventName + "</b>: Add Attendees", `The user will be notified of this event and have the option to join.`+inputBox,
            `<div>
                <button id="modal-submit" class="btn btn-primary">Submit</button>
            </div>`);
            participant_render_attendees_addListeners(event);
        });

        for(let y = 0; y < i; y++){
            let removeButton = document.getElementById('remove-'+y); 
            removeButton.addEventListener('click', () => {
                if (removeButton.getAttribute('data-type') == 'volunteer'){
                    removeVolunteerByEmailAndEvent(removeButton.getAttribute('data-email'), event);
                    screen.participant.innerHTML = "";
                    notificationPing();
                    Util.info('Left Event as Volunteer', `Left event: ${event.name} (${event.uuid})`, COLOR.SUCCESS);
                } else if (removeButton.getAttribute('data-type') == 'attendee'){
                    removeAttendeeByEmailAndEvent(removeButton.getAttribute('data-email'), event);
                    screen.participant.innerHTML = "";
                    notificationPing();
                    Util.info('Left Event as Attendee', `Left event: ${event.name} (${event.uuid})`, COLOR.SUCCESS);

                }
            });
        }


    }

    async function participant_render_vols_addListeners(event) {
        let submitVol = document.getElementById('modal-submit-vol');
        let emailBox = document.getElementById('modal-email');
        let skillsArea = document.getElementById('skill-area');
        let skillsButton = document.getElementById('modal-skills');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        skillsButton.addEventListener('click', async () => {
            if (emailRegex.test(emailBox.value)) {
                if (event.volunteers.includes(emailBox.value)) {
                    Util.info('Add Volunteer Error', 'User is already a volunteer.', COLOR.DANGER);
                } else {
                    let copy;       
                    submitVol.disabled = true;
                    const userSkillsSet = new Set(await getUserSkills(emailBox.value));
                    const eventSkillsSet = new Set(event.skills);
                    const commonSkills = [...userSkillsSet].filter((skill) => eventSkillsSet.has(skill));    
                    copy = event.skills.filter((skill) => !commonSkills.includes(skill));
                    let modalBody = `
                    Skills: <t class="text-success"> ${commonSkills.join(', ')} </t> - ${event.skills.join(', ')}.
                    `;
                    skillsArea.innerHTML = modalBody;
                    submitVol.disabled = false;
                }
            } else {
                Util.info('Add Volunteer Error', 'Invalid email.', COLOR.DANGER);
            }
        });

        submitVol.addEventListener('click', async () => {
            if (emailRegex.test(emailBox.value)) {
                if (event.volunteers.includes(emailBox.value)) {
                    Util.info('Add Volunteer Error', 'User is already a volunteer.', COLOR.DANGER);
                } else {       
                    submitVol.disabled = true;
                    if (await addVolunteerByEmailAndEvent(emailBox.value, event, EVENT_NOTIFICATIONS.VOLUNTEER_INVITE, false)){
                        notificationPing();
                        Util.modalClose();
                        card.innerHTML = "";
                        screen.participant.innerHTML = "";
                        Util.info('Add Volunteer Success', `${emailBox.value} is now a volunteer.`, COLOR.SUCCESS);
                    } else {
                        Util.info('Add Volunteer Error', 'User does not exists or server error.', COLOR.DANGER);
                        submit.disabled = false;
                    }
                }
            } else {
                Util.info('Add Volunteer Error', 'Invalid email.', COLOR.DANGER);
            }
        });
    }

    async function participant_render_organizers_addListeners(event) {
        let submit = document.getElementById('modal-submit');
        let submitVol = document.getElementById('modal-submit-vol');
        let emailBox = document.getElementById('modal-email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        submitVol.addEventListener('click', async () => {
            if (emailRegex.test(emailBox.value)) {
                if (event.organizersEmail.includes(emailBox.value)) {
                    Util.info('Add Volunteer Error', 'User is already a volunteer.', COLOR.DANGER);
                } else {       
                    submitVol.disabled = true;
                    if (await addVolunteerByEmailAndEvent(emailBox.value, event, EVENT_NOTIFICATIONS.VOLUNTEER_INVITE, false)){
                        notificationPing();
                        Util.modalClose();
                        card.innerHTML = "";
                        screen.participant.innerHTML = "";
                        Util.info('Add Volunteer Success', `${emailBox.value} is now a volunteer.`, COLOR.SUCCESS);
                    } else {
                        Util.info('Add Volunteer Error', 'User does not exists or server error.', COLOR.DANGER);
                        submit.disabled = false;
                    }
                }
            } else {
                Util.info('Add Organizers Error', 'Invalid email.', COLOR.DANGER);
            }
        });

        submit.addEventListener('click', async () => {
            if (emailRegex.test(emailBox.value)) {
                if (event.organizersEmail.includes(emailBox.value)) {
                    Util.info('Add Organizers Error', 'User is already a organizer.', COLOR.DANGER);
                } else {       
                    submit.disabled = true;
                    if (await addOrganizersByEmailAndEvent(emailBox.value, event)){
                        notificationPing();
                        Util.modalClose();
                        card.innerHTML = "";
                        screen.participant.innerHTML = "";
                        Util.info('Add Organizers Success', `${emailBox.value} is now an organizer.`, COLOR.SUCCESS);
                    } else {
                        Util.info('Add Organizers Error', 'User does not exists or server error.', COLOR.DANGER);
                        submit.disabled = false;
                    }
                }
            } else {
                Util.info('Add Organizers Error', 'Invalid email.', COLOR.DANGER);
            }
        });
    }

    async function participant_render_attendees_addListeners(event){
        let submit = document.getElementById('modal-submit');
        let emailBox = document.getElementById('modal-email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        submit.addEventListener('click', async () => { 
            if (emailRegex.test(emailBox.value)) {
                if (event.attendees.includes(emailBox.value)) {
                    Util.info('Add Attendees Error', 'User is already an attendee.', COLOR.DANGER);
                } else {
                    submit.disabled = true;
                    if (await addAttendeeByEmailAndEvent(emailBox.value, event, EVENT_NOTIFICATIONS.ATTENDEE_INVITE, false)){
                        notificationPing();
                        Util.modalClose();
                        card.innerHTML = "";
                        screen.participant.innerHTML = "";
                        Util.info('Add Attendees Success', `${emailBox.value} is notified.`, COLOR.SUCCESS);
                    } else {
                        Util.info('Add Attendees Error', 'User does not exists or server error.', COLOR.DANGER);
                        submit.disabled = false;
                    }
                }
            } else {
                Util.info('Add Organizers Error', 'Invalid email.', COLOR.DANGER);
            }
        });
    }
    
}


export async function createEvent_card() {
    notificationPing();
    let card = `
    <div class="card card-body">
        <div>
            <input id="create-event-name" type="fname" name="fname" placeholder="Event Name" required>
        </div>
        <div>
            <textarea id="create-event-textarea" placeholder="Description" ></textarea>
        </div>
        <div>
            <input id="create-event-location" type="text" name="location" placeholder="Location" minlength="10" required>
        </div>
        <div>
            <label for="create-event-start-date">Start Date: </label>
            <input id="create-event-start-date" type="datetime-local" name="date" min="${Util.timestampFormatterYYYYMMDDTIME(Date.now())}" placeholder="Start Date" required>
        </div>
        <div>
            <label for="create-event-end-date">End Date: </label>
            <input id="create-event-end-date" type="datetime-local" name="date" min="${Util.timestampFormatterYYYYMMDDTIME(Date.now())}" placeholder="End Date" required>
        </div>`;
    skillsCount = -1
    const documents = Object.values(SKILLS);
    const lastDocument = documents[Object.keys(documents)[Object.keys(documents).length - 1]];
    card += '<div class="card card-body"> Skills Needed: <br> <div id=secret-message></div> </p>';
    for (const document of documents) {
        const skills = await getSkills(document);
        card += `<div> ${Util.capitalizeFirstLetter(document)}`;
        for (const skill of Object.values(skills)) {
            skillsCount++;
            card += `
            <input type="checkbox" class="btn-check" id="button-check-outlined-${skillsCount}" autocomplete="off">
            <label id="label-check-outlined-${skillsCount}" class="btn btn-outline-light btn-sm" for="button-check-outlined-${skillsCount}">${skill}</label>
          `;
        }
        if (document !== lastDocument) {
            card += '</p>';
        } else {
            card += "</div></div></div></p>";
        }
    }
    card += '<div class="card card-body"> People Needed: </p>';
    card += `<div>
        <input type="checkbox" class="btn-check" id="button-check-outlined-volunteers" autocomplete="off">
        <label id="label-check-outlined-volunteers" class="btn btn-outline-light btn-sm" for="button-check-outlined-volunteers">Volunteers</label>
        <input type="checkbox" class="btn-check" id="button-check-outlined-attendees" autocomplete="off">
        <label id="label-check-outlined-attendees" class="btn btn-outline-light btn-sm" for="button-check-outlined-attendees">Attendees</label>
    </div> </div> </p>`;
    card += `
    <div class="card card-body">  Visibility: </p>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inline-private" value="on">
            <label class="form-check-label" for="inline-private">Private</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inline-public" value="off">
            <label class="form-check-label" for="inline-public">Public</label>
        </div>
    </div> </p>
  `;

    card += `<div>
        <button id="create-event-submit-button" class="btn btn-primary">Create Event</button>
        <t id="create-event-help-button">❔</t> <t id="create-event-help"></t>
    </div>`;
    return card;
}

export function createEvent_card_addListeners() {
    let addSkill = {};
    // const totalCompletion = 98;
    // const individualCompletion = 14;
    // let formCompletion = 0;
    // <div class="progress" role="progressbar" aria-label="Animated striped example" aria-valuenow="${formCompletion}" aria-valuemin="0" aria-valuemax="${totalCompletion}">
    //         <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: ${(formCompletion / totalCompletion) * 100}%"></div>
    document.getElementById('create-event-help-button').addEventListener('click', () => {
        let help = document.getElementById('create-event-help')
        if (help.innerHTML == "") {
            help.innerHTML = `</p>
            Hello
            </div>`;
        } else {
            help.innerHTML = "";
        }
    });
    for (let i = 0; i <= skillsCount; i++) {
        let button = document.getElementById('button-check-outlined-' + i)
        let label = document.getElementById('label-check-outlined-' + i);
        button.addEventListener('click', () => {
            if (label.classList == 'btn btn-outline-success btn-sm') {
                label.classList = 'btn btn-outline-light btn-sm';
                Util.deleteSkillByPlacement(i, addSkill);
            } else {
                label.classList = 'btn btn-outline-success btn-sm';
                addSkill[Object.keys(addSkill).length] = { placement: i, skill: label.innerText }
            }
        });
    }
    document.getElementById('create-event-submit-button').addEventListener('click', async () => {
        const name = document.getElementById('create-event-name').value;
        const description = document.getElementById('create-event-textarea').value;
        const location = document.getElementById('create-event-location').value;
        const startDate = Util.datetimeLocalToUnixTime(document.getElementById('create-event-start-date').value);
        const endDate = Util.datetimeLocalToUnixTime(document.getElementById('create-event-end-date').value);
        if (!(name && description && location && startDate && endDate)) {
            Util.info('Create Event Error', 'Form is incomplete.', COLOR.WARNING);
            return;
        }
        if (!(((Math.floor(Date.now() / 1000)) - startDate) < 300)) {
            Util.info('Create Event Error', `Event must take place 5 minutes from now (${Util.timestampFormatter(Date.now() + 300000)}).`, COLOR.WARNING);
            return;
        }
        if (endDate - startDate < 60) {
            Util.info('Create Event Error', 'Event must be longer then 1 minute.', COLOR.WARNING);
            return;
        }
        const volunteers = document.getElementById('button-check-outlined-volunteers').checked;
        const attendees = document.getElementById('button-check-outlined-attendees').checked;
        if (volunteers == attendees && volunteers == false) {
            Util.info('Create Event Error', 'Must have volunteers and/or attendees.', COLOR.WARNING);
            return
        }
        const publicVisibility = document.getElementById('inline-public').checked;
        if (publicVisibility == document.getElementById('inline-private').checked) {
            Util.info('Create Event Error', 'Missing public/private visibilty.', COLOR.WARNING);
            return;
        }

        let addSkillsArray = []
        if (Object.keys(addSkill).length > 0) {
            for (let i = 0; i < Object.keys(addSkill).length; i++) {
                addSkillsArray[i] = addSkill[i].skill;
                document.getElementById('label-check-outlined-' + addSkill[i].placement).classList = "btn btn-outline-light btn-sm";
                document.getElementById('label-check-outlined-' + addSkill[i].placement).checked = true;
            }
            addSkill = {};
        }

        document.getElementById('create-event-submit-button').setAttribute("disabled", `${true}`);
        const eventData = {
            uuid: 0,
            organizersEmail: [currentUser.email],
            name: name,
            description: description,
            location: location,
            startDate: startDate,
            endDate: endDate,
            skills: addSkillsArray,
            volunteers: [],
            attendees: [],
            public: publicVisibility,
            status: STATUS.UPCOMING,
            volunteerList: [],
            attendeeList: [],
            allowAttendees: document.getElementById('inline-private').checked,
            allowVolunteers: document.getElementById('inline-public').checked,
        }
        const data = new Events(eventData);

        let worked = await addEvent(data);
        if (worked) {
            notificationPing();
            screen.createEvent.innerHTML = "";
        } else {
            document.getElementById('create-event-submit-button').removeAttribute("disabled")
        }
    });
}

export async function editEvent_card() {
    notificationPing();
    const uuids = await getUserOrganizerEventsUUIDs();
    let card = Util.loadingCard;
    card = '<div class="card card-body"> Select an event: <div>';
    uuidsCount = 0;
    Object.values(uuids).forEach(uuid => {
        if (uuid.status == STATUS.UPCOMING || uuid.status == STATUS.ON_HOLD) {
            card += `
            <input type="radio" id="uuid-input-${uuidsCount}" name="event-uuid" class="btn-check" value="${uuid.uuid}">
            <label id="uuid-label-${uuidsCount}" for="uuid-button-${uuidsCount}" class="btn btn-outline-light btn-sm" data-uuid=${uuid.uuid}>${uuid.name} (${uuid.uuid})</label>
        `;
            uuidsCount++
        }
    });
    card += '</div><div id="view-edit-event-card"></div></div>';
    return card;
}

export async function pastEvent_card() {
    notificationPing();
    const uuids = await getUserOrganizerEventsUUIDs();
    let card = Util.loadingCard;
    card = '<div class="card card-body"> Select an event: <div>';
    uuidsCount = 0;
    Object.values(uuids).forEach(uuid => {
        if (uuid.status == STATUS.CANCELED || uuid.status == STATUS.ENDED) {
            card += `
            <input type="radio" id="uuid-input-${uuidsCount}" name="event-uuid" class="btn-check" value="${uuid.uuid}">
            <label id="uuid-label-${uuidsCount}" for="uuid-button-${uuidsCount}" class="btn btn-outline-light btn-sm" data-uuid=${uuid.uuid}>${uuid.name} (${uuid.uuid})</label>
        `;
            uuidsCount++
        }
    });
    card += '</div><div id="view-edit-event-card"></div></div>';
    return card;
}

export async function editEvent_card_addListeners() {
    let card = document.getElementById('view-edit-event-card');
    for (let i = 0; i < uuidsCount; i++) {
        let button = document.getElementById('uuid-label-' + i);
        button.addEventListener('click', async () => {
            card.innerHTML = Util.loadingCard;
            Util.resetButtonStyle(uuidsCount, 'uuid-label-', 'btn btn-outline-light btn-sm');
            button.classList = 'btn btn-outline-warning btn-sm';
            let event = await getEventByUUID(button.getAttribute('data-uuid'));
            card.innerHTML = `</p>
            <div class="card-header">
                <h2>${event.name}</h2> ${event.uuid}
                <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)}. (${event.status})
            </div>
            <div class="card-body">
                <p class="card-text">${event.description}</p>
                <a id="open-button" type="button" class="btn btn-primary">Open</a>
                <button id="edit-card-edit-button" type="button" class="btn btn-warning" disabled>Edit</button>
                <a id="edit-card-change-button" type="button" class="btn btn-danger" data-name="${event.name}" data-status="${event.status}" data-uuid="${event.uuid}">Change Status</a>
                <t id="edit-card-help-button">❔</t> <t id="edit-card-help"></t>
            </div>`;
            edit_card_addListeners();
        });
    }
    async function edit_card_addListeners() {
        let changeButton = document.getElementById('edit-card-change-button');
        let eventName = changeButton.getAttribute('data-name');
        let eventStatus = changeButton.getAttribute('data-status');
        let eventUUID = changeButton.getAttribute('data-uuid');
        let editButton = document.getElementById('edit-card-edit-button');
        document.getElementById('open-button').addEventListener('click', () => {
            redirect(ROUTE_PATH.E+eventUUID);
        });
        editButton.addEventListener('click', async () => {
            let editEvent_card = await createEvent_card()
            Util.modal("<b>" + eventName + "</b>: Edit Event", editEvent_card, 'No footer');
            editEvent_card_addListeners();
        });

        document.getElementById('edit-card-help-button').addEventListener('click', () => {
            let help = document.getElementById('edit-card-help');
            if (help.innerHTML == '') {
                help.innerHTML = `
                <b class="text-primary">Open</b>: Redirect to the event page. 
                <b class="text-warning">Edit</b>: Edit the event (N/A at this time). 
                <b class="text-danger">Change Status</b>: Changes the status of the event.`;
                // Ended: The event has ended on the set date.
            } else {
                help.innerHTML = '';
            }
        });
        changeButton.addEventListener('click', () => {
            Util.modal("<b>" + eventName + "</b>: Change Status", `<b>Upcoming</b>: The event is scheduled on the set date.
                <br><b>On Hold</b>: The event will not happen on the set date. 
                <br><b>Canceled</b>: The event is canceled. (Cannot be undone)
                <hr>Everyone associated with this event will be notified of the status change.`,
                `<div>
                    <button id="upcoming-label" class="btn btn-outline-light btn-sm" data-status=${eventStatus} data-uuid="${eventUUID}">Upcoming</button>

                    <button id="on-hold-label" class="btn btn-outline-light btn-sm">On Hold</button>

                    <button id="canceled-label" class="btn btn-outline-light btn-sm">Canceled</button>

                    <button id="modal-submit" class="btn btn-primary">Submit</button>
                </div>`);
            modal_addListeners();
        });
    }

    async function modal_addListeners() {
        let upcomingButton = document.getElementById('upcoming-label');
        let eventStatus = upcomingButton.getAttribute('data-status');
        let eventUUID = upcomingButton.getAttribute('data-uuid');
        let onHoldButton = document.getElementById('on-hold-label');
        let canceledButton = document.getElementById('canceled-label');
        let submitButton = document.getElementById('modal-submit');
        let changeState;
        (eventStatus == STATUS.UPCOMING) ? upcomingButton.setAttribute("disabled", `${true}`) : onHoldButton.setAttribute("disabled", `${true}`);
        upcomingButton.addEventListener('click', () => {
            upcomingButton.classList = 'btn btn-light btn-sm';
            canceledButton.classList = 'btn btn-outline-light btn-sm';
            onHoldButton.classList = 'btn btn-outline-light btn-sm';
            changeState = STATUS.UPCOMING;
        });
        onHoldButton.addEventListener('click', () => {
            onHoldButton.classList = 'btn btn-light btn-sm';
            canceledButton.classList = 'btn btn-outline-light btn-sm';
            upcomingButton.classList = 'btn btn-outline-light btn-sm';
            changeState = STATUS.ON_HOLD;
        });
        canceledButton.addEventListener('click', () => {
            canceledButton.classList = 'btn btn-light btn-sm';
            onHoldButton.classList = 'btn btn-outline-light btn-sm';
            upcomingButton.classList = 'btn btn-outline-light btn-sm';
            changeState = STATUS.CANCELED;
        });
        submitButton.addEventListener('click', () => {
            if (changeState){
                if (updateStatusByUUID(eventUUID, changeState, true)) {
                    Util.modalClose();
                    notificationPingAddOne();
                    Util.info(`Change Status:`, `Status changed successfully.`, COLOR.SUCCESS);
                    screen.editEvent.innerHTML = '';
                }
            } else {
                Util.info('Change Status Error', 'Please select one of the statuses.', COLOR.WARNING);
            }
        });

    }
}

export async function pastEvent_card_addListeners() {
    let card = document.getElementById('view-edit-event-card');
    for (let i = 0; i < uuidsCount; i++) {
        let button = document.getElementById('uuid-label-' + i);
        button.addEventListener('click', async () => {
            card.innerHTML = Util.loadingCard;
            Util.resetButtonStyle(uuidsCount, 'uuid-label-', 'btn btn-outline-light btn-sm');
            button.classList = 'btn btn-outline-warning btn-sm';
            let event = await getEventByUUID(button.getAttribute('data-uuid'));
            card.innerHTML = `</p>
            <div class="card-header">
                <h2>${event.name}</h2> ${event.uuid}
                <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)}. (${event.status})
            </div>
            <div class="card-body">
                <p class="card-text">${event.description}</p>
                <a id="open-button" type="button" class="btn btn-primary">Open</a>
            </div>`;
            past_card_addListeners(event);
        });
    }
    async function past_card_addListeners(event) {
        document.getElementById('open-button').addEventListener('click', () => {
            redirect(ROUTE_PATH.E+event.uuid);
        });
    }
}

