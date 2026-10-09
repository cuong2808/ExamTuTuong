let allQuestions = [];
let exams = [];
let userAnswers = [];
let shuffledExams = [];

// load dữ liệu
async function init() {
    const res = await fetch('question.json');
    const data = await res.json();
    allQuestions = data.questions;

    generateExams();
    renderSidebar();
    renderPractice();
}

// shuffle array
function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

// sinh 10 đề
function generateExams() {
    const totalExams = 10;
    const questionsPerExam = 60;

    let shuffled = shuffle(allQuestions);

    for (let i = 0; i < totalExams; i++) {
        exams[i] = [];
    }

    shuffled.forEach((q, index) => {
        exams[index % totalExams].push(q);
    });

    exams = exams.map(exam => {
        while (exam.length < questionsPerExam) {
            let q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
            if (!exam.includes(q)) exam.push(q);
        }
        return shuffle(exam);
    });
}

// shuffle đáp án cho đề thi
function shuffleExamQuestions(exam) {
    return exam.map(q => {
        const keys = Object.keys(q.options);
        const shuffledKeys = shuffle(keys);

        let newOptions = {};
        let newAnswer = '';

        shuffledKeys.forEach((k, index) => {
            const newKey = String.fromCharCode(65 + index); // A B C D
            newOptions[newKey] = q.options[k];
            if (k === q.answer) newAnswer = newKey;
        });

        return {
            ...q,
            options: newOptions,
            answer: newAnswer
        };
    });
}

// sidebar
function renderSidebar() {
    const list = document.getElementById('exam-list');

    const practiceBtn = document.createElement('button');
    practiceBtn.innerText = "Ôn luyện";
    practiceBtn.onclick = renderPractice;
    list.appendChild(practiceBtn);

    exams.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.innerText = "Đề " + (i + 1);
        btn.onclick = () => renderExam(i);
        list.appendChild(btn);
    });
}

// ôn luyện (KHÔNG shuffle)
function renderPractice() {
    document.getElementById('title').innerText = "Ôn luyện";
    document.getElementById('submit-btn').style.display = "none";
    document.getElementById('result').innerHTML = "";
    renderQuestions(allQuestions, false);
}

// thi
function renderExam(index) {
    document.getElementById('title').innerText = "Đề " + (index + 1);
    document.getElementById('submit-btn').style.display = "block";
    document.getElementById('result').innerHTML = "";

    // shuffle đáp án tại đây
    shuffledExams[index] = shuffleExamQuestions(exams[index]);

    userAnswers = new Array(60).fill(null);

    renderQuestions(shuffledExams[index], true, index);

    document.getElementById('submit-btn').onclick = () => submit(index);
}

// render
function renderQuestions(questions, isExam, examIndex) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = "";

    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'question';

        // ✅ hiển thị Câu 1 -> 60
        div.innerHTML = `<b>Câu ${i + 1}:</b> ${q.question}`;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'options';

        const answerText = document.createElement('div');
        answerText.className = 'answer';

        Object.keys(q.options).forEach(key => {
            const btn = document.createElement('button');
            btn.innerText = key + ". " + q.options[key];

            btn.onclick = () => {
                if (isExam) {
                    userAnswers[i] = key;

                    optionDiv.querySelectorAll('button').forEach(b => {
                        b.style.border = '';
                    });

                    btn.style.border = '2px solid blue';
                } else {
                    handlePractice(btn, key, q, optionDiv, answerText);
                }
            };

            optionDiv.appendChild(btn);
        });

        div.appendChild(optionDiv);
        div.appendChild(answerText);

        container.appendChild(div);
    });
}

// ôn luyện
function handlePractice(btn, selected, q, optionDiv, answerText) {
    const buttons = optionDiv.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);

    if (selected === q.answer) {
        btn.classList.add('correct');
        answerText.innerHTML = "✅ Chính xác";
    } else {
        btn.classList.add('wrong');
        answerText.innerHTML = `❌ Đáp án đúng là: ${q.answer}`;

        buttons.forEach(b => {
            if (b.innerText.startsWith(q.answer)) {
                b.classList.add('correct');
            }
        });
    }
}

// submit + review + lưu
function submit(examIndex) {
    const questions = shuffledExams[examIndex];
    let correct = 0;

    questions.forEach((q, i) => {
        if (userAnswers[i] === q.answer) correct++;
    });

    let score = (correct / questions.length * 10).toFixed(2);

    // ✅ lưu localStorage
    localStorage.setItem("lastResult", JSON.stringify({
        exam: examIndex + 1,
        correct,
        total: questions.length,
        score,
        time: new Date().toLocaleString()
    }));

    document.getElementById('result').innerHTML =
        `✅ Đúng: ${correct}/${questions.length} 
        <br>🎯 Điểm: ${score}`;

    // ✅ REVIEW
    reviewAnswers(questions);
}

// review bài làm
function reviewAnswers(questions) {
    const container = document.getElementById('quiz-container');
    const blocks = container.querySelectorAll('.question');

    questions.forEach((q, i) => {
        const buttons = blocks[i].querySelectorAll('button');
        const answerDiv = blocks[i].querySelector('.answer');

        buttons.forEach(btn => {
            btn.disabled = true;

            if (btn.innerText.startsWith(q.answer)) {
                btn.classList.add('correct');
            }

            if (
                userAnswers[i] &&
                btn.innerText.startsWith(userAnswers[i]) &&
                userAnswers[i] !== q.answer
            ) {
                btn.classList.add('wrong');
            }
        });

        if (userAnswers[i] === q.answer) {
            answerDiv.innerHTML = "✅ Chính xác";
        } else {
            answerDiv.innerHTML = `❌ Đáp án đúng là: ${q.answer}`;
        }
    });
}

init();