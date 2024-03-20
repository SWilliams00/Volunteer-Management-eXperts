import { menu, root } from "../Display/elements.js";
import * as Util from "../util.js";
import { currentUser, dismissNotification, getUserSkills, getNotifications, enableNotification, getSkills, addUserSkills, deleteUserSkills } from "../../controller/firebaseController.js";
import { notificationPing, notificationPingAddOne, notificationPingSubtractOne, redirect } from "../Observer/notificationObserver.js";
import { ROUTE_PATH, SKILLS, COLOR } from "../../model/constants.js";

export function addEventListener() {
    menu.accountSettings.addEventListener('click', async () => {
        accountSettings_page();
    });
}

let screen = {
    addRemoveSkillsButton: null,
    addRemoveSkills: null,
    notificationHistoryButton: null,
    notificationHistory: null,
}

let addRemoveSkillsSwitch = false;
let skillsCount;
let notificationHistorySwitch = false;
let notificationCount;

export async function accountSettings_page() {
    history.pushState(null, null, '/account-settings');
    if (currentUser) {
        notificationPing();
        Util.activeMenuButton(menu.accountSettings);
        root.innerHTML = Util.loadingPane;
        let html;
        const response = await fetch('/viewpage/templates/accountSettings_page.html', { cache: 'no-store' });
        html = await response.text();
        root.innerHTML = html;

        getScreenElements();
        await addListeners();
    }
}

function getScreenElements() {
    screen.addRemoveSkillsButton = document.getElementById('add-remove-skills-button');
    screen.addRemoveSkills = document.getElementById('add-remove-skills');
    screen.notificationHistoryButton = document.getElementById('notification-history-button');
    screen.notificationHistory = document.getElementById('notification-history');
}

async function addListeners() {
    screen.addRemoveSkillsButton.addEventListener('click', async () => {
        if (!addRemoveSkillsSwitch) {
            screen.addRemoveSkills.innerHTML = Util.loadingCard;
            screen.addRemoveSkills.innerHTML = await addRemoveSkills_card();
            addRemoveSkills_card_addListeners();
        } else if (addRemoveSkillsSwitch) {
            screen.addRemoveSkills.innerHTML = "";
        }
        addRemoveSkillsSwitch = !addRemoveSkillsSwitch;
    });
    screen.notificationHistoryButton.addEventListener('click', async () => {
        if (!notificationHistorySwitch) {
            screen.notificationHistory.innerHTML = Util.loadingCard;
            screen.notificationHistory.innerHTML = await notificationHistory_card();
            notificationHistory_card_addListeners();
        } else if (notificationHistorySwitch) {
            screen.notificationHistory.innerHTML = "";
        }
        notificationHistorySwitch = !notificationHistorySwitch;
    });
}

export async function addRemoveSkills_card() {
    notificationPing();
    skillsCount = -1;
    let card = `<div class="card card-body">`;
    const userSkills = await getUserSkills(currentUser.email);
    const documents = Object.values(SKILLS);
    const lastDocument = documents[Object.keys(documents)[Object.keys(documents).length - 1]];

    for (const document of documents) {
        const skills = await getSkills(document);
        card += `<div><b> ${Util.capitalizeFirstLetter(document)} </b>`;
        for (const skill of Object.values(skills)) {
            skillsCount++;
            const isChecked = userSkills.includes(skill);
            card += `
            <input type="checkbox" class="btn-check" id="button-check-outlined-${skillsCount}" 
                   autocomplete="off" ${isChecked ? 'checked data-check="true"' : ''}>
            <label id="label-check-outlined-${skillsCount}" class="btn btn-outline-light btn-sm" for="button-check-outlined-${skillsCount}">${skill}</label>
          `;
        }
        if (document !== lastDocument) {
            card += '</p>';
        }
    }
    card += `</div>
    <button id="add-remove-submit-button" type="button" class="btn btn-primary">Submit</button>
    <t id="add-remove-help-button">❔</t> <t id="add-remove-help"></t>
    </div>`;
    return card;
}


export async function addRemoveSkills_card_addListeners() {
    // document.getElementById('button-check-outlined-0').checked = true;
    let addSkill = {};
    let removeSkill = {};
    document.getElementById('add-remove-help-button').addEventListener('click', () => {
        if (document.getElementById('add-remove-help').innerHTML == "") {
            document.getElementById('add-remove-help').innerHTML = `</p> <b class="text-light">White</b>: Current skill. <b class="text-danger">Red</b>: Removed from current skill list. <b class="text-success">Green</b>: Adding to skill list. <br> (Skills are public information)`;
        } else {
            document.getElementById('add-remove-help').innerHTML = "";
        }
    });
    for (let i = 0; i <= skillsCount; i++) {
        let button = document.getElementById('button-check-outlined-' + i)
        let label = document.getElementById('label-check-outlined-' + i);
        button.addEventListener('click', () => {
            if (button.getAttribute('data-check') == "true") {
                label.classList = 'btn btn-outline-danger btn-sm';
                button.setAttribute('data-check', 'false');
                removeSkill[Object.keys(removeSkill).length] = { placement: i, skill: label.innerText }
            } else if (button.getAttribute('data-check') == "false") {
                label.classList = 'btn btn-outline-light btn-sm';
                button.setAttribute('data-check', 'true');
                Util.deleteSkillByPlacement(i, removeSkill);
            } else {
                if (label.classList == 'btn btn-outline-success btn-sm') {
                    label.classList = 'btn btn-outline-light btn-sm';
                    Util.deleteSkillByPlacement(i, addSkill);
                } else {
                    label.classList = 'btn btn-outline-success btn-sm';
                    addSkill[Object.keys(addSkill).length] = { placement: i, skill: label.innerText }
                }
            }
        });
    }
    document.getElementById('add-remove-submit-button').addEventListener('click', () => {
        if (Object.keys(addSkill).length > 0 || Object.keys(removeSkill).length > 0) {
            document.getElementById('add-remove-submit-button').setAttribute("disabled", `${true}`);
            if (Object.keys(addSkill).length > 0) {
                for (let i = 0; i < Object.keys(addSkill).length; i++) {
                    addUserSkills(addSkill[i].skill);
                    document.getElementById('label-check-outlined-' + addSkill[i].placement).classList = "btn btn-outline-light btn-sm";
                    document.getElementById('label-check-outlined-' + addSkill[i].placement).check = true;
                }
                addSkill = {};
            }
            if (Object.keys(removeSkill).length > 0) {
                for (let i = 0; i < Object.keys(removeSkill).length; i++) {
                    deleteUserSkills(removeSkill[i].skill);
                    document.getElementById('label-check-outlined-' + removeSkill[i].placement).classList = "btn btn-outline-light btn-sm";
                    document.getElementById('label-check-outlined-' + removeSkill[i].placement).check = false;
                }
                removeSkill = {};
            }
            document.getElementById('add-remove-submit-button').removeAttribute("disabled");
        } else {
            document.getElementById('add-remove-submit-button').removeAttribute("disabled");
            Util.info('Add/Remove Skill Error', 'No skills are being added or removed.', COLOR.WARNING);
        }
    });
}

