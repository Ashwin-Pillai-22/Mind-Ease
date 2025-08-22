// PHQ-9 Questions
const phq9Questions = [
    "Little interest or pleasure in doing things?",
    "Feeling down, depressed, or hopeless?",
    "Trouble falling or staying asleep, or sleeping too much?",
    "Feeling tired or having little energy?",
    "Poor appetite or overeating?",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
    "Trouble concentrating on things, such as reading the newspaper or watching television?",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
    "Thoughts that you would be better off dead, or of hurting yourself in some way?"
];

// Response options
const responseOptions = [
    { text: "Not at all", value: 0 },
    { text: "Several days", value: 1 },
    { text: "More than half the days", value: 2 },
    { text: "Nearly every day", value: 3 }
];

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.getElementById('particles-js').appendChild(renderer.domElement);

// Create particles
const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 2000;
    particlePositions[i + 1] = (Math.random() - 0.5) * 2000;
    particlePositions[i + 2] = (Math.random() - 0.5) * 2000;

    // Add gradient colors
    particleColors[i] = Math.random() * 0.5 + 0.5; // R (0.5-1.0)
    particleColors[i + 1] = Math.random() * 0.3;   // G (0-0.3)
    particleColors[i + 2] = Math.random() * 0.5 + 0.5; // B (0.5-1.0)

    particleSizes[i / 3] = Math.random() * 3 + 1;
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
particles.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

const particleMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

camera.position.z = 500;

function animateParticles() {
    requestAnimationFrame(animateParticles);

    particleSystem.rotation.x += 0.0005;
    particleSystem.rotation.y += 0.0007;

    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.8;

        if (positions[i + 1] < -1000) {
            positions[i + 1] = 1000;
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 500;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animateParticles();

// Card flip functionality
const loginContainer = document.getElementById('loginContainer');
const toggleRegister = document.getElementById('toggleRegister');
const toggleLogin = document.getElementById('toggleLogin');
const appContainer = document.getElementById('appContainer');
const logoutBtn = document.getElementById('logoutBtn');

toggleRegister.addEventListener('click', () => {
    loginContainer.style.transform = 'rotateY(180deg)';
    showMessage("Creating a new account", false);
});

toggleLogin.addEventListener('click', () => {
    loginContainer.style.transform = 'rotateY(0deg)';
    showMessage("Welcome back! Please login", false);
});

// Message display function
function showMessage(text, isError = false) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.backgroundColor = isError ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    messageEl.style.color = isError ? '#fff' : '#4a00e0';
    messageEl.classList.add('show');

    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// User management
function createUser(userData) {
    const users = JSON.parse(localStorage.getItem('mindease_users') || '[]');

    // Check if user already exists
    if (users.some(user => user.email === userData.email)) {
        throw new Error('User with this email already exists');
    }

    const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        joinDate: new Date().toISOString(),
        wellnessStats: {
            sessions: 0,
            streak: 0,
            wellnessScore: 75
        },
        screeningHistory: []
    };

    users.push(newUser);
    localStorage.setItem('mindease_users', JSON.stringify(users));

    return newUser;
}

function loginUser(credentials) {
    const users = JSON.parse(localStorage.getItem('mindease_users') || '[]');
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Update user's last login
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('mindease_users', JSON.stringify(users));
    localStorage.setItem('mindease_current_user', JSON.stringify(user));

    return user;
}

function updateUserProfile(user) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;

    // Format join date
    const joinDate = new Date(user.joinDate);
    document.getElementById('joinDate').textContent =
        joinDate.toLocaleString('default', { month: 'short', year: 'numeric' });

    // Update stats
    document.getElementById('sessionsCount').textContent = user.wellnessStats.sessions;
    document.getElementById('streakCount').textContent = user.wellnessStats.streak;
    document.getElementById('wellnessScore').textContent = user.wellnessStats.wellnessScore;

    // Update screening history
    const historyContainer = document.getElementById('screeningHistory');
    historyContainer.innerHTML = '';

    if (user.screeningHistory.length === 0) {
        historyContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No screening history yet</div>';
    } else {
        user.screeningHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const historyDate = new Date(entry.date);
            const formattedDate = historyDate.toLocaleString('default', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            historyItem.innerHTML = `
                        <div class="history-date">${formattedDate}</div>
                        <div class="history-score">PHQ-9: ${entry.score}</div>
                    `;
            historyContainer.appendChild(historyItem);
        });
    }
}

