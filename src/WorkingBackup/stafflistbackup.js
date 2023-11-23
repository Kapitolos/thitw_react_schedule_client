import React, { useState, useEffect } from 'react';
import CalendarComponent from './calendarcomponent';  // Adjust path accordingly
import { format } from 'date-fns';
import axios from 'axios';  // Don't forget to import axios
import StaffEditor from './StaffEditor';

function StaffList() {
    const [staffData, setStaffData] = useState({});
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [bookOffDate, setBookOffDate] = useState(new Date());

    useEffect(() => {
        axios.get('http://localhost:3001/staff-availability')
            .then(response => {
                setStaffData(response.data);
            })
            .catch(error => {
                console.error("Error fetching staff data:", error);
            });
    }, []);

    const handleDateChange = (date, name) => {
        if (!staffData[name]) {
            console.error(`No data found for staff member: ${name}`);
            return;
        }
        const formattedDate = format(date, 'yyyy-MM-dd');
    
        let updatedData = { ...staffData };
    
        if (updatedData[name].booked_off_dates.includes(formattedDate)) {
            updatedData[name].booked_off_dates = updatedData[name].booked_off_dates.filter(d => d !== formattedDate);
        } else {
            updatedData[name].booked_off_dates.push(formattedDate);
        }
    
        setStaffData(updatedData);
    
        axios.post('http://localhost:3001/update-booked-dates', updatedData)
            .then(response => {
                console.log('Successfully updated booked dates:', response.data);
            })
            .catch(error => {
                console.error('Error updating booked dates:', error);
            });
    };

    const handleStaffSelect = (staffName) => {
        if (selectedStaff === staffName) {
            setShowDetails(!showDetails);
        } else {
            setSelectedStaff(staffName);
            setShowDetails(true);  // When a new staff is selected, always show the details and calendar
        }
    };

    const handleUpdateStaffData = (staffName, updatedData) => {
        // Update local state
        setStaffData(prevData => ({
            ...prevData,
            [staffName]: updatedData
        }));
    
        // Send updated data to server
        axios.post('http://localhost:3001/update-staff-availability', {
            staffName: staffName,
            updatedData: updatedData
        })
        .then(response => {
            if (response.data.success) {
                console.log('Successfully updated staff availability on the server');
            } else {
                console.error('Failed to update staff availability:', response.data.message);
            }
        })
        .catch(error => {
            console.error('Error updating staff availability:', error);
        });
    };
    
    
    
    return (
        <div>
            <div id="stafflist">
                <h2>Staff List</h2>
                <ul>
                    {Object.keys(staffData).sort().map(staffName => (
                        <li key={staffName}>
                            <button 
                                onClick={() => handleStaffSelect(staffName)}
                                style={selectedStaff === staffName ? { backgroundColor: 'green', color: 'white' } : {}}
                            >
                                {staffName}
                            </button>
                            {selectedStaff === staffName && showDetails && (
                                <div>
                                    <div className="staff-calendar">
                                        <CalendarComponent 
                                            selectedDate={bookOffDate}
                                            onDateChange={handleDateChange}
                                            name={selectedStaff}
                                            bookedDates={staffData[selectedStaff]?.booked_off_dates || []}
                                        />
                                    </div>
                                    {/* Pass only the selected staff's data to the StaffEditor */}
                                    <StaffEditor 
                                        staffData={staffData[selectedStaff]} 
                                        staffName={selectedStaff}
                                        onUpdateStaffData={handleUpdateStaffData}
                                    />
                                    <p>Max Shifts: {staffData[staffName].max_shifts}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
    
                            }
    
    export default StaffList;