export async function notificationHistory_card() {
    let card = `<div class="card card-body"> <table class="table table-hover">
    <thead>
    <tr>
      <th scope="col">Time</th>
      <th scope="col">Subject</th>
      <th scope="col">Message</th>
      <th scope="col">Action <t id="notification-history-help-button">❔</t></th>
    </tr>
  </thead>
  <t id="notification-history-help">

`;
    notificationPing();
    let notifications = await getNotifications();
    notifications = Util.notificationDateSortDescending(notifications);
    notificationCount = -1;
    Object.values(notifications).forEach(notification => {
        notificationCount++;
        if (notification.show) {
            card += `
            <tr>
                <td>${Util.timestampFormatter(notification.timestamp)}</td>
                <td><b>${notification.subject}</b></td>
                <td>${notification.message}</td>`;
            if (notification.menu == ROUTE_PATH.ACCOUNT_SETTINGS) {
                card += `<td><button id="open-button-${notificationCount}" data-menu="${notification.menu}" class="btn btn-primary btn-sm" disabled>Open</button>`;
            } else {
                card += `<td><a id="open-button-${notificationCount}" data-menu="${notification.menu}" class="btn btn-primary btn-sm">Open</a>`;
            }
            card += `
            <a id="dismiss-enable-button-${notificationCount}" type="button" class="btn btn-danger btn-sm" data-map='${JSON.stringify(notification)}'>Dismiss</a></td></tr>`;

        } else if (!notification.show) {
            card += `
            <tr>
                <td>${Util.timestampFormatter(notification.timestamp)}</td>
                <td><b>${notification.subject}</b></td>
                <td>${notification.message}</td>`;
            if (notification.menu == ROUTE_PATH.ACCOUNT_SETTINGS) {
                card += `<td><button id="open-button-${notificationCount}" data-menu="${notification.menu}" class="btn btn-primary btn-sm" disabled>Open</button>`;
            } else {
                card += `<td><a id="open-button-${notificationCount}" data-menu="${notification.menu}" class="btn btn-primary btn-sm">Open</a>`;
            }
            card += `
            <a id="dismiss-enable-button-${notificationCount}" type="button" class="btn btn-success btn-sm" data-map='${JSON.stringify(notification)}'>Enable</a></td></tr>`;
        }
    });
    card += '</table></div>';
    return card;
}

export async function notificationHistory_card_addListeners() {
    document.getElementById('notification-history-help-button').addEventListener('click', () => {
        if (document.getElementById('notification-history-help').innerHTML == "") {
            document.getElementById('notification-history-help').innerHTML = `<b class="text-primary">Open</b>: Redirect to the notification reference. <b class="text-danger">Dismiss</b>: Dismiss the notification. <b class="text-success">Enable</b>: Enables the notification.`;

        } else {
            document.getElementById('notification-history-help').innerHTML = "";
        }
    });
    for (let i = 0; i <= notificationCount; i++) {
        document.getElementById('open-button-' + i).addEventListener('click', async () => {
            redirect(document.getElementById('open-button-' + i).getAttribute('data-menu'));
        });
        document.getElementById('dismiss-enable-button-' + i).addEventListener('click', async () => {
            if (document.getElementById('dismiss-enable-button-' + i).innerText == 'Dismiss') {
                dismissNotification(JSON.parse(document.getElementById('dismiss-enable-button-' + i).getAttribute('data-map')));
                notificationPingSubtractOne();
                document.getElementById('dismiss-enable-button-' + i).innerText = 'Enable';
                document.getElementById('dismiss-enable-button-' + i).classList = 'btn btn-success btn-sm'
            } else if (document.getElementById('dismiss-enable-button-' + i).innerText == 'Enable') {
                enableNotification(JSON.parse(document.getElementById('dismiss-enable-button-' + i).getAttribute('data-map')));
                notificationPingAddOne();
                document.getElementById('dismiss-enable-button-' + i).innerText = 'Dismiss';
                document.getElementById('dismiss-enable-button-' + i).classList = 'btn btn-danger btn-sm'
            }
        });
    }
}