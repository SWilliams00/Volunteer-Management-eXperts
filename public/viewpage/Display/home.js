import { menu, root, menuModal } from "./elements.js";
import * as Util from "../util.js";
import { currentUser, getEventByUUID, getUserSkills, addAttendeeByEmailAndEvent, addVolunteerByEmailAndEvent, getUserEventsBasedOnJoined, removeAttendeeByEmailAndEvent, removeVolunteerByEmailAndEvent } from "../../controller/firebaseController.js";
import { ROUTE_PATH, COLOR, STATUS, EVENT_NOTIFICATIONS } from "../../model/constants.js";
import { notificationPing, redirect } from "../Observer/notificationObserver.js";

export function addEventListener() {
    menu.home.addEventListener('click', async () => {
        home_page();
    });
}

export async function home_page(){
    history.pushState(null, null, ROUTE_PATH.HOME);
    if (currentUser){
        notificationPing();
        Util.activeMenuButton(menu.home);
        root.innerHTML = Util.loadingPane;
        let html;
        const response = await fetch('/viewpage/templates/home_page.html', { cache: 'no-store' });
        html = await response.text();
        root.innerHTML = html;

        getScreenElements();
        await addListeners();
    }
}

let screen = {
    requestedEvents: null,
    requestedEventsButton: null,
    joinedEvents: null,
    joinedEventsButton: null,
    note: null
}

function getScreenElements(){
    screen.requestedEvents = document.getElementById('requested-events');
    screen.requestedEventsButton = document.getElementById('requested-events-button');
    screen.joinedEvents = document.getElementById('joined-events');
    screen.joinedEventsButton = document.getElementById('joined-events-button');
    screen.note = document.getElementById('note');
}

function removeEverythingExpectButtons(){
    screen.requestedEvents.innerHTML = "";
    screen.joinedEvents.innerHTML = "";
    screen.note.innerHTML = "";
}


async function addListeners(){
    screen.requestedEventsButton.addEventListener('click', async () => {
        if (screen.requestedEvents.innerHTML == ""){
            removeEverythingExpectButtons();
            screen.requestedEvents.innerHTML = Util.loadingCard;
            screen.requestedEvents.innerHTML = await requestedEvent_card();
            requestedEvent_card_addListeners();
        } else {
            screen.requestedEvents.innerHTML = "";
        }
    });
    screen.joinedEventsButton.addEventListener('click', async () =>{
        if (screen.joinedEvents.innerHTML == ""){
            removeEverythingExpectButtons();
            screen.joinedEvents.innerHTML = Util.loadingCard;
            screen.joinedEvents.innerHTML = await joinedEventsButton_card();
            joinedEventsButton_card_addListeners();
        } else {
            screen.joinedEvents.innerHTML = "";
        }
    });
}

async function joinedEventsButton_card() {
    let uuids = await getUserEventsBasedOnJoined(true);
    let card = Util.loadingCard;
    card = '<div class="card card-body"> Select an event: <div>';
    let uuidsCount = 0;
    Object.values(uuids).forEach(uuid => {
        if (uuid.status == STATUS.ON_HOLD || uuid.status == STATUS.UPCOMING) {
            card += `
            <button id="uuid-label-${uuidsCount}" for="uuid-button-${uuidsCount}" class="btn btn-outline-light btn-sm" data-uuid=${uuid.uuid}>${uuid.name} (${uuid.uuid})</button>
        `;
            uuidsCount++
        }
    });
    card += `</div><div id="joined-event-card" data-count="${uuidsCount}"></div></div>`;
    return card;
}

