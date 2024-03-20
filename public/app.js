import * as FirebaseAuth from './controller/firebaseController.js';
import * as AccountSettings from './viewpage/Subject/accountSettingsSubject.js';
import * as Home from './viewpage/Display/home.js';
import * as Notifications from './viewpage/Observer/notificationObserver.js';
import * as EventManagement from './viewpage/Display/eventManagement.js';
import { routing } from './controller/route.js';

FirebaseAuth.addEventListener(); 
AccountSettings.addEventListener();
Home.addEventListener();
Notifications.addEventListener();
EventManagement.addEventListener();

window.onload = () => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;

    routing(pathname, hash);
};

window.addEventListener('popstate', e => {
    e.preventDefault(); 
    const pathname = e.target.location.pathname;
    const hash = e.target.location.hash;

    routing(pathname, hash);
});