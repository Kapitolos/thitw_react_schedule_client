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


function Schedule({ currentSchedule, setCurrentSchedule, startDate, setStartDate, staffData, setStaffData }) {
    const [selectedStaff, setSelectedStaff] = useState(null);
    // const [staffData, setStaffData] = useState({});
    // const [currentSchedule, setCurrentSchedule] = useState({});
    // Adjusting startOfWeek to make Monday the first day
    // const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const slots = ["Lunch1", "Lunch2","Lunch3", "Bothams1", "Bothams2", "Bothams3", "Bothams4", "Hole1", "Hole2","Runner 1", "Runner 2", "Runner 3"];

    // At the beginning of the Schedule component, add a new state for restrictedSlots
const [restrictedSlots, setRestrictedSlots] = useState({});

    // State to manage the visibility of the RestrictedSlotsEditor
    const [showRestrictedSlotsEditor, setShowRestrictedSlotsEditor] = useState(false);

    // Toggle function
    const toggleRestrictedSlotsEditor = () => {
        setShowRestrictedSlotsEditor(prevState => !prevState);
    };



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
        fetch(`${process.env.REACT_APP_API_URL}/staff-availability`)
            .then(response => response.json())
            .then(data => {
                setStaffData(data);
                // console.log('Fetched staff data:', data);
            })
            .catch(error => {
                console.error("Error fetching staff availability data:", error);
            });

        axios.get(`${process.env.REACT_APP_API_URL}/restricted-slots`)
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
    axios.post(`${process.env.REACT_APP_API_URL}/restricted-slots`, updatedSlots)
      .then(response => {
        if (response.data.success) {
          setRestrictedSlots(updatedSlots); // Update state with new slots
        }
      })
      .catch(error => {
        console.error("Error updating restricted slots:", error);
      });
  };
    

  const isStaffAvailable = (staff, venue, shift, day) => {
    // Check if staff, venue, and time data exist
    if (!staffData[staff] || !staffData[staff][venue] || !staffData[staff][venue][shift]) {
        return false; // Not available if any data is missing
    }

    // Check if the staff is available on the specified day
    return staffData[staff][venue][shift].includes(day);
};



const isStaffBookedOff = (staffName, date) => {
    // Ensure date is a valid Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        console.error(`Invalid date passed for ${staffName}:`, date);
        return false; // Consider the staff not booked off if the date is invalid
    }
    
    const formattedDate = format(dateObj, 'yyyy-MM-dd');
    if (staffData[staffName] && staffData[staffName].booked_off_dates) {
        return staffData[staffName].booked_off_dates.includes(formattedDate);
    }
    return false;
};

    // Function to find the next occurrence of a day of the week (e.g., "Saturday") from a reference date
const getNextDayOfWeek = (dayName, referenceDate = new Date()) => {
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayName);
    const resultDate = new Date(referenceDate.getTime());
    resultDate.setDate(referenceDate.getDate() + ((7 + dayOfWeek - referenceDate.getDay()) % 7));
    return resultDate;
};
    

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const isScheduleFull = (schedule, restrictedSlots) => {
        for (let slot in schedule) {
            for (let day of daysOfWeek) {
                // Check if the day for the slot is listed in the restrictedSlots JSON (indicating it's available for scheduling)
                const isAvailableForScheduling = restrictedSlots[slot] ? restrictedSlots[slot].includes(day) : false;
                
                // If the slot for this day is not filled, but the day is available for scheduling, then the schedule is not full
                if (!schedule[slot][day] && isAvailableForScheduling) {
                    // console.log(`Slot ${slot} on ${day} is empty but available for scheduling.`);
                    return false;
                }
            }
        }
        console.log("Schedule is considered full.");
        return true;
    };

    useEffect(() => {
        if (isScheduleFull(currentSchedule, restrictedSlots)) {
            console.log('Schedule is full');
        } else {
            const updatedSchedule = BenFill({...currentSchedule}, slots, daysOfWeek); // Clone currentSchedule to ensure immutability
            setCurrentSchedule(updatedSchedule); // Set the updated schedule to trigger a re-render
            console.log('Schedule is not full, BEN applied');
        }
    }, [currentSchedule]); // React will re-run this effect if currentSchedule changes
    