export async function joinedEventsButton_card_addListeners() {
    let card = document.getElementById('joined-event-card');
    let uuidsCount = card.getAttribute('data-count');
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
                <br> Location: ${event.location}
                <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)}. (${event.status})
            </div>
            <div class="card-body">
                <p class="card-text">${event.description}</p>
                <button id="open-button" type="button" class="btn btn-primary">Open</button>
                <button id="leave-volunteer-button" type="button" class="btn btn-danger" >Leave as Volunteer</button>
                <button id="leave-attendee-button" type="button" class="btn btn-danger">Leave as Attendee</button>
            </div>`;
            //<button id="share-button" class="btn">📋</button>

            joinedRenderButtons_card_addListeners(event);
        });
    }
}

export async function joinedRenderButtons_card_addListeners(event){
    let openButton = document.getElementById('open-button');
    let volunteerButton = document.getElementById('leave-volunteer-button');
    let attendeeButton = document.getElementById('leave-attendee-button');
    if (event.status == STATUS.CANCELED || event.status == STATUS.ENDED){
        volunteerButton.disabled = true;
        attendeeButton.disabled = true;
    } else {
        volunteerButton.disabled = !event.allowVolunteers;
        attendeeButton.disabled = !event.allowAttendees;
    }

    if (event.volunteers.includes(currentUser.email)){
        if (event.volunteerList[Util.removeEmailDot(currentUser.email)].join) {
            volunteerButton.disabled = false;
        }
    } else {
        volunteerButton.disabled = true;
    }

    if (event.attendees.includes(currentUser.email)){
        if (event.attendeeList[Util.removeEmailDot(currentUser.email)].join) {
            attendeeButton.disabled = false;
        }
    } else {
        attendeeButton.disabled = true;
    }

    openButton.addEventListener('click', () =>{
        openButton.disabled = true;
        redirect(ROUTE_PATH.E+event.uuid);
    });

    attendeeButton.addEventListener('click', async () => {
        attendeeButton.disabled = true;
        if (await removeAttendeeByEmailAndEvent(currentUser.email, event)){
            screen.joinedEvents.innerHTML = "";
            notificationPing();
            Util.info('Left Event as Attendee', `Left event: ${event.name} (${event.uuid})`, COLOR.SUCCESS);
        } else {
            leaveButton.disabled = false;
        }
    });

    volunteerButton.addEventListener('click', async () => {
        volunteerButton.disabled = true;
        if (await removeVolunteerByEmailAndEvent(currentUser.email, event)){
            screen.joinedEvents.innerHTML = "";
            notificationPing();
            Util.info('Left Event as Volunteer', `Left event: ${event.name} (${event.uuid})`, COLOR.SUCCESS);
        } else {
            leaveButton.disabled = false;
        }
    });
}

async function requestedEvent_card(){
    let uuids = await getUserEventsBasedOnJoined(false);
    let card = Util.loadingCard;
    card = '<div class="card card-body"> Select an event: <div>';
    let uuidsCount = 0;
    Object.values(uuids).forEach(uuid => {
        if (uuid.status == STATUS.ON_HOLD || uuid.status == STATUS.UPCOMING) {
            card += `
            <button id="uuid-label-${uuidsCount}" for="uuid-button-${uuidsCount}" class="btn btn-outline-light btn-sm" data-uuid=${uuid.uuid}>${uuid.name} (${uuid.uuid})</button>
        `;
            uuidsCount++
        }
    });
    card += `</div><div id="joined-event-card" data-count="${uuidsCount}"></div></div>`;
    return card;
}

export async function requestedEvent_card_addListeners() {
    let card = document.getElementById('joined-event-card');
    let uuidsCount = card.getAttribute('data-count');
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
                <br> Location: ${event.location}
                <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)}. (${event.status})
            </div>
            <div class="card-body">
                <p class="card-text">${event.description}</p>
                <button id="open-button" type="button" class="btn btn-primary">Open</button>
            </div>`;
            //<button id="share-button" class="btn">📋</button>

            requesredRenderButtons_card_addListeners(event);
        });
    }
}

export function requesredRenderButtons_card_addListeners(event){
    let openButton = document.getElementById('open-button');
    openButton.addEventListener('click', () =>{
        openButton.disabled = true;
        redirect(ROUTE_PATH.E+event.uuid);
    });
}


