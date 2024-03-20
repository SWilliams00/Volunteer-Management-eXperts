import { menu, menuNotifications } from "../Display/elements.js";
import { dismissNotification, getNotifications } from "../../controller/firebaseController.js";
import { accountSettings_page } from "../Subject/accountSettingsSubject.js";
import { eventManagement_page } from "../Display/eventManagement.js";
import { ROUTE_PATH } from "../../model/constants.js";
import { currentUser, notificationShowCount } from "../../controller/firebaseController.js";
import { eventHome_page } from "../Display/home.js";
import * as Util from "../util.js";

let notificationCount = 0;

export function addEventListener() {
    menu.notificationsButton.addEventListener('click', async () => {
        notificationHandler_panel();
        notificationPing();
    });
    menuNotifications.notificationsHelpButton.addEventListener('click', async () => {
        if (menuNotifications.notificationsHelp.innerHTML == ''){
            menuNotifications.notificationsHelp.innerHTML = '<b class="text-primary">Open</b>: Redirect to the notification reference. <b class="text-danger">Dismiss</b>: Dismiss the notification. <br> Go to Account Settings to see your notification history.';
        } else {
            menuNotifications.notificationsHelp.innerHTML = '';
        }
    });
}

export async function notificationHandler_panel() {
    if (currentUser) {
        let q = await getNotifications();
        q = Util.notificationDateSortDescending(q);
        menuNotifications.notificationsBody.innerHTML = "";
        Object.values(q).forEach(noti => {
            if (noti.show) {
                const card = document.createElement("div");
                card.classList.add("card");
                card.innerHTML = `
                    <div class="card-header">
                        <b>${noti.subject}</b> - ${Util.timestampFormatter(noti.timestamp)}
                    </div>
                    <div class="card-body">
                        <p class="card-text">${noti.message}</p>
                        <a data-menu="${noti.menu}" type="button" class="btn btn-primary">Open</a>
                        <a id="dismiss" type="button" class="btn btn-danger">Dismiss</a>
                    </div>`;
                const openButton = card.querySelector('[data-menu]');
                openButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    redirect(noti.menu);
                });
                const dismissButton = card.querySelector('[id]');
                dismissButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    notificationPingSubtractOne();
                    dismissNotification(noti);
                    card.remove();
                });
                menuNotifications.notificationsBody.appendChild(card);
                menuNotifications.notificationsBody.insertAdjacentHTML('beforeend', '<br>');
            }
        });
        menuNotifications.notifications.show();
    }
}

export async function redirect(destination) {
    if (currentUser && destination == ROUTE_PATH.ACCOUNT_SETTINGS) {
        accountSettings_page();
    } else if (currentUser && destination == ROUTE_PATH.EVENT_MANAGEMENT) {
        eventManagement_page();
    } else if (currentUser && destination.startsWith('/e-')) {
        const eventUUID = destination.substring(3);
        await menuNotifications.notifications.hide();
        eventHome_page(eventUUID);
    }
}

export async function notificationPing() {
    notificationCount = await notificationShowCount();
    let emoji;
    let notificationText = 'Notifications';
    if (notificationCount === 1) {
        emoji = '1️⃣';
        notificationText = 'Notification';
    } else if (notificationCount <= 9) {
        emoji = `${notificationCount}️⃣`;
    } else if (notificationCount == 10){
        emoji = '🔟';
    } else {
        emoji = '*️⃣';
    }

    menu.notificationsButton.innerHTML = `${emoji} ${notificationText}`;
}

export async function notificationPingSubtractOne(){
    notificationCount = notificationCount-1;
    let emoji;
    let notificationText = 'Notifications';
    if (notificationCount === 1) {
        emoji = '1️⃣';
        notificationText = 'Notification';
    } else if (notificationCount <= 9) {
        emoji = `${notificationCount}️⃣`;
    } else if (notificationCount == 10){
        emoji = '🔟';
    } else {
        emoji = '*️⃣';
    }
    menu.notificationsButton.innerHTML = `${emoji} ${notificationText}`;
}

export async function notificationPingAddOne(){
    notificationCount = notificationCount+1;
    let emoji;
    let notificationText = 'Notifications';
    if (notificationCount === 1) {
        emoji = '1️⃣';
        notificationText = 'Notification';
    } else if (notificationCount <= 9) {
        emoji = `${notificationCount}️⃣`;
    } else if (notificationCount == 10){
        emoji = '🔟';
    } else {
        emoji = '*️⃣';
    }
    menu.notificationsButton.innerHTML = `${emoji} ${notificationText}`;
}