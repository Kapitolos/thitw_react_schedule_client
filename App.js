import React from 'react';
import './App.css';
import StaffList from './stafflist';
import CalendarComponent from './calendarcomponent';
import Schedule from './Schedule';  // Import the Schedule component
import StaffShiftSummary from './StaffShiftSummary';  // Adjust path accordingly
import FireTom from './firetom';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <StaffList />
                <Schedule />
                <FireTom />
            </header>
        </div>
    );
}

export default App;
