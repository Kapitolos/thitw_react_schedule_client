import React, { useState } from 'react';

function StaffEditor({ staffData: initialStaffData, staffName, onUpdateStaffData, onRemoveStaff }) {
    console.log("Full staff data:", initialStaffData);
    const [selectedVenue, setSelectedVenue] = useState('Bothams');
    const [selectedTime, setSelectedTime] = useState('evening');
    const venues = ['Bothams', 'Hole'];
    const times = ['lunch', 'evening'];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const isAvailable = (day) => {
        return initialStaffData[selectedVenue]?.[selectedTime]?.includes(day);
    };

    const updateAvailability = (day) => {
        // Create a deep copy of the initial data
        const staffDataCopy = JSON.parse(JSON.stringify(initialStaffData));

        if (isAvailable(day)) {
            const updatedDays = staffDataCopy[selectedVenue][selectedTime].filter(d => d !== day);
            staffDataCopy[selectedVenue][selectedTime] = updatedDays;
        } else {
            staffDataCopy[selectedVenue][selectedTime] = [
                ...(staffDataCopy[selectedVenue][selectedTime] || []),
                day
            ];
        }

        onUpdateStaffData(staffName, staffDataCopy);
    };

    const removeStaffMember = () => {
        // Confirmation dialog to make sure the user wants to remove the staff member
        if (window.confirm(`Are you sure you want to remove ${staffName}?`)) {
            onRemoveStaff(staffName);
        }
    };

    
    
    

    return (
        <div className="staff-editor">
            <div className="venues-list">
                {venues.map(venue => (
                    <div 
                        key={venue} 
                        className={`venue-item ${selectedVenue === venue ? 'active' : ''}`}
                        onClick={() => setSelectedVenue(venue)}
                    >
                        {venue}
                    </div>
                ))}
            </div>
            <div className="times-list">
                {times.map(time => (
                    <div 
                        key={time} 
                        className={`time-item ${selectedTime === time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(time)}
                    >
                        {time}
                    </div>
                ))}
            </div>
            <div className="days-list">
                {daysOfWeek.map(day => (
                    <div 
                        key={day} 
                        className={`day-item ${isAvailable(day) ? 'available' : 'not-available'}`}
                        onClick={() => updateAvailability(day)}
                    >
                        {day}
                    </div>
                ))}
            </div>
            <button className="remove-staff-button" onClick={removeStaffMember}>
                Remove {staffName}
            </button>
        </div>
    );
}

export default StaffEditor;