// Depression Screening Logic
let currentQuestion = 0;
let userResponses = [];

function showScreeningModal() {
    const modal = document.getElementById('screeningModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    resetScreening();
    displayQuestion();
}

function closeScreeningModal() {
    const modal = document.getElementById('screeningModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function resetScreening() {
    currentQuestion = 0;
    userResponses = [];
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('submitScreeningBtn').style.display = 'none';
    updateProgressBar(0);
}

function displayQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';

    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = `Question ${currentQuestion + 1}: ${phq9Questions[currentQuestion]}`;
    questionDiv.appendChild(questionText);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'options-grid';

    responseOptions.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option.text;
        optionBtn.dataset.value = option.value;
        optionBtn.addEventListener('click', () => selectOption(option.value, optionBtn));
        optionsGrid.appendChild(optionBtn);
    });

    questionDiv.appendChild(optionsGrid);
    questionsContainer.appendChild(questionDiv);

    updateProgressBar(((currentQuestion) / phq9Questions.length) * 100);

    if (currentQuestion > 0) {
        document.getElementById('nextQuestionBtn').style.display = 'block';
    }
}

function selectOption(value, button) {
    // Remove selected class from all buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Add selected class to clicked button
    button.classList.add('selected');

    // Store the response
    userResponses[currentQuestion] = value;

    // Enable next button
    document.getElementById('nextQuestionBtn').style.display = 'block';
}

function nextQuestion() {
    if (userResponses[currentQuestion] === undefined) {
        showMessage("Please select an answer", true);
        return;
    }

    currentQuestion++;

    if (currentQuestion < phq9Questions.length) {
        displayQuestion();
    } else {
        // All questions answered
        document.getElementById('nextQuestionBtn').style.display = 'none';
        document.getElementById('submitScreeningBtn').style.display = 'block';
        updateProgressBar(100);
    }
}

function submitScreening() {
    if (userResponses.length !== phq9Questions.length) {
        showMessage("Please answer all questions", true);
        return;
    }

    // Calculate total score
    const totalScore = userResponses.reduce((sum, value) => sum + value, 0);

    // Determine severity
    let severity, description;
    let severityClass = 'severity-minimal';

    if (totalScore <= 4) {
        severity = "Minimal";
        description = "Your responses suggest minimal signs of depression. Continue practicing self-care and monitor your mood regularly.";
    } else if (totalScore <= 9) {
        severity = "Mild";
        description = "Your responses indicate mild symptoms of depression. Consider talking to someone you trust about how you're feeling.";
        severityClass = 'severity-mild';
    } else if (totalScore <= 14) {
        severity = "Moderate";
        description = "Your responses suggest moderate depression symptoms. Professional support may be beneficial at this stage.";
        severityClass = 'severity-moderate';
    } else if (totalScore <= 19) {
        severity = "Moderately Severe";
        description = "Your responses indicate moderately severe depression. We recommend consulting a mental health professional.";
        severityClass = 'severity-severe';
    } else {
        severity = "Severe";
        description = "Your responses suggest severe depression symptoms. Please seek professional help as soon as possible.";
        severityClass = 'severity-severe';
    }

    // Generate recommendations based on severity
    let recommendations = [];
    if (totalScore <= 4) {
        recommendations = [
            "Practice regular self-care activities",
            "Maintain social connections",
            "Engage in physical activity",
            "Try mindfulness or meditation exercises"
        ];
    } else if (totalScore <= 9) {
        recommendations = [
            "Consider talking to a counselor",
            "Try mood tracking apps",
            "Practice mindfulness techniques",
            "Establish a regular sleep schedule",
            "Reach out to friends or family"
        ];
    } else if (totalScore <= 14) {
        recommendations = [
            "Schedule an appointment with your doctor",
            "Explore therapy options",
            "Consider joining a support group",
            "Create a wellness plan with achievable goals",
            "Practice stress management techniques"
        ];
    } else {
        recommendations = [
            "Contact a mental health professional immediately",
            "Discuss treatment options with your doctor",
            "Reach out to trusted friends or family",
            "Create a safety plan for difficult moments",
            "Consider contacting a crisis helpline if needed"
        ];
    }

    // Display results
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('submitScreeningBtn').style.display = 'none';

    document.getElementById('totalScore').textContent = totalScore;
    document.getElementById('severityLevel').textContent = severity;
    document.getElementById('severityLevel').className = `severity-indicator ${severityClass}`;
    document.getElementById('severityDescription').textContent = description;

    // Populate recommendations
    const recommendationList = document.getElementById('recommendationList');
    recommendationList.innerHTML = '';

    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-check-circle"></i> ${rec}`;
        recommendationList.appendChild(li);
    });
}

