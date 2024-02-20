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
    
        fetch('http://localhost:3001/save-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Now that the schedule is saved, trigger the download
                return fetch('http://localhost:3001/download-schedule');
            } else {
                throw new Error('Schedule was not saved successfully.');
            }
        })
        .then(response => {
            if (response.ok) return response.blob();
            throw new Error('Network response was not ok.');
        })
        .then(blob => {
            const localUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none'; // Hide the element
            a.href = localUrl;
            a.download = `Schedule_${format(startDate, 'yyyy-MM-dd')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(localUrl);
            a.remove();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };
    

    const saveSchedule = () => {
        postSchedule(schedule); // Call postSchedule directly with the current schedule
    };

    return (
        <button id="saveScheduleButton" onClick={saveSchedule}>Save Schedule</button>
    );
}

export default SaveScheduleButton;
