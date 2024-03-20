import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, setDoc, doc, getDoc, arrayUnion, updateDoc, where, query, getDocs, arrayRemove, addDoc, deleteField  } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import * as Elements from '../viewpage/Display/elements.js';
import { Account } from '../model/account.js';
import { COLLECTION, COLOR, ACCOUNT_SETTINGS_NOTIFICATIONS, ROUTE_PATH, EVENT_NOTIFICATIONS } from "../model/constants.js";
import * as Util from '../viewpage/util.js';
import { routing } from './route.js';

const auth = getAuth();
export let currentUser = null;

export function addEventListener() {

    onAuthStateChanged(auth, authStateChanged);

    Elements.menu.signIn.addEventListener('submit', async e => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        if (email.trim() === '' || password.trim() === '') {
            Util.info('Sign In Error: ', 'No email or password', COLOR.DANGER);
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            Util.info(`Account (${email})`, 'Signed in successfully.', COLOR.SUCCESS);
        } catch (error) {
            Util.info('Sign In Error', `${error.code} | ${error.message}`, COLOR.DANGER);
        }
    });

    Elements.menu.signUp.addEventListener('submit', async e => {
        e.preventDefault();
        const email = e.target.email.value;
        const fname = e.target.fname.value;
        const lname = e.target.lname.value;
        const age = parseInt(e.target.age.value);
        const mailing = e.target.mailing.value;
        const password = e.target.password.value;
        const accountData = {
            email: email,
            fname: fname,
            lname: lname,
            age: age,
            mailing: mailing,
            skills: [],
            notifications: [
                { menu: ROUTE_PATH.ACCOUNT_SETTINGS, subject: ACCOUNT_SETTINGS_NOTIFICATIONS.SKILLS.subject, message: ACCOUNT_SETTINGS_NOTIFICATIONS.SKILLS.message, show: true },
            ],
            events: [],
            eventsHistory: [],
            eventOrganizer: [],
        }
        const data = new Account(accountData);

        if (fname.trim() === '' || lname.trim() === '' || age === '' || mailing.trim() === '' || email.trim() === '' || password.trim() === '') {
            Util.info('Sign In Error', 'Please fill in all the fields.', COLOR.WARNING);
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Util.info('Account created', `You are now signed in as ${email}`, COLOR.SUCCESS)
        } catch (e) {
            console.error(e);
            Util.info('Account Error', `Failed to create account: ${e}`, COLOR.DANGER);
            return;
        }

        try {
            await setDoc(doc(collection(getFirestore(), COLLECTION.ACCOUNTS), accountData.email), data.serialize());
            Util.info('Account', `Account data created`, COLOR.PRIMARY);
            Elements.menu.signUpModal.hide();
        } catch (e) {
            console.error(e);
            Util.info('Account Error', `Failed to create account data: ${e}`, COLOR.DANGER);
            Elements.menu.signUpModal.hide();
        }
    });

    Elements.menu.signOut.addEventListener('click', async () => {
        try {
            await signOut(auth);
            Util.info(`Account`, 'Signed out successfully.', COLOR.SUCCESS);
            Util.activeMenuButton(Elements.menu.signInPreAuth);
            history.pushState(null, null, '/');
        } catch (e) {
            console.error(e);
        }
    });

    async function authStateChanged(user) {
        currentUser = user;
        if (user) {
            let menus = document.getElementsByClassName('modal-preauth');
            for (let i = 0; i < menus.length; i++) {
                menus[i].style.display = 'none';
            }
            menus = document.getElementsByClassName('modal-postauth');
            for (let i = 0; i < menus.length; i++) {
                menus[i].style.display = 'block';
            }
            const pathname = window.location.pathname;
            const hash = window.location.hash;
            routing(pathname, hash);
        } else {
            history.pushState(null, null, '/');
            Util.activeMenuButton(Elements.menu.signInPreAuth);
            let menus = document.getElementsByClassName('modal-preauth');
            for (let i = 0; i < menus.length; i++) {
                menus[i].style.display = 'block';
            }
            menus = document.getElementsByClassName('modal-postauth');
            for (let i = 0; i < menus.length; i++) {
                menus[i].style.display = 'none';
            }
        }

    }
}

export async function addEvent(event) {
    if (getAuth().currentUser) {
        try {
            const docRef = await addDoc(collection(getFirestore(), COLLECTION.EVENTS), event.serialize(0));
            let qS = doc(getFirestore(), COLLECTION.EVENTS, docRef.id);
            await updateDoc(qS, {
                uuid: docRef.id
            });
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
            await updateDoc(qS, {
                [COLLECTION.EVENT_ORGANIZER + "." + docRef.id]: { uuid: docRef.id, name: event.name, status: event.status }
            });
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
            const time = Date.now()
            await updateDoc(qS, {
                [COLLECTION.NOTIFICATIONS + "." + time]: {
                    timestamp: time,
                    menu: ROUTE_PATH.EVENT_MANAGEMENT,
                    subject: EVENT_NOTIFICATIONS.EVENT_CREATED.subject,
                    message: EVENT_NOTIFICATIONS.EVENT_CREATED.message + ` Event: ${docRef.id}`,
                    show: true
                }
            });
            Util.info(`Event: ${docRef.id}`, `Event created successfully.`, COLOR.SUCCESS);
            return docRef.id;
        } catch (e) {
            console.error(e);
            Util.info('Event Creation Error', `Failed to create event: ${e}`, COLOR.DANGER);
            return null;
        }
    }
}

export async function getUserEventsBasedOnJoined(join) {
    if (getAuth().currentUser) {
        if (getAuth().currentUser) {
            let returnList = [];
            const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
            const qSS = await getDoc(qS);
            const data = qSS.data();
            let i = 0;

            if (data && typeof data[COLLECTION.EVENTS] === 'object') {
                const events = data[COLLECTION.EVENTS];
                Object.keys(events).forEach((key) => {
                    const item = events[key];
                    if (item.join === join) {
                        returnList[i] = item;
                        i++;
                    }
                });
            }
            return returnList;
        }
    }
}


export async function getUserOrganizerEventsUUIDs() {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        const qSS = await getDoc(qS)
        return qSS.data() ? qSS.data()[COLLECTION.EVENT_ORGANIZER] : null;
    }
    return null;
}

export async function getAllEventEmailsByUUID(uuid) {
    if (getAuth().currentUser) {
        let emailList = [];
        const qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
        const qSS = await getDoc(qS);
        if (qSS.data()[COLLECTION.ORGANIZER_EMAIL].length > 0) {
            emailList = emailList.concat(qSS.data()[COLLECTION.ORGANIZER_EMAIL]);
        }
        if (qSS.data()[COLLECTION.VOLUNTEERS].length > 0) {
            emailList = emailList.concat(qSS.data()[COLLECTION.VOLUNTEERS]);
        }
        if (qSS.data()[COLLECTION.ATTENDEES].length > 0) {
            emailList = emailList.concat(qSS.data()[COLLECTION.ATTENDEES]);
        }
        emailList = Array.from(new Set(emailList));
        return emailList;
    }
    return null;
}

export async function getFirstLastNameFromEmailList(emailList) {
    if (getAuth().currentUser) {
        const promises = emailList.map(async (email) => {
            const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
            const qSS = await getDoc(qS);
            return { fname: qSS.data()['fname'], lname: qSS.data()['lname'], email: email };
        });

        const names = await Promise.all(promises);
        return names;
    }
}
export async function getFirstLastNameFromEmail(email) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        const qSS = await getDoc(qS);
        return { fname: qSS.data()['fname'], lname: qSS.data()['lname'], email: email };
    }
}

export async function getDataFromVolunteerAttendeeListViaUUID(uuid) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
        const qSS = await getDoc(qS);

        const volunteerMap = qSS.data()[COLLECTION.VOLUNTEER_LIST];
        const attendeeMap = qSS.data()[COLLECTION.ATTENDEE_LIST];

        const promises = [];

        if (volunteerMap && typeof volunteerMap === "object") {
            const volunteerList = Object.values(volunteerMap);
            promises.push(...volunteerList.map(async (person) => {
                return { fname: person.fname, lname: person.lname, email: person.email, type: "volunteer", join: person.join };
            }));
        }

        if (attendeeMap && typeof attendeeMap === "object") {
            const attendeeList = Object.values(attendeeMap);
            promises.push(...attendeeList.map(async (person) => {
                return { fname: person.fname, lname: person.lname, email: person.email, type: "attendee", join: person.join };
            }));
        }

        const data = await Promise.all(promises);
        return data;
    }
}

export async function addOrganizersByEmailAndEvent(email, event) {
    if (getAuth().currentUser) {
        let qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.EVENT_ORGANIZER + "." + event.uuid]: {
                ["status"]: event.status,
                ["name"]: event.name,
                ["uuid"]: event.uuid,
            }
        });
        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.ORGANIZER_EMAIL]: arrayUnion(email)
        });
        let time = Date.now();
        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.NOTIFICATIONS + "." + time]: {
                timestamp: time,
                menu: event.uuid,
                subject: EVENT_NOTIFICATIONS.NEW_EVENT_ORGANIZER.subject,
                message: EVENT_NOTIFICATIONS.NEW_EVENT_ORGANIZER.message + `${event.name}: ` + ` ${event.uuid}`,
                show: true
            }
        });
        return true;
    } else {
        return false;
    }
}

export async function addAttendeeByEmailAndEvent(email, event, notification, join) {
    if (getAuth().currentUser) {
        let qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.EVENTS + "." + event.uuid]: {
                ["status"]: event.status,
                ["name"]: event.name,
                ["uuid"]: event.uuid,
                ["attendance"]: "",
                ["join"]: join,
            }
        });
        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.ATTENDEES]: arrayUnion(email)
        });

        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        let fnamelname = await getFirstLastNameFromEmail(email);
        await updateDoc(qS, {
            [COLLECTION.ATTENDEE_LIST + "." + Util.removeEmailDot(email)]: {
                ["status"]: event.status,
                ["name"]: event.name,
                ["uuid"]: event.uuid,
                ["attendance"]: "",
                ["join"]: join,
                ["email"]: email,
                ["fname"]: fnamelname.fname,
                ["lname"]: fnamelname.lname,
            }
        });

        let time = Date.now();
        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.NOTIFICATIONS + "." + time]: {
                timestamp: time,
                menu: ROUTE_PATH.E + event.uuid,
                subject: notification.subject,
                message: notification.message + `${event.name} ` + `(${event.uuid})`,
                show: true
            }
        });
        return true;
    } else {
        return false;
    }
}


export async function removeAttendeeByEmailAndEvent(email, event) { 
    if (getAuth().currentUser) {

        let qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.ATTENDEES]: arrayRemove(email)
        });

        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.ATTENDEES]: arrayRemove(email)
        });

        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.EVENTS + "." + event.uuid]: deleteField()
        });

        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.ATTENDEE_LIST + "." + Util.removeEmailDot(email)]: deleteField()
        });

        let time = Date.now();
        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.NOTIFICATIONS + "." + time]: {
                timestamp: time,
                menu: ROUTE_PATH.E + event.uuid,
                subject: EVENT_NOTIFICATIONS.ATTENDEE_REMOVE.subject,
                message: `${email}` + EVENT_NOTIFICATIONS.ATTENDEE_REMOVE.message + `${event.name} ` + `(${event.uuid})`,
                show: true
            }
        });
        const emails =  await getOrganizersEmailsByUUID(event.uuid)
        for (const em of emails) {
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, em);
            await updateDoc(qS, {
                [COLLECTION.NOTIFICATIONS + "." + time]: {
                    timestamp: time,
                    menu: ROUTE_PATH.E + event.uuid,
                    subject: EVENT_NOTIFICATIONS.ATTENDEE_REMOVE.subject,
                    message: `${email}` + EVENT_NOTIFICATIONS.ATTENDEE_REMOVE.message + `${event.name} ` + `(${event.uuid})`,
                    show: true
                }
            });
        }
        return true;
    } else {
        return false;
    }
}

export async function removeVolunteerByEmailAndEvent(email, event) { //comeback
    if (getAuth().currentUser) {

        let qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.VOLUNTEERS]: arrayRemove(email)
        });

        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.VOLUNTEERS]: arrayRemove(email)
        });

        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.EVENTS + "." + event.uuid]: deleteField()
        });

        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.VOLUNTEER_LIST + "." + Util.removeEmailDot(email)]: deleteField()
        });

        let time = Date.now();
        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.NOTIFICATIONS + "." + time]: {
                timestamp: time,
                menu: ROUTE_PATH.E + event.uuid,
                subject: EVENT_NOTIFICATIONS.VOLUNTEER_REMOVE.subject,
                message: `${email}` + EVENT_NOTIFICATIONS.VOLUNTEER_REMOVE.message + `${event.name} ` + `(${event.uuid})`,
                show: true
            }
        });
        const emails =  await getOrganizersEmailsByUUID(event.uuid)
        for (const em of emails) {
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, em);
            await updateDoc(qS, {
                [COLLECTION.NOTIFICATIONS + "." + time]: {
                    timestamp: time,
                    menu: ROUTE_PATH.E + event.uuid,
                    subject: EVENT_NOTIFICATIONS.VOLUNTEER_REMOVE.subject,
                    message: `${email}` + EVENT_NOTIFICATIONS.VOLUNTEER_REMOVE.message + `${event.name} ` + `(${event.uuid})`,
                    show: true
                }
            });
        }
        return true;
    } else {
        return false;
    }
}


export async function addVolunteerByEmailAndEvent(email, event, notification, join) {
    if (getAuth().currentUser) {
        let qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.EVENTS + "." + event.uuid]: {
                ["status"]: event.status,
                ["name"]: event.name,
                ["uuid"]: event.uuid,
                ["attendance"]: "",
                ["join"]: join,
            }
        });
        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        await updateDoc(qS, {
            [COLLECTION.VOLUNTEERS]: arrayUnion(email)
        });

        qS = doc(getFirestore(), COLLECTION.EVENTS, event.uuid);
        let fnamelname = await getFirstLastNameFromEmail(email);
        await updateDoc(qS, {
            [COLLECTION.VOLUNTEER_LIST + "." + Util.removeEmailDot(email)]: {
                ["status"]: event.status,
                ["name"]: event.name,
                ["uuid"]: event.uuid,
                ["attendance"]: "",
                ["join"]: join,
                ["email"]: email,
                ["fname"]: fnamelname.fname,
                ["lname"]: fnamelname.lname,
            }
        });

        let time = Date.now();
        qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        await updateDoc(qS, {
            [COLLECTION.NOTIFICATIONS + "." + time]: {
                timestamp: time,
                menu: ROUTE_PATH.E + event.uuid,
                subject: notification.subject,
                message: notification.message + `${event.name} ` + ` (${event.uuid})`,
                show: true
            }
        });
        return true;
    } else {
        return false;
    }
}

export async function getOrganizersEmailsByUUID(uuid) {
    if (getAuth().currentUser) {
        let emailList = [];
        const qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
        const qSS = await getDoc(qS);
        if (qSS.data()[COLLECTION.ORGANIZER_EMAIL].length > 0) {
            emailList = emailList.concat(qSS.data()[COLLECTION.ORGANIZER_EMAIL]);
        }
        return emailList;
    }
    return null;
}


// export async function getVolunteersEmailsByUUID(uuid) {
//     if (getAuth().currentUser) {
//         let emailList = [];
//         const qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
//         const qSS = await getDoc(qS);
//         if (qSS.data()[COLLECTION.VOLUNTEERS].length > 0){
//             emailList = emailList.concat(qSS.data()[COLLECTION.VOLUNTEERS]);
//         }
//         return emailList;
//     }
//     return null;
// }

export async function getEventByUUID(uuid) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
        const qSS = await getDoc(qS)
        return qSS.data();
    }
}

export async function updateStatusByUUID(uuid, status, show) {
    if (getAuth().currentUser) {
        let qS = doc(getFirestore(), COLLECTION.EVENTS, uuid);
        await updateDoc(qS, {
            status: status
        });
        let emailList = await getAllEventEmailsByUUID(uuid);
        let time = Date.now();
        emailList.forEach(async (email) => {
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
            await updateDoc(qS, {
                [COLLECTION.NOTIFICATIONS + "." + time]: {
                    timestamp: time,
                    menu: ROUTE_PATH.E + uuid,
                    subject: EVENT_NOTIFICATIONS.EVENT_STATUS_CHANGED.subject,
                    message: EVENT_NOTIFICATIONS.EVENT_STATUS_CHANGED.message + `${status}.` + ` Event: ${uuid}`,
                    show: true
                }
            });
        });
        emailList = await getOrganizersEmailsByUUID(uuid);
        emailList.forEach(async (email) => {
            qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
            await updateDoc(qS, {
                [COLLECTION.EVENT_ORGANIZER + "." + uuid + ".status"]: status
            });
        });
        return true;
    }
    return false;
}

export async function getSkills(document) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.SKILLS, document);
        const qSS = await getDoc(qS)
        return qSS.data();
    }
    return null;
}

export async function getUserSkills(email) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, email);
        const qSS = await getDoc(qS)
        return qSS.data() ? qSS.data()[COLLECTION.SKILLS] : null;
    }
    return null;
}

export async function addUserSkills(skill) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        await updateDoc(qS, {
            [COLLECTION.SKILLS]: arrayUnion(skill)
        });
    }
}

export async function deleteUserSkills(skill) {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        await updateDoc(qS, {
            [COLLECTION.SKILLS]: arrayRemove(skill)
        });
    }
}


export async function getNotifications() {
    if (getAuth().currentUser) {
        const qS = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        const qSS = await getDoc(qS)
        return qSS.data() ? qSS.data()[COLLECTION.NOTIFICATIONS] : null;
    }
    return null;
}

export async function dismissNotification(notification) {
    if (getAuth().currentUser) {
        const ref = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        const update = {
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".menu"]: notification.menu,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".subject"]: notification.subject,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".message"]: notification.message,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".show"]: false
        };
        updateDoc(ref, update);
    }
}

export async function enableNotification(notification) {
    if (getAuth().currentUser) {
        const ref = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        const update = {
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".menu"]: notification.menu,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".subject"]: notification.subject,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".message"]: notification.message,
            [COLLECTION.NOTIFICATIONS + "." + notification.timestamp + ".show"]: true
        };
        updateDoc(ref, update);
    }
}

export async function notificationShowCount() {
    if (getAuth().currentUser) {
        const userRef = doc(getFirestore(), COLLECTION.ACCOUNTS, getAuth().currentUser.email);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const notifications = userData.notifications;
            let count = 0;
            for (const key in notifications) {
                if (notifications.hasOwnProperty(key) && notifications[key].show) {
                    count++;
                }
            }
            return count;
        }
    }
}
