export class Account {
  constructor(data) {
    if (data) {
      this.email = data.email;
      this.fname = data.fname.trim();
      this.lname = data.lname.trim();
      this.age = data.age;
      this.mailing = data.mailing;
      this.skills = data.skills || [];
      this.notifications = data.notifications || []
      this.events = data.events || [];
      this.eventsHistory = data.eventsHistory || [];
      this.eventOrganizer = data.eventOrganizer || [];
    }
  }

  serialize() {
    let i = 0
    const notifications = {};
    this.notifications.forEach((notification) => {
      let time = Date.now() + i;
      i++;
      notifications[time] = {
        timestamp: time,
        menu: notification.menu,
        subject: notification.subject,
        message: notification.message,
        show: notification.show,
      };
    });
    
    const events = {};
    this.events.forEach((event) => {
        events[event.uuid] = {
            name: event.fname,
            status: event.lname,
            uuid: event.email,
            attendance: event.attendance,
            join: event.join,
        };
    });

    return {
      email: this.email,
      fname: this.fname,
      lname: this.lname,
      age: this.age,
      mailing: this.mailing,
      skills: this.skills,
      notifications: notifications,
      events: events,
      eventsHistory: this.eventsHistory,
      eventOrganizer: this.eventOrganizer
    };
  }
}