export async function eventHome_page(uuid){
    history.pushState(null, null, ROUTE_PATH.E+uuid);
    if (currentUser){
        await home_page();
        history.pushState(null, null, ROUTE_PATH.E+uuid);
        const event = await getEventByUUID(uuid)
        const userSkillsSet = new Set(await getUserSkills(currentUser.email));
        const eventSkillsSet = new Set(event.skills);
        const commonSkills = [...userSkillsSet].filter((skill) => eventSkillsSet.has(skill));    
        event.skills = event.skills.filter((skill) => !commonSkills.includes(skill));
        let modalTitle = `<h2>${event.name}</h2> <h6>${event.uuid} 
        <br> Location:  ${event.location}
        <br> ${Util.timestampFormatterMilliseconds(event.startDate)} to ${Util.timestampFormatterMilliseconds(event.endDate)} (${Util.capitalizeFirstLetter(event.status)}).
        </h6>`;       
        let modalBody = `${event.description} 
        </p> Skills: <t class="text-success"> ${commonSkills.join(', ')} </t> - ${event.skills.join(', ')}.
        `;
        let modalFooter = `<div>
        <button id="share-button" class="btn">📋</button>
        <button id="join-volunteer-button" type="button" class="btn btn-primary">Join as Volunteer</button>
        <button id="join-attendee-button" type="button" class="btn btn-primary">Join as Attendee</button>
        </div>`;
        Util.modal(modalTitle, modalBody, modalFooter);
        eventHome_modal_addListeners(event);
    }

    async function eventHome_modal_addListeners(event){
        let volunteerButton = document.getElementById('join-volunteer-button');
        let attendeeButton = document.getElementById('join-attendee-button');
        let share = document.getElementById('share-button');
        if (event.status == STATUS.CANCELED || event.status == STATUS.ENDED){
            volunteerButton.disabled = true;
            attendeeButton.disabled = true;
        } else {
            volunteerButton.disabled = !event.allowVolunteers;
            attendeeButton.disabled = !event.allowAttendees;
        }
        share.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            Util.info(event.name, 'Event copied to clipboard.', COLOR.SUCCESS)
        });
        volunteerButton.addEventListener('click', async () => {
            if (event.volunteers.includes(currentUser.email)){
                if (event.volunteerList[Util.removeEmailDot(currentUser.email)].join) {
                    Util.info('Join Event as Volunteer Error', 'User is already an attendee.', COLOR.DANGER);
                    return;
                }
            }
            attendeeButton.disabled = true;
            if (await addVolunteerByEmailAndEvent(currentUser.email, event, EVENT_NOTIFICATIONS.VOLUNTEER_JOIN, true)) {
                notificationPing();
                Util.modalClose();
                home_page();
                Util.info('Join Event as Volunteer Success', `🍾🥳🎉`, COLOR.SUCCESS);
            } else {
                Util.info('Join Event as Volunteer Error', 'Server error.', COLOR.DANGER);
                attendeeButton.disabled = false;
            }
        });
        attendeeButton.addEventListener('click', async () => {
            if (event.attendees.includes(currentUser.email)){
                if (event.attendeeList[Util.removeEmailDot(currentUser.email)].join) {
                    Util.info('Join Event as Attendee Error', 'User is already an attendee.', COLOR.DANGER);
                    return;
                }
            }
                attendeeButton.disabled = true;
                if (await addAttendeeByEmailAndEvent(currentUser.email, event, EVENT_NOTIFICATIONS.ATTENDEE_JOIN, true)){
                    notificationPing();
                    Util.modalClose();
                    home_page();
                    Util.info('Join Event as Attendee Success', `🍾🥳🎉`, COLOR.SUCCESS);
                } else {
                    Util.info('Join Event as Attendee Error', 'Server error.', COLOR.DANGER);
                    attendeeButton.disabled = false;
                }
        });
        menuModal.modalCloseButton.addEventListener('click', home_page);

    }
}   