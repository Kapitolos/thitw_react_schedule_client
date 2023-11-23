import React, { useState, useEffect } from 'react';
import { startOfWeek, format, addDays } from 'date-fns';

function Schedule() {
    const [staffData, setStaffData] = useState({});
    const [currentSchedule, setCurrentSchedule] = useState({});
    // Adjusting startOfWeek to make Monday the first day
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const slots = ["Lunch1", "Lunch2", "Hole1", "Hole2", "Bothams1", "Bothams2", "Bothams3"];


    
    useEffect(() => {
        fetch(process.env.PUBLIC_URL + '/staff_availability.json')
            .then(response => response.json())
            .then(data => {
                setStaffData(data);
            })
            .catch(error => {
                console.error("Error fetching staff availability data:", error);
            });
    }, []);

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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const buildSchedule = () => {
        let currentSchedule = {};
        let scheduled = {};
    
        // Initialize all slot-day combinations with an empty string
        for (let slot of slots) {
            currentSchedule[slot] = {};
            for (let day of daysOfWeek) {
                currentSchedule[slot][day] = "";
            }
        }
    
        const restrictedSlots = {
            "Bothams3": ["Friday", "Saturday"],
            "Lunch2": ["Friday", "Saturday", "Sunday"]
        };
    
    // Begin with restricted slots
    for (let slot in restrictedSlots) {
        for (let day of restrictedSlots[slot]) {
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

                if (isStaffAvailable(staff, venue, time, day)) {
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

                if (isStaffAvailable(staff, venue, time, day)) {
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

    return currentSchedule;
};


    // const currentSchedule = buildSchedule();
    // buildSchedule();
        // Now we store the result of buildSchedule() in currentSchedule state
        useEffect(() => {
            setCurrentSchedule(buildSchedule());
        }, [staffData]);

        return (
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th></th>
                        {daysOfWeek.map((day, index) => (
                            <th key={day}>
                                {day} {format(addDays(startDate, index), 'MM/dd')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map(slot => (
                        <tr key={slot}>
                            <td>{slot}</td>
                            {daysOfWeek.map(day => (
                                <td key={day}>{currentSchedule[slot] && currentSchedule[slot][day] ? currentSchedule[slot][day] : ""}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    
    export default Schedule;