function isRestricted(slot, day, restrictedSlots) {
    if (!restrictedSlots || !restrictedSlots[slot]) return false; // Not restricted if data is missing
    return restrictedSlots[slot].includes(day);
}


        

        const isSlotActiveOnDay = (slot, day) => {
    if (restrictedSlots[slot]) {
        return restrictedSlots[slot].includes(day);
    }
    return true;  // For non-restricted slots
};

// const assignStaffToPreferredVenueSlot = (currentSchedule, staffName, staffDetails, slots) => {
//     console.log("Assigning preferred slots for:", staffName);
//     const preferences = staffDetails.preferences;

//     // Log preferences for debugging
//     console.log("Preferences:", preferences);

//     preferences.forEach(preference => {
//         const { venue, shift, day } = preference;
//         console.log(`Processing preference: Venue=${venue}, Shift=${shift}, Day=${day}`);

//         // Ensure slots are correctly filtered based on venue and shift
//         const matchingSlots = slots.filter(slot => slot.includes(venue) && slot.toLowerCase().includes(shift));
//         console.log("Matching slots for preference:", matchingSlots);
        
//         // Attempt to assign the staff to the first available matching slot
//         for (const slot of matchingSlots) {
//             // Ensure the slot and day are initialized in the schedule
//             if (!currentSchedule[slot]) currentSchedule[slot] = {};
//             if (currentSchedule[slot][day] === undefined) currentSchedule[slot][day] = "";

//             // Check if the slot is already filled
//             if (currentSchedule[slot][day] === "") {
//                 // Check availability and booked off status
//                 const isAvailable = isStaffAvailable(staffName, venue, shift, day, staffDetails);
//                 const isBookedOff = staffDetails.booked_off_dates.includes(day);

//                 if (isAvailable && !isBookedOff) {
//                     console.log(`NEW Assigning ${staffName} to ${slot} on ${day}.`);
//                     currentSchedule[slot][day] = staffName;
//                     break; // Stop checking other slots once assigned
//                 }
//             }
//         }
//     });
// };

// Example usage of the function
// assignStaffToPreferredVenueSlot(currentSchedule, "John Doe", staffData["John Doe"], slots);

const processPreferences = (currentSchedule, staffData, slots) => {
    console.log('Processing preferences...');
    let filledSlots = new Set(); // Track filled slots

    Object.entries(staffData).forEach(([staffName, staffDetails]) => {
        staffDetails.preferences.forEach(({ venue, shift, day }) => {
            console.log(`${staffName} has a preference for ${venue} on ${day} during ${shift}`);

            // Filter slots to find those that match the staff's preference for the venue
            const matchingSlots = slots.filter(slot => slot.startsWith(venue));
            console.log("Matching Slots: ", matchingSlots);

            // Attempt to assign the staff to one of the matching slots if available
            let assigned = false;
            for (let matchingSlot of matchingSlots) {
                // Check if slot for the day is empty and staff is available and not booked off
                if (currentSchedule[matchingSlot][day] === "" && isStaffAvailable(staffName, venue, shift, day, staffDetails) && !isBookedOff(staffName, day, staffDetails)) {
                    currentSchedule[matchingSlot][day] = staffName;
                    console.log(`Assigned ${staffName} to ${matchingSlot} on ${day}`);
                    filledSlots.add(`${matchingSlot}_${day}`);
                    console.log("FILLED");
                    assigned = true;
                    break; // Stop searching once a match is found and assigned
                }
            }

            if (!assigned) {
                console.log(`Unable to assign ${staffName} to preferred slot at ${venue} for ${shift} on ${day}.`);
            }
        });
    });
    console.log("Filled slots through preferences:", filledSlots);

    return { filledSlots, currentSchedule };

};




function initializeDays() {
    // Initialize days of the week with empty strings or appropriate structure
    return {
        "Monday": "",
        "Tuesday": "",
        "Wednesday": "",
        "Thursday": "",
        "Friday": "",
        "Saturday": "",
        "Sunday": ""
    };
}

// // Helper function to initialize days for a shift
// function initializeDays() {
//     const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
//     const dayInitialization = {};
//     daysOfWeek.forEach(day => {
//         dayInitialization[day] = "";
//     });
//     return dayInitialization;
// }



