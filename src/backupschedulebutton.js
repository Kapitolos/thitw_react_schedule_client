import React from 'react';
import { format, addDays } from 'date-fns';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function SaveScheduleButton({ schedule, startDate }) {

    const getWeekDates = (startDate) => {
        return daysOfWeek.map((day, index) => format(addDays(startDate, index), 'EEEE MM/dd/yyyy'));
    };

    const postSchedule = (scheduleData) => {
        const weekDates = getWeekDates(startDate);
        const formattedData = {
            dates: weekDates,
            scheduleData: schedule
        };

        // This function now primarily focuses on posting the schedule
        fetch(`${process.env.REACT_APP_API_URL}/save-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Schedule saved successfully, proceed to download
                downloadSchedule();
            } else {
                throw new Error('Schedule was not saved successfully.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };

    const downloadSchedule = () => {
        // Directly using the public URL for the schedule file
        const scheduleUrl = `https://thitwstaffinfo.s3.ca-central-1.amazonaws.com/schedule.xlsx`;

        const a = document.createElement('a');
        a.href = scheduleUrl;
        a.download = `Schedule_${format(startDate, 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const saveSchedule = () => {
        postSchedule(schedule); // Trigger posting the schedule
    };

    return (
        <button id="saveScheduleButton" onClick={saveSchedule}>Save Schedule</button>
    );
}

export default SaveScheduleButton;
