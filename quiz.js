let answersDiv;
let currentQuestion = 0;
let quizData;
let questionStartTime;
let results = [];
let selectedAnswer = null;
let answerLocked = false;
let mistakes = 0;
let starCount = 0;

const quizStartTime = Date.now();
const answerBox = document.getElementById("answer-box");
const submitBtn = document.getElementById("submit-btn");
const messageDiv = document.getElementById("message");
const progressBar = document.getElementById("progress-bar");

/* ---------- LOAD QUIZ ---------- */

fetch("data/sample-quiz.json?v=3")
  .then(res => res.json())
  .then(data => {
    quizData = data;
    showQuestion();
  });

/* ---------- QUESTIONS ---------- */

function showQuestion() {
  const q = quizData.questions[currentQuestion];
  questionStartTime = Date.now();
  updateProgress();

  document.getElementById("question").textContent = q.question;
  messageDiv.textContent = "";

  answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  answerBox.textContent = "Sleep of typ hier je antwoord";
  answerBox.className = "answer-box";
  answerBox.contentEditable = false;

  selectedAnswer = null;
  answerLocked = false;

  if (q.type === "multiple-choice") renderMultipleChoice(q);
  if (q.type === "text") renderTextQuestion();
  if (q.type === "drag-drop") renderDragDrop(q);
}

/* ---------- RENDERING ---------- */

function renderMultipleChoice(q) {
  q.options.forEach(opt => {
    const item = document.createElement("div");
    item.textContent = opt;
    item.className = "draggable";
    item.draggable = true;
    item.ondragstart = e => e.dataTransfer.setData("text", opt);
    answersDiv.appendChild(item);
  });
  setupAnswerBoxDrop();
}

function renderTextQuestion() {
  answerBox.contentEditable = true;
  answerBox.classList.remove("locked");

  if (!answerBox.textContent || answerBox.textContent === "Sleep of typ hier je antwoord") {
    answerBox.textContent = "";
  }

  answerBox.focus();
  answerBox.onfocus = () => {
    if (answerBox.textContent === "Sleep of typ hier je antwoord") {
      answerBox.textContent = "";
    }
  };
  answerBox.onblur = () => {
    if (answerBox.textContent.trim() === "") {
      answerBox.textContent = "Sleep of typ hier je antwoord";
    }
  };
}

function renderDragDrop(q) {
  q.options.forEach(opt => {
    const item = document.createElement("div");
    item.textContent = opt;
    item.className = "draggable";
    item.draggable = true;
    item.ondragstart = e => e.dataTransfer.setData("text", opt);
    answersDiv.appendChild(item);
  });
  setupAnswerBoxDrop();
}

function setupAnswerBoxDrop() {
  answerBox.ondragover = e => e.preventDefault();
  answerBox.ondrop = e => {
    e.preventDefault();
    if (answerLocked) return;
    selectedAnswer = e.dataTransfer.getData("text");
    answerBox.textContent = selectedAnswer;
  };
}

/* ---------- SUBMIT ---------- */

submitBtn.onclick = () => {
  if (answerLocked) return;

  const q = quizData.questions[currentQuestion];
  const answer = q.type === "text"
    ? answerBox.textContent.trim()
    : selectedAnswer;

  if (!answer) {
    flash("yellow", "Antwoord op de vraag alsjeblieft");
    return;
  }

  let correct = false;
  if (q.type === "multiple-choice") correct = answer === q.options[q.correct];
  else if (q.type === "drag-drop") correct = answer === q.correct;
  else if (q.type === "text") correct = answer === q.answer;

  if (!correct) {
    mistakes++;
    flash("red", "Oei, dat is niet juist, probeer opnieuw");
    return;
  }

  // Correct
  answerLocked = true;
  answerBox.classList.add("locked");
  flash("green", "Correct!");
  flyStar();

  results.push({
    questionId: q.id,
    timeSpent: Date.now() - questionStartTime,
    correct: true
  });

  setTimeout(nextQuestion, 800);
};

/* ---------- HELPERS ---------- */

function saveResult() {
  const q = quizData.questions[currentQuestion];
  results.push({
    questionId: q.id,
    timeSpent: Date.now() - questionStartTime,
    correct: true
  });
}

  setTimeout(nextQuestion, 800);

/* ---------- FLOW ---------- */

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizData.questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

/* ---------- FEEDBACK ---------- */

function flash(color, text) {
  answerBox.classList.remove("yellow", "red", "green");
  answerBox.classList.add(color);
  messageDiv.textContent = text;

  setTimeout(() => {
    answerBox.classList.remove(color);
    messageDiv.textContent = "";
  }, 800);
}

function updateProgress() {
  const percent = (currentQuestion / quizData.questions.length) * 100;
  progressBar.style.width = percent + "%";
}

/* ---------- FINISH ---------- */

function finishQuiz() {
  progressBar.style.width = "100%";

  const totalTimeMs = Date.now() - quizStartTime;
  const totalSeconds = Math.floor(totalTimeMs / 1000);

  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("result-container").style.display = "block";

  document.getElementById("result-time").textContent =
    `⏱ Totale tijd: ${totalSeconds} seconden`;
  document.getElementById("result-mistakes").textContent =
    `❌ Totaal aantal foutjes: ${mistakes}`;
  document.getElementById("result-stars").textContent =
    `⭐ Je hebt ${starCount+1} sterren verdiend!`;

  fetch("backend-production-3c4a.up.railway.app/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ totalTime: totalTimeMs, results })
  }).catch(console.error);
}

/* ---------- STARS ---------- */

function flyStar() {
  const bucket = document.getElementById("star-bucket");
  const answerBoxRect = answerBox.getBoundingClientRect();
  const bucketRect = bucket.getBoundingClientRect();

  const star = document.createElement("div");
  star.className = "star";
  star.style.position = "fixed";
  star.style.width = "30px";
  star.style.height = "30px";

  document.body.appendChild(star);

  const startX = answerBoxRect.left + answerBoxRect.width / 2 - 15;
  const startY = answerBoxRect.top + answerBoxRect.height / 2 - 15;
  const endX = bucketRect.left + bucketRect.width / 2 - 15;
  const endY = bucketRect.top + bucketRect.height / 2 - 15;

  star.style.left = startX + "px";
  star.style.top = startY + "px";

  const animation = star.animate(
    [
      { transform: "translate(0, 0) scale(1)" },
      { transform: `translate(${(endX - startX) / 2}px, -120px) scale(1.2)` },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)` }
    ],
    { duration: 900, easing: "ease-in-out" }
  );

  animation.onfinish = () => {
    star.remove();
    addStarToBucket();
  };
}

function addStarToBucket() {
  starCount++;

  const bucket = document.getElementById("star-bucket");

  // Expand bucket after 3 stars
  if (starCount >= 4) {
    bucket.classList.add("expanded");
  }

  // Clear stars (visual only)
  bucket.querySelectorAll(".star").forEach(s => s.remove());

  // Render max 6 visible stars
  const visibleStars = Math.min(starCount, 6);

  for (let i = 0; i < visibleStars; i++) {
    const s = document.createElement("div");
    s.className = "star";
    bucket.appendChild(s);
  }

  updateStarCounter();
}

function updateStarCounter() {
  const container = document.getElementById("star-bucket-container");

  let counter = document.getElementById("star-counter");
  if (!counter) {
    counter = document.createElement("div");
    counter.id = "star-counter";
    container.appendChild(counter);
  }

  counter.textContent = `⭐ ${starCount}`;
}