function isBookedOff(staffName, day, staffDetails) {
    // Implement your logic to check if the staff is booked off on the given day
    return false; // Placeholder return value
}





    const buildSchedule = () => {
        // console.log("TOP OF BUILD", JSON.stringify(currentSchedule, null, 2));
        // console.log("Before null current "+ currentSchedule);
        let currentSchedule = {};
        // console.log("After Null", JSON.stringify(currentSchedule, null, 2));
        let attempts = 10; // Counter to limit the number of attempts
        const MAX_ATTEMPTS = 200;  // You can adjust this as needed
 
            

        do {
            const scheduled = {};
    
        // Initialize all slot-day combinations with an empty string
        for (let slot of slots) {
            currentSchedule[slot] = {};
            for (let day of daysOfWeek) {
                currentSchedule[slot][day] = "";
            }
        }
        console.log("Schedule initialized:", JSON.stringify(currentSchedule, null, 2));
    
           // // First, process staff preferences to give them priority
        //    console.log("BEFORE PREF ", JSON.stringify(currentSchedule, null, 2));
           processPreferences(currentSchedule, staffData, slots);
           console.log("After PREF ", JSON.stringify(currentSchedule, null, 2));


    
    
    
    // Begin with restricted slots
    for (let slot in restrictedSlots) {
        for (let day of restrictedSlots[slot]) {
            let staffMembers = shuffleArray(Object.keys(staffData)).sort((a, b) => {
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

                let venue, shift;

                if (slot.includes("Lunch")) {
                    venue = "Bothams"; 
                    shift = "lunch";
                } else if (slot.includes("Hole")) {
                    venue = "Hole";
                    shift = "evening";
                } else if (slot.includes("Bothams")) {
                    venue = "Bothams";
                    shift = "evening";
                } else if (slot.includes("Runner 1")) {
                    venue = "Bothams";
                    shift = "Runner 1";
                } else if (slot.includes("Runner 2")) {
                    venue = "Bothams";
                    shift = "Runner 2";
                } else if (slot.includes("Runner 3")) {
                    venue = "Bothams";
                    shift = "Runner 3";
                }
                const currentDayDate = addDays(startDate, daysOfWeek.indexOf(day)); // Get the actual date for the day

                if (isStaffAvailable(staff, venue, shift, day) && !isStaffBookedOff(staff, currentDayDate)) {
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

            let venue, shift;

            if (slot.includes("Lunch")) {
                venue = "Bothams"; 
                shift = "lunch";
            } else if (slot.includes("Hole")) {
                venue = "Hole";
                shift = "evening";
            } else if (slot.includes("Bothams")) {
                venue = "Bothams";
                shift = "evening";
            } else if (slot.includes("Runner 1")) {
                venue = "Bothams";
                shift = "Runner 1";
            } else if (slot.includes("Runner 2")) {
                venue = "Bothams";
                shift = "Runner 2";
            } else if (slot.includes("Runner 3")) {
                venue = "Bothams";
                shift = "Runner 3";
            }

            const currentDayDate = addDays(startDate, daysOfWeek.indexOf(day)); // Get the actual date for the day

            if (isStaffAvailable(staff, venue, shift, day) && !isStaffBookedOff(staff, currentDayDate)) {
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


        attempts++;  // Increment the attempts counter
    } while (!isScheduleFull(currentSchedule, restrictedSlots) && attempts < MAX_ATTEMPTS);
    console.log("Current schedule before return:", JSON.stringify(currentSchedule, null, 2));
    return currentSchedule;
};

// Fill Any empty slots with "Ben" after max attempts reached.
function BenFill(currentSchedule, slots, daysOfWeek) {
for (let slot of slots) {
    for (let day of daysOfWeek) {
        if (!currentSchedule[slot][day] && isSlotActiveOnDay(slot, day)) {
            console.log("BEN TIME ACTUALLY WORKED")
            currentSchedule[slot][day] = "BEN";
        }
    }
}
  
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
                            // console.log(`Schedule for slot ${slot}:`, currentSchedule[slot]);
                            
                            return (
                                <tr key={slot}>
                                    <td>{slot}</td>
                                    {daysOfWeek.map((day, index) => {
                                        // Log to check the day's schedule for the current slot
                                        // console.log(`Schedule for ${day} in slot ${slot}:`, currentSchedule[slot] ? currentSchedule[slot][day] : 'No schedule');
    
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
            </div>
        );
    }
    
    export default Schedule;




