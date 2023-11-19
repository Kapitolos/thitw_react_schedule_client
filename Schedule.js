import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker'; // Assuming you're using react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // Don't forget the CSS for the DatePicker
import { startOfWeek, endOfWeek, format, addDays, isWithinInterval } from 'date-fns';
import StaffShiftSummary from './StaffShiftSummary';  // Adjust path accordingly
import SaveScheduleButton from './SaveScheduleButton';  // Adjust path accordingly
import RestrictedSlotsEditor from './RestrictedSlotsEditor';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Function to reorder the staff in the schedule
const reorder = (schedule, source, destination) => {
    const current = [...(schedule[source.droppableId][source.index] || [])];
    const next = [...(schedule[destination.droppableId][destination.index] || [])];
    const target = current[source.index];
  
    // Move the staff member from the source slot to the destination slot
    schedule[source.droppableId].splice(source.index, 1);
    schedule[destination.droppableId].splice(destination.index, 0, target);
  
    return schedule;
  };


function Schedule() {
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffData, setStaffData] = useState({});
    const [currentSchedule, setCurrentSchedule] = useState({});
    // Adjusting startOfWeek to make Monday the first day
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const slots = ["Lunch1", "Lunch2","Lunch3", "Bothams1", "Bothams2", "Bothams3", "Bothams4", "Hole1", "Hole2"];

    // At the beginning of the Schedule component, add a new state for restrictedSlots
const [restrictedSlots, setRestrictedSlots] = useState({});



    const areEnoughShiftsAvailable = () => {
        const totalShifts = slots.length * daysOfWeek.length;
        const totalMaxShifts = Object.values(staffData).reduce((acc, staff) => acc + staff.max_shifts, 0);
        return totalMaxShifts <= totalShifts;
    };
      const onDragEnd = (result) => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    const updatedSchedule = reorder(
      currentSchedule,
      source,
      destination
    );

    setCurrentSchedule(updatedSchedule);
  };

    // Function to determine if a cell should be highlighted
const shouldHighlight = (staffName) => selectedStaff === staffName;
    


    const handleDateChange = (date) => {
        // Check if selected date is within the current week
        const start = startOfWeek(startDate, { weekStartsOn: 1 });
        const end = endOfWeek(startDate, { weekStartsOn: 1 });
        
        if (!isWithinInterval(date, { start, end })) {
            setStartDate(startOfWeek(date, { weekStartsOn: 1 }));
        }
    };

    useEffect(() => {
        fetch('http://localhost:3001/staff-availability')
            .then(response => response.json())
            .then(data => {
                setStaffData(data);
                // console.log('Fetched staff data:', data);
            })
            .catch(error => {
                console.error("Error fetching staff availability data:", error);
            });

        axios.get('http://localhost:3001/restricted-slots')
            .then(response => {
                // Set the restricted slots state with the fetched data
                // Adjust your state structure accordingly
                setRestrictedSlots(response.data);
            })
            .catch(error => {
                console.error("Error fetching restricted slots:", error);
            });
    }, []);
    
    // Function to update restricted slots on the server
