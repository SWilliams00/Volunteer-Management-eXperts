import { menu, menuInfo, menuModal } from "./Display/elements.js";

export const capitalizeFirstLetter = item => item.charAt(0).toUpperCase() + item.slice(1);
export const removeEmailDot = email => email.replace(/\./g, ' ');
export const addEmailDot = email => email.remove(/(.{2})/g, '$1.');
export const loadingPane = `<div class="d-flex align-items-center"><strong>Loading...</strong><div class="spinner-border ms-auto" role="status" aria-hidden="true"></div></div>`;
export const loadingCard = `<p class="placeholder-glow card card-body"><span class="placeholder col-12"></span></p>`;

export function info(title, body, color) {
    menuInfo.toastTitle.innerHTML = title;
    menuInfo.toastBody.innerHTML = body;
    menuInfo.toast._element.className = `toast ${color}`;
    menuInfo.toast.show();
}

export function modal(title, body, footer){
    menuModal.modalTitle.innerHTML = title;
    menuModal.modalBody.innerHTML = body;
    menuModal.modalFooter.innerHTML = footer;
    menuModal.modal.show();
}

export function modalClose(){
    menuModal.modal.hide();
}

export function resetButtonStyle(count, name, style) {
    for (let i = 0; i < count; i++) {
        let button = document.getElementById(name + i);
        button.classList = style;
    }
}

// menu.home.removeAttribute('aria-current');
// menu.accountSettings.setAttribute('aria-current', 'page'); Might want to add this to the function.
export function activeMenuButton(newActive) {
    const activeElements = document.querySelectorAll('.nav-link.active');
    activeElements.forEach((activeElement) => {
        activeElement.classList.remove('active');
    });
    newActive.classList.add('active');
}

export function timestampFormatter(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0'); 
    const minutes = String(date.getMinutes()).padStart(2, '0'); 
    const seconds = String(date.getSeconds()).padStart(2, '0'); 

    const formattedDate = `${month}/${day}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return `${formattedDate} ${formattedTime}`;
}


export function timestampFormatterMilliseconds(timestamp) {
    const date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const formattedDate = `${month}/${day}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return `${formattedDate} ${formattedTime}`;
}

export function timestampFormatterYYYYMMDDTIME(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return `${formattedDate}T${formattedTime}`;
}

export function datetimeLocalToUnixTime(timestamp){
    timestamp = timestamp.replace("T", " ");
    timestamp = timestamp.replace("-", "/");
    timestamp = timestamp.replace("-", "/");
    return Math.round(new Date(timestamp).getTime()/1000)
}

export function unixTimeToDatetimeLocal(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return`${year}-${month}-${day}T${hours}:${minutes}`;
}


export function notificationDateSortAscending(notifications) {
    const notificationsArray = Object.entries(notifications);
    notificationsArray.sort((a, b) => a[1].timestamp - b[1].timestamp);
    return (Object.fromEntries(notificationsArray));
}

export function notificationDateSortDescending(notifications) {
    const notificationsArray = Object.entries(notifications);
    notificationsArray.sort((a, b) => b[1].timestamp - a[1].timestamp);
    return (Object.fromEntries(notificationsArray));
}

export function deleteSkillByPlacement(placement, skill) {
    for (const key in skill) {
        if (skill.hasOwnProperty(key) && skill[key].placement === placement) {
            delete skill[key];
            break;
        }
    }
}