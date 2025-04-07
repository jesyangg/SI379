const state = {
    tasks: [],
    currentTimer: null,
    timeRemaining: 0,
    activeTaskId: null,
    isWorking: false,
    isBreak: false,
    workDuration: 25,
    breakDuration: 5
};


const container = document.querySelector('.container');
const timerDisplay = document.querySelector('.timer-display');
const workDurationInput = document.getElementById('workDuration');
const breakDurationInput = document.getElementById('breakDuration');
const addTaskButton = document.getElementById('add-task');
const newTaskInput = document.getElementById('new-task-input');
const tasksList = document.getElementById('tasks-list');
const cancelButton = document.querySelector('.btn-cancel');
const currentTaskNameElement = document.getElementById('current-task-name');


// Add this function to play the completion sound
function playCompletionSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set the sound parameters
    oscillator.type = 'sine'; // Sine wave - smooth sound
    oscillator.frequency.value = 800; // Higher frequency for work completion
    gainNode.gain.value = 0.3; // Lower volume to avoid being too jarring
    
    // Schedule the sound (short beep pattern)
    oscillator.start();
    
    // Create a beep pattern (two beeps)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.45);
    
    // Stop the oscillator after the pattern completes
    oscillator.stop(audioContext.currentTime + 0.5);
}

function showConfetti() {
    const colors = ['#fdbb2d', '#22c55e', '#f9fafb'];
    
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['circle'],
    });
    
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });
    }, 250);
}

function loadFromStorage() {
    const savedTasks = localStorage.getItem('lemonTimerTasks');
    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
        
        state.tasks.forEach(task => {
            if (task.workDuration === undefined) {
                task.workDuration = state.workDuration;
            }
            if (task.breakDuration === undefined) {
                task.breakDuration = state.breakDuration;
            }
        });
    }
    
    const savedWorkDuration = localStorage.getItem('lemonTimerWorkDuration');
    if (savedWorkDuration) {
        state.workDuration = parseFloat(savedWorkDuration);
        workDurationInput.value = state.workDuration;
    }
    
    const savedBreakDuration = localStorage.getItem('lemonTimerBreakDuration');
    if (savedBreakDuration) {
        state.breakDuration = parseFloat(savedBreakDuration);
        breakDurationInput.value = state.breakDuration;
    }
}

function saveToStorage() {
    localStorage.setItem('lemonTimerTasks', JSON.stringify(state.tasks));
    localStorage.setItem('lemonTimerWorkDuration', state.workDuration);
    localStorage.setItem('lemonTimerBreakDuration', state.breakDuration);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(state.timeRemaining);
}

function startWorkSession(taskId) {
    if (state.isWorking || state.isBreak) return;
    
    state.isWorking = true;
    state.isBreak = false;
    state.activeTaskId = taskId;
    
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        state.timeRemaining = task.workDuration * 60;
        currentTaskNameElement.textContent = task.description;
    } else {
        state.timeRemaining = state.workDuration * 60;
    }
    
    updateTimerDisplay();
    
    container.classList.add('app-state-transition');
    setTimeout(() => {
        updateAppState('working');
        startTimer();
        container.classList.remove('app-state-transition');
    }, 50);
}

function startBreakSession() {
    state.isWorking = false;
    state.isBreak = true;
    
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (task) {
        state.timeRemaining = task.breakDuration * 60;
    } else {
        state.timeRemaining = state.breakDuration * 60;
    }
    
    updateTimerDisplay();
    
    container.classList.add('app-state-transition');
    setTimeout(() => {
        updateAppState('break');
        startTimer();
        container.classList.remove('app-state-transition');
    }, 50);
}

function startTimer() {
    clearInterval(state.currentTimer);
    
    state.currentTimer = setInterval(() => {
        if (state.timeRemaining > 0) {
            state.timeRemaining--;
            updateTimerDisplay();
        } else {
            clearInterval(state.currentTimer);
            
            // Play sound when timer completes
            playCompletionSound();
            
            if (state.isWorking) {
                completeWorkSession();
                startBreakSession();
            } else if (state.isBreak) {
                resetTimer();
            }
        }
    }, 1000);
}

function completeWorkSession() {
    const taskIndex = state.tasks.findIndex(t => t.id === state.activeTaskId);
    if (taskIndex !== -1) {
        state.tasks[taskIndex].completedSessions++;
        saveToStorage();
        renderTasks();

        showConfetti();
    }
}

