// 1. STARTUP: Wait for the website to finish loading before running any code
document.addEventListener('DOMContentLoaded', function() {

    // ======================================================
    // GLOBAL: DISPLAY USER NAME & HANDLE LOGOUT
    // ======================================================
    
    // 1. Update Welcome Message on EVERY Page
    // We look for the specific ID 'user-welcome' or the generic profile span
    const welcomeMessages = document.querySelectorAll('#user-welcome, .profile span');
    
    // Retrieve the saved name from browser memory (localStorage)
    const storedName = localStorage.getItem('runClubUser');
    
    welcomeMessages.forEach(msg => {
        // We only want to touch elements that look like welcome messages
        // This check ensures we target the right span even if ID is missing but class structure matches
        if (msg.id === 'user-welcome' || (msg.textContent && msg.textContent.includes('Welcome'))) {
            if (storedName) {
                // If a name exists in memory, show it!
                msg.textContent = "Welcome, " + storedName;
                msg.style.display = "inline"; // Make sure it is visible
            } else {
                // If NO user is logged in, hide the welcome text
                // This ensures "Welcome, Guest" doesn't show up if not desired
                msg.style.display = "none";
            }
        }
    });

    // 2. Handle Logout
    // We listen for clicks on any "Logout" button to clear the memory
    const logoutBtns = document.querySelectorAll('.profile a');
    logoutBtns.forEach(btn => {
        if (btn.textContent.includes("Logout")) {
            btn.addEventListener('click', function() {
                localStorage.removeItem('runClubUser'); // Clear the name
                // localStorage.removeItem('runHistory'); // Optional: Clear history on logout
            });
        }
    });

    // ======================================================
    // PAGE 1: LOGIN LOGIC
    // ======================================================
    if (document.title.includes("Login")) {
        const loginForm = document.querySelector('form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault(); 
                
                // Since Login only has email, we'll extract the name from the email
                // Example: "john@ufv.ca" -> "John"
                const email = document.getElementById('email').value;
                let extractedName = email.split('@')[0]; 
                
                // Capitalize the first letter (e.g., "john" -> "John")
                if(extractedName) {
                    extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
                } else {
                    extractedName = "Student";
                }

                // SAVE THE NAME TO BROWSER MEMORY
                localStorage.setItem('runClubUser', extractedName);

                alert("Login successful! Welcome back, " + extractedName + ".");
                window.location.href = "dashboard.html"; 
            });
        }
    }

    // ======================================================
    // PAGE 2: SIGN UP LOGIC
    // ======================================================
    if (document.title.includes("Sign Up")) {
        const signupForm = document.querySelector('form');

        if (signupForm) {
            signupForm.addEventListener('submit', function(event) {
                event.preventDefault(); 

                const pledgeCheckbox = document.getElementById('pledge');

                if (pledgeCheckbox && pledgeCheckbox.checked === false) {
                    alert("You must agree to the Community Pledge to join.\nWe believe in sharing the wealth!");
                    return; 
                }

                // GET THE REAL NAME FROM THE INPUT
                const fullName = document.getElementById('fullname').value;

                // SAVE THE NAME TO BROWSER MEMORY
                localStorage.setItem('runClubUser', fullName);

                alert("Account created! Welcome to the club, " + fullName + "!");
                window.location.href = "dashboard.html"; 
            });
        }
    }

    // ======================================================
    // PAGE 3: RUN TRACKER LOGIC
    // ======================================================
    if (document.title.includes("Run Tracker")) {
        // Load existing history on page load
        if(typeof loadRunHistoryTable === 'function') loadRunHistoryTable();

        const runForm = document.querySelector('form');

        if (runForm) {
            runForm.addEventListener('submit', function(event) {
                event.preventDefault(); 

                const distanceInput = document.getElementById('distance');
                const distance = distanceInput ? parseFloat(distanceInput.value) : 0;
                
                const pledgeInput = document.getElementById('pledge');
                const pledgeType = pledgeInput ? pledgeInput.value : "none";

                // Save to LocalStorage (The Dashboard will read this later)
                if(typeof saveRun === 'function') saveRun(distance, pledgeType);

                const moneyRaised = (distance * 1.00).toFixed(2);

                // --- PROFESSIONAL PROMPT ---
                const feedbackBox = document.getElementById('tracker-feedback');
                let promptHTML = "";

                if (pledgeType === "none") {
                    promptHTML = `
                        <div class="warning-message">
                            <h3>Run Logged: ${distance}km</h3>
                            <p>Tip: Next time, select a pledge to turn your run into community support!</p>
                        </div>`;
                } else {
                    promptHTML = `
                        <div class="success-message">
                            <h3><span style="font-size:24px">🎉</span> Wealth Shared!</h3>
                            <p>Great job! You ran <strong>${distance}km</strong>.</p>
                            <p>You raised <strong>$${moneyRaised}</strong> for <strong>${pledgeType}</strong>.</p>
                        </div>`;
                }

                if (feedbackBox) {
                    feedbackBox.innerHTML = promptHTML;
                    feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                if(typeof addRunToTable === 'function') addRunToTable(distance, pledgeType, new Date().toLocaleDateString()); 
                runForm.reset(); 
            });
        }
    }

    // ======================================================
    // PAGE 4: DASHBOARD & LEADERBOARD LOGIC
    // ======================================================
    if (document.title.includes("My Impact") || document.title.includes("Dashboard")) {
        if(typeof updateDashboardStats === 'function') updateDashboardStats();
    }

    if (document.title.includes("Leaderboard")) {
        if(typeof updateLeaderboardUserStats === 'function') updateLeaderboardUserStats();
    }
});