function saveScreeningResults() {
    const totalScore = parseInt(document.getElementById('totalScore').textContent);
    const severity = document.getElementById('severityLevel').textContent;

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('mindease_current_user'));
    if (!currentUser) return;

    // Add to screening history
    currentUser.screeningHistory.unshift({
        date: new Date().toISOString(),
        score: totalScore,
        severity: severity
    });

    // Update wellness score
    if (totalScore <= 4) {
        currentUser.wellnessStats.wellnessScore = Math.min(100, currentUser.wellnessStats.wellnessScore + 5);
    } else if (totalScore <= 9) {
        currentUser.wellnessStats.wellnessScore = Math.min(100, currentUser.wellnessStats.wellnessScore + 2);
    } else if (totalScore <= 14) {
        // No change
    } else {
        currentUser.wellnessStats.wellnessScore = Math.max(0, currentUser.wellnessStats.wellnessScore - 5);
    }

    // Update sessions count
    currentUser.wellnessStats.sessions++;

    // Update localStorage
    const users = JSON.parse(localStorage.getItem('mindease_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('mindease_users', JSON.stringify(users));
        localStorage.setItem('mindease_current_user', JSON.stringify(currentUser));
    }

    // Update UI
    updateUserProfile(currentUser);
    showMessage("Screening results saved to your profile");
    closeScreeningModal();
}

function updateProgressBar(percentage) {
    document.getElementById('screeningProgress').style.width = `${percentage}%`;
}

// Form submission handlers
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const depressionScreeningBtn = document.getElementById('depressionScreeningBtn');
const closeModalBtn = document.getElementById('closeModal');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitScreeningBtn = document.getElementById('submitScreeningBtn');
const saveResultsBtn = document.getElementById('saveResultsBtn');

// Event listeners
depressionScreeningBtn.addEventListener('click', showScreeningModal);
closeModalBtn.addEventListener('click', closeScreeningModal);
nextQuestionBtn.addEventListener('click', nextQuestion);
submitScreeningBtn.addEventListener('click', submitScreening);
saveResultsBtn.addEventListener('click', saveScreeningResults);

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage('Please fill in all fields', true);
        return;
    }

    try {
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        const user = await loginUser({ email, password });
        showMessage(`Welcome back, ${user.name}!`);

        // Reset form
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';

        // Update user profile
        updateUserProfile(user);

        // Transition to app view
        setTimeout(() => {
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            document.body.style.background = '#f3f4f6';
        }, 1500);
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        loginBtn.textContent = 'Login';
        loginBtn.disabled = false;
    }
});

registerBtn.addEventListener('click', async () => {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', true);
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', true);
        return;
    }

    try {
        registerBtn.textContent = 'Creating account...';
        registerBtn.disabled = true;

        const user = await createUser({ name, email, password });
        showMessage(`Account created! Welcome, ${user.name}`);

        // Reset form
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';

        // Update user profile
        updateUserProfile(user);

        // Flip back to login and transition to app
        setTimeout(() => {
            loginContainer.style.transform = 'rotateY(0deg)';

            setTimeout(() => {
                loginContainer.style.display = 'none';
                appContainer.style.display = 'block';
                document.body.style.background = '#f3f4f6';
            }, 500);
        }, 1000);
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        registerBtn.textContent = 'Register';
        registerBtn.disabled = false;
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('mindease_current_user');
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
    document.body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
    showMessage("You have been logged out");
});

// Check for existing session on page load
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('mindease_current_user'));

    if (currentUser) {
        updateUserProfile(currentUser);
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        document.body.style.background = '#f3f4f6';
    } else {
        // Show welcome message
        setTimeout(() => {
            showMessage("Welcome to MindEase - Your Mental Wellness Companion");
        }, 1000);
    }
});

// Responsive adjustments
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Auto-focus on inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function () {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});