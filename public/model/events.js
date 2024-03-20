export class Events {
    constructor(data) {
        if (data) {
            this.uuid = data.uuid;
            this.organizersEmail = data.organizersEmail || [];
            this.name = data.name;
            this.description = data.description;
            this.location = data.location;
            this.startDate = data.startDate;
            this.endDate = data.endDate;
            this.skills = data.skills || [];
            this.volunteers = data.volunteers || [];;
            this.volunteerList = data.volunteerList || [];
            this.attendees = data.attendees || [];;
            this.attendeeList = data.attendeeList || [];
            this.public = data.public;
            this.status = data.status;
            this.editDate = 0;
            this.allowAttendees = data.allowAttendees;
            this.allowVolunteers = data.allowVolunteers;
        }
    }

    serialize(uuid) {
        const volunteerList = {};
        this.volunteerList.forEach((volunteer) => {
            volunteerList[volunteer.email] = {
                fname: volunteer.fname,
                lname: volunteer.lname,
                email: volunteer.email,
                attendance: volunteer.attendance,
                join: volunteer.join,
            };
        });
        const attendeeList = {};
        this.attendeeList.forEach((attendee) => {
            attendeeList[attendee.email] = {
                fname: attendee.fname,
                lname: attendee.lname,
                email: attendee.email,
                attendance: attendee.attendance,
                join: attendee.join,

            };
        });

        return {
            uuid: uuid,
            organizersEmail: this.organizersEmail,
            name: this.name,
            description: this.description,
            location: this.location,
            startDate: this.startDate,
            endDate: this.endDate,
            skills: this.skills,
            volunteers: Array.isArray(this.volunteers) ? this.volunteers : [],
            volunteerList: volunteerList,
            attendees: Array.isArray(this.attendees) ? this.attendees : [],
            attendeeList: attendeeList,
            public: this.public,
            status: this.status,
            editDate: Date.now(),
            allowAttendees: this.allowAttendees,
            allowVolunteers: this.allowVolunteers,
        };
    }
}