function resetTimer() {
    clearInterval(state.currentTimer);
    state.currentTimer = null;
    state.timeRemaining = 0;
    state.activeTaskId = null;
    state.isWorking = false;
    state.isBreak = false;
    
    container.classList.add('app-state-transition');
    setTimeout(() => {
        updateAppState('idle');
        container.classList.remove('app-state-transition');
    }, 50);
}

function updateAppState(newState) {
    container.className = 'container';
    container.classList.add(`app-state-${newState}`);
}

function createTask(description) {
    if (!description || description.trim() === '') return;
    
    const newTask = {
        id: Date.now().toString(),
        description: description.trim(),
        completedSessions: 0,
        workDuration: state.workDuration,  
        breakDuration: state.breakDuration  
    };
    
    state.tasks.push(newTask);
    saveToStorage();
    renderTasks();
    
    newTaskInput.value = '';
}

function editTask(taskId, newDescription, newWorkDuration, newBreakDuration) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        if (newDescription && newDescription.trim() !== '') {
            state.tasks[taskIndex].description = newDescription.trim();
        }
        
        if (newWorkDuration && !isNaN(newWorkDuration) && newWorkDuration > 0) {
            state.tasks[taskIndex].workDuration = parseFloat(newWorkDuration);
        }
        
        if (newBreakDuration && !isNaN(newBreakDuration) && newBreakDuration > 0) {
            state.tasks[taskIndex].breakDuration = parseFloat(newBreakDuration);
        }
        
        saveToStorage();
        renderTasks();
    }
}

function removeTask(taskId) {
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    
    if (taskElement) {
        taskElement.style.opacity = '0';
        taskElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            state.tasks = state.tasks.filter(task => task.id !== taskId);
            saveToStorage();
            renderTasks();
        }, 300);
    } else {
        state.tasks = state.tasks.filter(task => task.id !== taskId);
        saveToStorage();
        renderTasks();
    }
}

function cancelTaskEditing(taskElement) {
    taskElement.classList.remove('editing');
}

function renderTasks() {
    tasksList.innerHTML = '';
    
    if (state.tasks.length === 0) {
        const noTasksMessage = document.createElement('div');
        noTasksMessage.className = 'no-tasks-message';
        noTasksMessage.textContent = 'No tasks yet. Add a task to get started!';
        tasksList.appendChild(noTasksMessage);
        return;
    }
    
    state.tasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.taskId = task.id;
        
        taskElement.style.animationDelay = `${index * 0.05}s`;
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'task-description';
        
        const descriptionSpan = document.createElement('span');
        descriptionSpan.textContent = task.description;
        
        const descriptionInput = document.createElement('input');
        descriptionInput.type = 'text';
        descriptionInput.value = task.description;
        descriptionInput.className = 'edit-description';
        
        descriptionDiv.appendChild(descriptionSpan);
        descriptionDiv.appendChild(descriptionInput);
        
        const taskSettingsDiv = document.createElement('div');
        taskSettingsDiv.className = 'task-settings edit-only';
        
        const workDurationDiv = document.createElement('div');
        workDurationDiv.className = 'task-duration-setting';
        
        const workDurationLabel = document.createElement('label');
        workDurationLabel.textContent = 'Work (min)';
        workDurationLabel.htmlFor = `work-duration-${task.id}`;
        
        const workDurationEditInput = document.createElement('input');
        workDurationEditInput.type = 'number';
        workDurationEditInput.id = `work-duration-${task.id}`;
        workDurationEditInput.min = '0.1';
        workDurationEditInput.step = '0.1';
        workDurationEditInput.value = task.workDuration;
        workDurationEditInput.className = 'edit-work-duration';
        
        workDurationDiv.appendChild(workDurationLabel);
        workDurationDiv.appendChild(workDurationEditInput);
        
        const breakDurationDiv = document.createElement('div');
        breakDurationDiv.className = 'task-duration-setting';
        
        const breakDurationLabel = document.createElement('label');
        breakDurationLabel.textContent = 'Break (min)';
        breakDurationLabel.htmlFor = `break-duration-${task.id}`;
        
        const breakDurationEditInput = document.createElement('input');
        breakDurationEditInput.type = 'number';
        breakDurationEditInput.id = `break-duration-${task.id}`;
        breakDurationEditInput.min = '0.1';
        breakDurationEditInput.step = '0.1';
        breakDurationEditInput.value = task.breakDuration;
        breakDurationEditInput.className = 'edit-break-duration';
        
        breakDurationDiv.appendChild(breakDurationLabel);
        breakDurationDiv.appendChild(breakDurationEditInput);
        
        taskSettingsDiv.appendChild(workDurationDiv);
        taskSettingsDiv.appendChild(breakDurationDiv);
        
        const taskTimerInfoDiv = document.createElement('div');
        taskTimerInfoDiv.className = 'task-timer-info normal-only';
        taskTimerInfoDiv.textContent = `${task.workDuration}m / ${task.breakDuration}m`;
        
        const lemonsDiv = document.createElement('div');
        lemonsDiv.className = 'task-lemons';
        
        const lemonsCount = document.createElement('span');
        lemonsCount.textContent = task.completedSessions;
        lemonsDiv.appendChild(lemonsCount);
        
        const lemonIcon = document.createElement('span');
        lemonIcon.className = 'lemon';
        lemonIcon.textContent = '🍋';
        lemonsDiv.appendChild(lemonIcon);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        const startButton = document.createElement('button');
        startButton.className = 'btn-start';
        startButton.textContent = 'Start';
        startButton.addEventListener('click', () => {
            if (!state.isWorking && !state.isBreak) {
                startWorkSession(task.id);
            }
        });
        
        const editButton = document.createElement('button');
        editButton.className = 'btn-edit';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            taskElement.classList.add('editing');
            setTimeout(() => {
                descriptionInput.focus();
            }, 50);
        });
        
        const saveButton = document.createElement('button');
        saveButton.className = 'btn-save';
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            saveTaskEdits(taskElement, task.id);
        });
        
        descriptionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveTaskEdits(taskElement, task.id);
            }
        });
        
        const cancelEditButton = document.createElement('button');
        cancelEditButton.className = 'btn-cancel-edit';
        cancelEditButton.textContent = 'Cancel';
        cancelEditButton.addEventListener('click', () => {
            cancelTaskEditing(taskElement);
        });
        
        const removeButton = document.createElement('button');
        removeButton.className = 'btn-remove normal-only';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            removeTask(task.id);
        });
        
        actionsDiv.appendChild(startButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(saveButton);
        actionsDiv.appendChild(cancelEditButton); 
        actionsDiv.appendChild(removeButton);
        
        taskElement.appendChild(descriptionDiv);
        taskElement.appendChild(taskTimerInfoDiv);  
        taskElement.appendChild(taskSettingsDiv);  
        taskElement.appendChild(lemonsDiv);
        taskElement.appendChild(actionsDiv);
        
        tasksList.appendChild(taskElement);
    });
}