const updateRestrictedSlots = (updatedSlots) => {
    axios.post('http://localhost:3001/restricted-slots', updatedSlots)
      .then(response => {
        if (response.data.success) {
          setRestrictedSlots(updatedSlots); // Update state with new slots
        }
      })
      .catch(error => {
        console.error("Error updating restricted slots:", error);
      });
  };
    

    const isStaffAvailable = (staff, venue, time, day) => {
        if (time === "lunch") {
            return staffData[staff] &&
                staffData[staff][venue] &&
                staffData[staff][venue][time] &&
                staffData[staff][venue][time].includes(day);
        } else {
            return staffData[staff] &&
                staffData[staff][venue] &&
                staffData[staff][venue]["evening"] &&
                staffData[staff][venue]["evening"].includes(day);
        }
    };

    const isStaffBookedOff = (staffName, date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        console.log(`Checking if ${staffName} is booked off on ${formattedDate}`);
        
        if (staffData[staffName] && staffData[staffName].booked_off_dates) {
            console.log(`${staffName}'s booked off dates:`, staffData[staffName].booked_off_dates);
            return staffData[staffName].booked_off_dates.includes(formattedDate);
        }
        return false;
    };
    
    

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

        // Check if all slots are filled in the provided schedule
        function isScheduleFull(schedule) {
            for (let slot in schedule) {
                for (let day in schedule[slot]) {
                    if (!schedule[slot][day]) {
                        return false;
                    }
                }
            }
            return true;
        }

        const isSlotActiveOnDay = (slot, day) => {
    if (restrictedSlots[slot]) {
        return restrictedSlots[slot].includes(day);
    }
    return true;  // For non-restricted slots
};



    const buildSchedule = () => {

        let currentSchedule = {};
        let attempts = 10; // Counter to limit the number of attempts
        const MAX_ATTEMPTS = 100;  // You can adjust this as needed
        
        do {
            let scheduled = {};
    
        // Initialize all slot-day combinations with an empty string
        for (let slot of slots) {
            currentSchedule[slot] = {};
            for (let day of daysOfWeek) {
                currentSchedule[slot][day] = "";
            }
        }
    
    
    // Begin with restricted slots
    for (let slot in restrictedSlots) {
        for (let day of restrictedSlots[slot]) {
            let staffMembers = Object.keys(staffData).sort((a, b) => {
                const shiftsA = scheduled[a] ? scheduled[a].length : 0;
                const shiftsB = scheduled[b] ? scheduled[b].length : 0;
                const diffA = staffData[a].max_shifts - shiftsA;
                const diffB = staffData[b].max_shifts - shiftsB;
                return diffB - diffA; // This will prioritize staff who are farthest from their max_shifts
            });
            
            for (let staff of staffMembers) {
                if (scheduled[staff] && scheduled[staff].length >= staffData[staff].max_shifts) {
                    continue;
                }
                if (scheduled[staff] && scheduled[staff].includes(day)) continue;

                let venue, time;

                if (slot.includes("Lunch")) {
                    venue = "Bothams"; 
                    time = "lunch";
                } else if (slot.includes("Hole")) {
                    venue = "Hole";
                    time = "evening";
                } else if (slot.includes("Bothams")) {
                    venue = "Bothams";
                    time = "evening";
                }
                const currentDayDate = addDays(startDate, daysOfWeek.indexOf(day)); // Get the actual date for the day

                if (isStaffAvailable(staff, venue, time, day) && !isStaffBookedOff(staff, currentDayDate)) {
                    // console.log(`${staff} is being considered for ${slot} on ${day}`);
                    // console.log(`[RESTRICTED] ${staff} is being considered for ${slot} on ${day}`);
                    currentSchedule[slot][day] = staff;
                
                    if (!scheduled[staff]) {
                        scheduled[staff] = [];
                    }
                    scheduled[staff].push(day);
                    // console.log(`${staff} is scheduled for ${slot} on ${day}`);
                    break;
                }
                
            }
        }

    }

// Continue with non-restricted slots
for (let slot of slots.filter(s => !Object.keys(restrictedSlots).includes(s))) {
    for (let day of daysOfWeek) {
        let staffMembers = shuffleArray(Object.keys(staffData));
        for (let staff of staffMembers) {
            if (scheduled[staff] && scheduled[staff].length >= staffData[staff].max_shifts) {
                continue;
            }
            if (scheduled[staff] && scheduled[staff].includes(day)) continue;

            let venue, time;

            if (slot.includes("Lunch")) {
                venue = "Bothams"; 
                time = "lunch";
            } else if (slot.includes("Hole")) {
                venue = "Hole";
                time = "evening";
            } else if (slot.includes("Bothams")) {
                venue = "Bothams";
                time = "evening";
            }

            const currentDayDate = addDays(startDate, daysOfWeek.indexOf(day)); // Get the actual date for the day

            if (isStaffAvailable(staff, venue, time, day) && !isStaffBookedOff(staff, currentDayDate)) {
                // console.log(`[NON-RESTRICTED] ${staff} is being considered for ${slot} on ${day}`);
                currentSchedule[slot][day] = staff;

                if (!scheduled[staff]) {
                    scheduled[staff] = [];
                }
                scheduled[staff].push(day);
                break;
            }
        }
    }
}

// Fill in any remaining empty slots with 'BEN'
for (let slot of slots) {
    for (let day of daysOfWeek) {
        if (!currentSchedule[slot][day] && isSlotActiveOnDay(slot, day)) {
            currentSchedule[slot][day] = "BEN";
        }
    }
}

        attempts++;  // Increment the attempts counter
    } while (!isScheduleFull(currentSchedule) && attempts < MAX_ATTEMPTS);

    return currentSchedule;
};


    // const currentSchedule = buildSchedule();
    // buildSchedule();
        // Now we store the result of buildSchedule() in currentSchedule state
        useEffect(() => {
            setCurrentSchedule(buildSchedule());
          }, [staffData, startDate, restrictedSlots]); // Now useEffect will re-run if restrictedSlots changes
        
        
        return (
            <div>
                <div id="datepicker">
                    <DatePicker 
                        selected={startDate}
                        onChange={handleDateChange}
                        inline
                    />
                </div>
                <div>
                    <StaffShiftSummary schedule={currentSchedule} onStaffClick={setSelectedStaff} />
                </div>
                
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th></th>
                            {daysOfWeek.map((day, index) => (
                                <th key={index}>
                                    {day} {format(addDays(startDate, index), 'MM/dd')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {slots.map(slot => {
                            // Log to check if the slot exists in the currentSchedule
                            console.log(`Schedule for slot ${slot}:`, currentSchedule[slot]);
                            
                            return (
                                <tr key={slot}>
                                    <td>{slot}</td>
                                    {daysOfWeek.map((day, index) => {
                                        // Log to check the day's schedule for the current slot
                                        console.log(`Schedule for ${day} in slot ${slot}:`, currentSchedule[slot] ? currentSchedule[slot][day] : 'No schedule');
    
                                        const key = `${slot}-${day}`; // Ensuring unique key by combining slot and day
                                        return (
                                            <td key={key} className={currentSchedule[slot] && shouldHighlight(currentSchedule[slot][day]) ? "highlighted" : ""}>
                                                {currentSchedule[slot] ? currentSchedule[slot][day] || "" : ""}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <SaveScheduleButton schedule={currentSchedule} startDate={startDate}/>
                    {/* Add the RestrictedSlotsEditor here */}
    <RestrictedSlotsEditor
      restrictedSlots={restrictedSlots}
      onUpdateRestrictedSlots={updateRestrictedSlots}
 
    />
            </div>
        );
    }
    
    export default Schedule;







