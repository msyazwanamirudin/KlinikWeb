
// Mock state
let _adminRosterViewWeek = new Date("2026-02-16T00:00:00.000Z"); // Start with a known Monday
// Align logic from script.js
const d = _adminRosterViewWeek.getDay();
const diff = _adminRosterViewWeek.getDate() - d + (d === 0 ? -6 : 1);
_adminRosterViewWeek.setDate(diff);

function changeAdminRosterWeek(delta) {
    _adminRosterViewWeek.setDate(_adminRosterViewWeek.getDate() + (delta * 7));
    console.log(`Changed week by ${delta}. New Date: ${_adminRosterViewWeek.toISOString().split('T')[0]}`);
}

function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0 .. Sun=6
    const adjustedDate = date.getDate() + dayOfWeek;
    return Math.ceil(adjustedDate / 7);
}

// Test Suite
console.log("Initial Week Date:", _adminRosterViewWeek.toISOString().split('T')[0]); // Should be 2026-02-16 (Monday)

// Test Get Week of Month
const testDates = [
    { date: "2026-02-01", expected: 1 }, // Sunday, Feb 1st.
    { date: "2026-02-02", expected: 1 }, // Monday, Feb 2nd. 
    // Wait, Feb 1 2026 is Sunday.
    // My getWeekOfMonth logic:
    // Feb 1 (Sun): dayOfWeek = 6. adjustedDate = 1 + 6 = 7. ceil(7/7) = 1. Correct.
    // Feb 2 (Mon): dayOfWeek = 6 (from 1st). adjustedDate = 2 + 6 = 8. ceil(8/7) = 2. Correct (Week 2).

    // Feb 2026:
    // 1 (Sun) - Week 1
    // 2-8 (Mon-Sun) - Week 2?
    // Let's check standard calendar.
    // If Month starts on Sunday.
    // Row 1: 1 (Sun).
    // Row 2: 2 (Mon) ... 8 (Sun).

    // My logic:
    // getWeekOfMonth("2026-02-02")
    // firstDay = Feb 1 (Sun). dayOfWeek = 6.
    // adjustedDate = 2 + 6 = 8.
    // ceil(8/7) = 2.
    // So Feb 2nd is Week 2.

    // Test known date
    { date: "2026-02-16", expected: 4 } // Mon Feb 16.
    // adjusted = 16 + 6 = 22. ceil(22/7) = 4. Correct (Week 4).
];

testDates.forEach(t => {
    const d = new Date(t.date);
    const res = getWeekOfMonth(d);
    console.log(`Date: ${t.date}, Expected: ${t.expected}, Got: ${res}, Status: ${res === t.expected ? 'PASS' : 'FAIL'}`);
});

// Test Navigation
console.log("\nTesting Navigation:");
changeAdminRosterWeek(1); // Forward 1 week -> Feb 23 (Mon)
// Feb 23. Week?
// 23 + 6 = 29. ceil(29/7) = 5.
console.log("Week Num for Feb 23:", getWeekOfMonth(_adminRosterViewWeek));

changeAdminRosterWeek(1); // Forward to Mar 2 (Mon)
// Mar 1 2026 is Sunday.
// Mar 2 (Mon).
// getWeekOfMonth for Mar 2.
// Mar 1 (Sun) -> index 6.
// Mar 2 -> 2 + 6 = 8 -> Week 2.
console.log("Week Num for Mar 2:", getWeekOfMonth(_adminRosterViewWeek));