// ======================================================
// DATA FUNCTIONS (Keep these so Tracker works)
// ======================================================

function saveRun(distance, pledge) {
    let runs = JSON.parse(localStorage.getItem('runHistory')) || [];
    const newRun = {
        date: new Date().toLocaleDateString(),
        distance: parseFloat(distance),
        pledge: pledge,
        wealth: (parseFloat(distance) * 1.00).toFixed(2) 
    };
    runs.unshift(newRun); 
    localStorage.setItem('runHistory', JSON.stringify(runs));
}

function loadRunHistoryTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const runs = JSON.parse(localStorage.getItem('runHistory')) || [];
    if (runs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding: 20px;">No runs logged yet. Start running!</td></tr>';
        return;
    }
    runs.forEach(run => {
        addRunToTable(run.distance, run.pledge, run.date);
    });
}

function addRunToTable(distance, pledge, dateStr) {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody) return;
    if(tableBody.innerHTML.includes("No runs logged yet")) {
        tableBody.innerHTML = '';
    }
    let pledgeText = "-";
    let wealthText = "$0.00";
    if (pledge !== "none") {
        pledgeText = '<span class="ethics-badge">' + pledge.toUpperCase() + '</span>';
        wealthText = `+$${(distance * 1.00).toFixed(2)}`;
    }
    const newRow = `<tr><td>${dateStr}</td><td>${distance} km</td><td>-</td><td>${pledgeText}</td><td style="color: #00a36c; font-weight: bold;">${wealthText}</td></tr>`;
    tableBody.insertAdjacentHTML('afterbegin', newRow);
}

function updateDashboardStats() {
    const runs = JSON.parse(localStorage.getItem('runHistory')) || [];
    let totalDistance = 0;
    let totalWealth = 0;
    let activePledge = "None";

    if (runs.length > 0) {
        runs.forEach(run => {
            totalDistance += run.distance;
            if(run.pledge !== 'none') {
                totalWealth += parseFloat(run.wealth);
            }
        });
        if (runs[0].pledge !== 'none') {
            activePledge = runs[0].pledge;
        }
    }

    const statValues = document.querySelectorAll('.stat-value');
    if(statValues.length >= 3) {
        statValues[0].textContent = "$" + totalWealth.toFixed(2);
        statValues[1].textContent = totalDistance.toFixed(1) + " km";
        statValues[2].textContent = activePledge;
    }

    const feed = document.querySelector('.activity-feed');
    if(feed) {
        feed.innerHTML = ''; 
        if (runs.length === 0) {
            feed.innerHTML = '<li class="activity-item" style="justify-content:center; color:#999;">No recent activity.</li>';
        } else {
            runs.slice(0, 3).forEach(run => {
                let amountDisplay = run.pledge !== 'none' ? `+$${run.wealth} ${run.pledge}` : 'No Pledge';
                const html = `<li class="activity-item"><div class="activity-left"><span class="activity-title">Run Logged (${run.distance}km)</span><span class="activity-date">${run.date}</span></div><span class="activity-amount">${amountDisplay}</span></li>`;
                feed.insertAdjacentHTML('beforeend', html);
            });
        }
    }
}

function updateLeaderboardUserStats() {
    const runs = JSON.parse(localStorage.getItem('runHistory')) || [];
    const currentUser = localStorage.getItem('runClubUser');
    if (!currentUser || runs.length === 0) return;

    let totalDistance = 0;
    let totalWealth = 0;

    runs.forEach(run => {
        totalDistance += run.distance;
        if(run.pledge !== 'none') {
            totalWealth += parseFloat(run.wealth);
        }
    });

    const tableRows = document.querySelectorAll('.data-table tbody tr');
    if (tableRows.length >= 3) {
        const userRow = tableRows[2]; 
        const cells = userRow.getElementsByTagName('td');
        if (cells.length >= 5) {
            cells[1].textContent = currentUser + " (You)";
            cells[1].style.fontWeight = "bold";
            cells[1].style.color = "#00a36c";
            cells[2].textContent = totalDistance.toFixed(1) + " km";
            cells[4].textContent = "$" + totalWealth.toFixed(2);
        }
    }
}