function saveTaskEdits(taskElement, taskId) {
    const descriptionInput = taskElement.querySelector('.edit-description');
    const workDurationInput = taskElement.querySelector('.edit-work-duration');
    const breakDurationInput = taskElement.querySelector('.edit-break-duration');
    
    const newDescription = descriptionInput.value.trim();
    const newWorkDuration = parseFloat(workDurationInput.value);
    const newBreakDuration = parseFloat(breakDurationInput.value);
    
    if (newDescription && newWorkDuration > 0 && newBreakDuration > 0) {
        editTask(taskId, newDescription, newWorkDuration, newBreakDuration);
        taskElement.classList.remove('editing');
    } else {
        if (!newDescription) {
            descriptionInput.classList.add('invalid');
        }
        if (!(newWorkDuration > 0)) {
            workDurationInput.classList.add('invalid');
        }
        if (!(newBreakDuration > 0)) {
            breakDurationInput.classList.add('invalid');
        }
        
        setTimeout(() => {
            descriptionInput.classList.remove('invalid');
            workDurationInput.classList.remove('invalid');
            breakDurationInput.classList.remove('invalid');
        }, 1000);
    }
}

addTaskButton.addEventListener('click', () => {
    createTask(newTaskInput.value);
});

newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createTask(newTaskInput.value);
    }
});

cancelButton.addEventListener('click', () => {
    resetTimer();
});

workDurationInput.addEventListener('change', () => {
    const newDuration = parseFloat(workDurationInput.value);
    if (newDuration > 0) {
        state.workDuration = newDuration;
        saveToStorage();
    } else {
        workDurationInput.value = state.workDuration;
    }
});

breakDurationInput.addEventListener('change', () => {
    const newDuration = parseFloat(breakDurationInput.value);
    if (newDuration > 0) {
        state.breakDuration = newDuration;
        saveToStorage();
    } else {
        breakDurationInput.value = state.breakDuration;
    }
});

function init() {
    loadFromStorage();
    renderTasks();
    updateTimerDisplay();
    
    workDurationInput.setAttribute('step', '0.1');
    breakDurationInput.setAttribute('step', '0.1');
    
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
