let answersDiv;
let currentQuestion = 0;
let quizData;
let questionStartTime;
let results = [];
let selectedAnswer = null;
let answerLocked = false;
let mistakes = 0;

const quizStartTime = Date.now();
const answerBox = document.getElementById("answer-box");
const submitBtn = document.getElementById("submit-btn");
const messageDiv = document.getElementById("message");
const progressBar = document.getElementById("progress-bar");

fetch("data/sample-quiz.json?v=3")
  .then(res => res.json())
  .then(data => { quizData = data; showQuestion(); });

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

/* ---------- ANSWER BOX ---------- */

answerBox.ondragover = e => e.preventDefault();

answerBox.ondrop = e => {
  e.preventDefault();
  if (answerLocked) return;

  selectedAnswer = e.dataTransfer.getData("text");
  answerBox.textContent = selectedAnswer;
};

/* ---------- SUBMIT ---------- */

submitBtn.onclick = () => {
  if (answerLocked) return;

  const q = quizData.questions[currentQuestion];
  const answer = q.type === "text" ? answerBox.textContent.trim() : selectedAnswer;

  if (!answer || answer === "Sleep of typ hier je antwoord") {
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

  // Correct answer
  answerLocked = true;
  answerBox.classList.add("locked");
  flash("green", "Correct!");
  flyStar();

  const timeSpent = Date.now() - questionStartTime;
  results.push({ questionId: q.id, timeSpent, correct: true });

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

function nextQuestion() {
  currentQuestion++;

  if (currentQuestion < quizData.questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

function resetAnswerBox() {
  selectedAnswer = null;
  answerLocked = false;
  answerBox.textContent = "Sleep of typ hier je antwoord";
  answerBox.className = "answer-box";
  answerBox.contentEditable = false;
}

function flash(color, text) {
  answerBox.classList.remove("yellow", "red", "green");
  answerBox.classList.add(color);
  messageDiv.textContent = text;

  setTimeout(() => {
    answerBox.classList.remove(color);
    messageDiv.textContent = "";
  }, 800);
}

function lockAnswer() {
  answerLocked = true;
  answerBox.classList.add("locked");
}

function updateProgress() {
  const total = quizData.questions.length;
  const percent = (currentQuestion / total) * 100;
  progressBar.style.width = percent + "%";
}

function finishQuiz() {
  progressBar.style.width = "100%";

  const totalTimeMs = Date.now() - quizStartTime;
  const totalSeconds = Math.floor(totalTimeMs / 1000);
  const totalStars = document.getElementById("star-bucket").children.length;

  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("result-container").style.display = "block";
  document.getElementById("result-time").textContent = `⏱ Totale tijd: ${totalSeconds} seconden`;
  document.getElementById("result-mistakes").textContent = `❌ Totaal aantal foutjes: ${mistakes}`;
  document.getElementById("result-stars").textContent = `⭐ Je hebt ${totalStars} sterren verdiend!`;

  fetch("backend-production-3c4a.up.railway.app/api/results", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    totalTime: totalTimeMs,
    results
  })
})
.then(res => {
  if (!res.ok) throw new Error("Network response was not ok");
  console.log("Results saved successfully!");
})
.catch(err => console.error("Failed to save results", err));
}

function flyStar() {
  const bucket = document.getElementById("star-bucket");
  const bucketRect = bucket.getBoundingClientRect();
  const answerBoxRect = answerBox.getBoundingClientRect();

  const star = document.createElement("div");
  star.classList.add("star");
  star.style.position = "fixed";
  star.style.width = "30px";
  star.style.height = "30px";
  document.body.appendChild(star);

  const startX = answerBoxRect.left + answerBoxRect.width / 2 - 15;
  const startY = answerBoxRect.top + answerBoxRect.height / 2 - 15;
  star.style.left = startX + "px";
  star.style.top = startY + "px";

  const endX = bucketRect.left + bucketRect.width / 2 - 15;
  const endY = bucketRect.top + bucketRect.height / 2 - 15;
  const arcHeight = Math.random() * -150 - 100;

  const animation = star.animate(
    [
      { transform: `translate(0, 0) rotate(0deg)` },
      { transform: `translate(${(endX - startX)/2}px, ${arcHeight}px) rotate(360deg)` },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(720deg)` }
    ],
    { duration: 1000, easing: "ease-in-out" }
  );

  animation.onfinish = () => {
    star.remove();

    const permanentStar = document.createElement("div");
    permanentStar.classList.add("star");
    permanentStar.style.position = "static";
    bucket.appendChild(permanentStar);

    // Landing bounce
    permanentStar.animate(
      [
        { transform: "translateY(-20px)" },
        { transform: "translateY(0)" }
      ],
      { duration: 300, easing: "ease-out" }
    );
  };
}