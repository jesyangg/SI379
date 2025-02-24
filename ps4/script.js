const state = {
    questions: [],
    answers: {},
    score: {
        correct: 0,
        total: 0
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateScore() {
    const scoreBoard = document.getElementById('score-board');
    scoreBoard.textContent = `Score: ${state.score.correct} / ${state.score.total}`;
}

function handleAnswer(questionId, selectedAnswer, correctAnswer, button) {
    if (state.answers[questionId]) return;

    state.answers[questionId] = selectedAnswer;
    const isCorrect = selectedAnswer === correctAnswer;

    state.score.total++;
    if (isCorrect) state.score.correct++;
    updateScore();

    const answerButtons = button.parentElement.querySelectorAll('.answer-button');
    answerButtons.forEach(btn => {
        btn.disabled = true;
        const answer = btn.dataset.answer;
        if (answer === correctAnswer) {
            btn.classList.add('correct');
        } else if (answer === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
}

function createQuestionElement(question) {
    const container = document.createElement('div');
    container.className = 'question-container';

    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question.text;
    container.appendChild(questionText);

    const answersContainer = document.createElement('div');
    answersContainer.className = 'answers-container';

    const allAnswers = shuffleArray([question.correctAnswer, ...question.incorrectAnswers]);

    allAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-button';
        button.textContent = answer;
        button.dataset.answer = answer;
        button.onclick = () => handleAnswer(
            question.id,
            answer,
            question.correctAnswer,
            button
        );
        answersContainer.appendChild(button);
    });

    container.appendChild(answersContainer);
    return container;
}

async function initializeGame() {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '<div class="loading">Loading questions...</div>';

    try {
        const response = await fetch('https://the-trivia-api.com/v2/questions');
        if (!response.ok) throw new Error('Failed to fetch questions');
        
        const questions = await response.json();
        state.questions = questions;

        questionsContainer.innerHTML = '';
        questions.forEach(question => {
            const questionElement = createQuestionElement(question);
            questionsContainer.appendChild(questionElement);
        });
    } catch (error) {
        questionsContainer.innerHTML = `
            <div class="error">
                Error loading questions. Please try refreshing the page.
            </div>
        `;
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeGame);