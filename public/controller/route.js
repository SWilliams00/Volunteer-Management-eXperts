import { accountSettings_page } from "../viewpage/Subject/accountSettingsSubject.js";
import { ROUTE_PATH } from "../model/constants.js";
import { home_page } from "../viewpage/Display/home.js";
import { eventManagement_page } from "../viewpage/Display/eventManagement.js";
import { eventHome_page } from "../viewpage/Display/home.js";

export const routes = [
    {path: ROUTE_PATH.HOME, page: home_page},
    {path: ROUTE_PATH.ACCOUNT_SETTINGS, page: accountSettings_page},
    {path: ROUTE_PATH.EVENT_MANAGEMENT, page: eventManagement_page}
];

export function routing(pathname, hash){
    if (pathname.startsWith('/e-')){
        const eventUUID = pathname.substring(3);
        eventHome_page(eventUUID);
        return;
    }

    const route = routes.find(element => element.path == pathname);
     if (route) route.page();
     else routes[0].page();
}