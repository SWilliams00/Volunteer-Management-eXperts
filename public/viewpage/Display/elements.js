export const root = document.getElementById('root');

export const menu = {
    signOut: document.getElementById('menu-signout'),
    signIn: document.getElementById('form-signin'),
    signUp: document.getElementById('form-signup'),
    signUpModal: new bootstrap.Modal(document.getElementById('signUpModal'), {backdrop: 'static'}),
    accountSettings: document.getElementById('menu-settings'),
    home: document.getElementById('menu-home'),
    notificationsButton: document.getElementById('menu-notifications-button'),
    menuArea: document.getElementById('menu'),
    signInPreAuth: document.getElementById('menu-signin'),
    eventManagement: document.getElementById('menu-management')
}

export const menuModal = {
    modal: new bootstrap.Modal(document.getElementById('menu-modal'), {backdrop: 'static'}),
    modalTitle: document.getElementById('menu-modal-title'),
    modalBody: document.getElementById('menu-modal-body'),
    modalFooter: document.getElementById('menu-modal-footer'),
    modalCloseButton: document.getElementById('modal-close-button')
}

export const menuInfo = {
    toast: new bootstrap.Toast(document.getElementById('menu-toast'), {backdrop: 'static'}),
    toastTitle: document.getElementById('menu-toast-title'),
    toastBody: document.getElementById('menu-toast-body')
}

export const menuNotifications = {
    notifications: new bootstrap.Offcanvas(document.getElementById('menu-notifications'), {backdrop: 'static'}),
    notificationsTitle: document.getElementById('menu-notifications-title'),
    notificationsBody: document.getElementById('menu-notifications-body'),
    notificationsHelpButton: document.getElementById('notifications-help-button'),
    notificationsHelp: document.getElementById('notifications-help')
}