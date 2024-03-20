export const COLLECTION = {
    ACCOUNTS: 'accounts',
    NOTIFICATIONS: 'notifications',
    SKILLS: 'skills',
    EVENTS: 'events',
    EVENT_ORGANIZER: 'eventOrganizer',
    ORGANIZER_EMAIL: 'organizersEmail',
    ATTENDEE_LIST: 'attendeeList',
    VOLUNTEER_LIST: 'volunteerList',
    ATTENDEES: 'attendees',
    VOLUNTEERS: 'volunteers',

}

export const STATUS = {
    UPCOMING: 'upcoming',
    ENDED: 'ended',
    CANCELED: 'canceled',
    ON_HOLD: 'on hold'
}

export const SKILLS = {
    COMMUNICATION: 'communication',
    TRANSPORTATION: 'transportation'
}

export const COLOR = {
    NONE: '-',
    SUCCESS: 'text-bg-success',
    PRIMARY: 'text-bg-primary',
    DARK: 'text-bg-dark',
    DANGER: 'text-bg-danger',
    WARNING: 'text-bg-warning'
}

export const ACCOUNT_SETTINGS_NOTIFICATIONS = {
    SKILLS: {subject: "Add Skills", message: "Go into Account Settings and add skills."},
}

export const EVENT_NOTIFICATIONS = {
    EVENT_CREATED: {subject: "New Event Created", message: "Go into Event Managment to view/edit."},
    EVENT_STATUS_CHANGED: {subject: "Event Status Changed", message: "Event status has changed to "},
    NEW_EVENT_ORGANIZER: {subject: "Event Organizer", message: "You are now an organizer for: "},
    ATTENDEE_INVITE: {subject: "Attendee Invite", message: "You are invited to: "},
    ATTENDEE_JOIN: {subject: "Joined Event as Attendee", message: "You joined: "},
    ATTENDEE_REMOVE: {subject: "Removal as Attendee", message: " has been removed from: "},
    VOLUNTEER_INVITE: {subject: "Volunteer Invite", message: "You are invited to: "},
    VOLUNTEER_JOIN: {subject: "Joined Event as Volunteer", message: "You joined: "},
    VOLUNTEER_REMOVE: {subject: "Removal as Volunteer", message: " has been removed from: "}
}

export const ROUTE_PATH ={
    HOME: '/',
    ACCOUNT_SETTINGS: '/account-settings',
    EVENT_MANAGEMENT: '/event-management',
    E: '/e-'
}
