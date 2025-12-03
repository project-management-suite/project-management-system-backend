const { supabase } = require('../config/supabase');

const CalendarController = {
    // Get all calendar events for the authenticated user using the calendar_events view
    async getEvents(req, res) {
        try {
            const userId = req.user.user_id;

            // Use the calendar_events view for a unified query
            const { data: events, error } = await supabase
                .from('calendar_events')
                .select('*')
                .or(
                    `created_by.eq.${userId},attendees.cs.{${userId}}`
                )
                .order('event_date', { ascending: true });

            if (error) throw error;

            // Format events for frontend
            const formattedEvents = (events || []).map(event => ({
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.event_date,
                time: event.event_time,
                type: event.event_type,
                location: event.location,
                created_by: event.created_by,
                project_id: event.project_id,
                task_id: event.task_id,
                milestone_id: event.milestone_id,
                attendees: event.attendees || []
            }));

            res.json(formattedEvents);
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            res.status(500).json({ error: 'Failed to fetch calendar events' });
        }
    },

    // Create a new meeting
    async createMeeting(req, res) {
        try {
            const { title, description, date, time, location, attendees } = req.body;
            const createdBy = req.user.user_id;

            // Create the meeting
            const { data: meeting, error: meetingError } = await supabase
                .from('meetings')
                .insert({
                    title,
                    description,
                    meeting_date: date,
                    meeting_time: time,
                    location,
                    created_by: createdBy
                })
                .select()
                .single();

            if (meetingError) throw meetingError;

            // Add attendees
            if (attendees && attendees.length > 0) {
                const attendeeData = attendees.map(attendeeId => ({
                    meeting_id: meeting.id,
                    user_id: attendeeId,
                    status: 'invited'
                }));

                const { error: attendeesError } = await supabase
                    .from('meeting_attendees')
                    .insert(attendeeData);

                if (attendeesError) throw attendeesError;

                // Create notifications for attendees
                const notificationData = attendees.map(attendeeId => ({
                    user_id: attendeeId,
                    type: 'meeting_invite',
                    title: 'New Meeting Invitation',
                    message: `You've been invited to "${title}" on ${date} at ${time}`,
                    related_entity_type: 'meeting',
                    related_entity_id: meeting.id,
                    created_by: createdBy,
                    read: false
                }));

                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notificationData);

                if (notificationError) {
                    console.warn('Could not create notifications:', notificationError.message);
                }
            }

            res.status(201).json({
                message: 'Meeting created successfully',
                meeting: meeting
            });
        } catch (error) {
            console.error('Error creating meeting:', error);
            res.status(500).json({ error: 'Failed to create meeting' });
        }
    },

    // Update a meeting
    async updateMeeting(req, res) {
        try {
            const { id } = req.params;
            const { title, description, date, time, location, attendees } = req.body;
            const userId = req.user.user_id;

            // Check if user owns the meeting
            const { data: meeting, error: meetingError } = await supabase
                .from('meetings')
                .select('created_by')
                .eq('id', id)
                .single();

            if (meetingError || !meeting) {
                return res.status(404).json({ error: 'Meeting not found' });
            }

            if (meeting.created_by !== userId) {
                return res.status(403).json({ error: 'Not authorized to update this meeting' });
            }

            // Update the meeting
            const { data: updatedMeeting, error: updateError } = await supabase
                .from('meetings')
                .update({
                    title,
                    description,
                    meeting_date: date,
                    meeting_time: time,
                    location
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            res.json({
                message: 'Meeting updated successfully',
                meeting: updatedMeeting
            });
        } catch (error) {
            console.error('Error updating meeting:', error);
            res.status(500).json({ error: 'Failed to update meeting' });
        }
    },

    // Delete an event (meeting only - tasks and milestones are handled elsewhere)
    async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // Check if user owns the meeting
            const { data: meeting, error: meetingError } = await supabase
                .from('meetings')
                .select('created_by')
                .eq('id', id)
                .single();

            if (meetingError || !meeting) {
                return res.status(404).json({ error: 'Meeting not found' });
            }

            if (meeting.created_by !== userId) {
                return res.status(403).json({ error: 'Not authorized to delete this meeting' });
            }

            // Delete attendees first (will cascade automatically due to FK constraint)
            const { error: deleteError } = await supabase
                .from('meetings')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            res.json({ message: 'Meeting deleted successfully' });
        } catch (error) {
            console.error('Error deleting meeting:', error);
            res.status(500).json({ error: 'Failed to delete meeting' });
        }
    },

    // Update meeting attendance status
    async updateAttendanceStatus(req, res) {
        try {
            const { meetingId } = req.params;
            const { status } = req.body; // 'accepted', 'declined', 'tentative'
            const userId = req.user.user_id;

            const { data: attendance, error } = await supabase
                .from('meeting_attendees')
                .update({ status })
                .eq('meeting_id', meetingId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error || !attendance) {
                return res.status(404).json({ error: 'Meeting invitation not found' });
            }

            res.json({
                message: 'Attendance status updated successfully',
                attendance: attendance
            });
        } catch (error) {
            console.error('Error updating attendance status:', error);
            res.status(500).json({ error: 'Failed to update attendance status' });
        }
    }
};

module.exports = { CalendarController };