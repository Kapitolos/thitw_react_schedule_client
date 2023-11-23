import React from 'react';
import './App.css';
import StaffList from './stafflist';
import CalendarComponent from './calendarcomponent';
import Schedule from './Schedule';  // Import the Schedule component
import StaffShiftSummary from './StaffShiftSummary';  // Adjust path accordingly


function App() {
    return (
        <div className="App">
            <header className="App-header">
                <StaffList />
                <Schedule />
            </header>
        </div>
    );
}

export default App;
