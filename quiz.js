/* ---------- VAL ---------- */

let answersDiv;
let currentLevel = 0;
let currentQuestion = 0;
let quizData;
let questionStartTime = Date.now();
let levelStartTime = Date.now();
let results = [];
let selectedAnswer = null;
let answerLocked = false;
let mistakes = 0;
let starCount = 0;

/* ---------- CONST ---------- */

const answerBox = document.getElementById("answer-box");
const submitBtn = document.getElementById("submit-btn");
const messageDiv = document.getElementById("message");
const progressBar = document.getElementById("progress-bar");
const infoBubble = document.getElementById("info-bubble");
const nextLevelBtn = document.getElementById("next-level-btn");
nextLevelBtn.onclick = startNextLevel;

/* ---------- CHARACTERS ---------- */

const characters = {
  left: {
    container: document.getElementById("character-left"),
    img: document.getElementById("char-left-img"),
    poses: [
      "images/characterA/idle.png",
      "images/characterA/pose1.png",
      "images/characterA/pose2.png",
      "images/characterA/pose3.png"
    ],
    idle: "images/characterA/idle.png",
    celebrate: "images/characterA/pose1.png"
  },
  right: {
    container: document.getElementById("character-right"),
    img: document.getElementById("char-right-img"),
    poses: [
      "images/characterB/idle.png",
      "images/characterB/pose1.png",
      "images/characterB/pose2.png",
      "images/characterB/pose3.png"
    ],
    idle: "images/characterB/idle.png",
    taunt: "images/characterB/pose3.png"
  }
};

/* ---------- LOAD QUIZ ---------- */

fetch("data/sample-quiz.json?v=4")
  .then(res => res.json())
  .then(data => {
    quizData = data;
    showQuestion();
  });

/* ---------- QUESTIONS ---------- */

function showQuestion() {
  const level = quizData.levels[currentLevel];
  const q = level.questions[currentQuestion];

  questionStartTime = Date.now();
  updateProgress();

  document.getElementById("question").textContent = q.question;
  infoBubble.textContent = q.info || "";
  messageDiv.textContent = "";

  answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  answerBox.textContent = "Sleep of typ hier je antwoord";
  answerBox.className = "answer-box";
  answerBox.contentEditable = false;

  selectedAnswer = null;
  answerLocked = false;

  if (q.type === "multiple-choice") renderMultipleChoice(q);
  if (q.type === "drag-drop") renderDragDrop(q);
  if (q.type === "text") renderTextQuestion();
}

/* ---------- RENDERING ---------- */

function renderMultipleChoice(q) {
  q.options.forEach(opt => createDraggable(opt));
  setupAnswerBoxDrop();
}

function renderDragDrop(q) {
  q.options.forEach(opt => createDraggable(opt));
  setupAnswerBoxDrop();
}

function renderTextQuestion() {
  answerBox.contentEditable = true;
  answerBox.classList.remove("locked");
  answerBox.textContent = "";
  answerBox.focus();
}

function createDraggable(text) {
  const item = document.createElement("div");
  item.textContent = text;
  item.className = "draggable";
  item.draggable = true;
  item.ondragstart = e => e.dataTransfer.setData("text", text);
  answersDiv.appendChild(item);
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

  const level = quizData.levels[currentLevel];
  const q = level.questions[currentQuestion];

  const answer =
    q.type === "text" ? answerBox.textContent.trim() : selectedAnswer;

  if (!answer) {
    flash("yellow", "Antwoord op de vraag alsjeblieft");
    return;
  }

  let correct = false;

  if (q.type === "multiple-choice") correct = answer === q.options[q.correct];
  if (q.type === "drag-drop") correct = answer === q.correct;
  if (q.type === "text") correct = answer === q.answer;

  if (!correct) {
    mistakes++;
    flash("red", "Oei, dat is niet juist");
    tauntRightCharacter();
    return;
  }

  // ✅ Correct
  answerLocked = true;
  answerBox.classList.add("locked");
  flash("green", "Correct!");
  celebrateLeftCharacter();
  flyStar();

  results.push({
  level: currentLevel,
  questionId: q.id,
  timeSpent: Date.now() - questionStartTime,
  correct: false
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


/* ---------- FLOW ---------- */

function nextQuestion() {
  const level = quizData.levels[currentLevel];
  currentQuestion++;

  if (currentQuestion < level.questions.length) {
    showQuestion();
  } else {
    showLevelResults();
  }
}

function startNextLevel() {
  currentLevel++;
  currentQuestion = 0;
  levelStartTime = Date.now();

  nextLevelBtn.style.display = "none";

  if (currentLevel < quizData.levels.length) {
    document.getElementById("result-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
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

/* ---------- PROGRESSBAR ---------- */

function updateProgress() {
  const level = quizData.levels[currentLevel];
  const percent = (currentQuestion / level.questions.length) * 100;
  progressBar.style.width = percent + "%";
}

/* ---------- RESULTS ---------- */

function showLevelResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("result-container").style.display = "block";

  document.getElementById("result-time").textContent =
    `⏱ Tijd in level: ${Math.floor((Date.now() - levelStartTime) / 1000)}s`;

  document.getElementById("result-stars").textContent =
    `⭐ Sterren: ${starCount+1}`;

sendResults("level-complete");

  nextLevelBtn.style.display = "inline-block";
  
  document.querySelectorAll("#result-container button").forEach(b => b.remove());
  
}

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

sendResults("quiz-complete");

console.log("🚀 PAYLOAD", JSON.stringify({
  totalTime: totalTimeMs,
  results
  
}, null, 2));}

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


characters.left.container.addEventListener("mouseenter", () => {
  if (infoBubble.textContent.trim() !== "") {
    infoBubble.classList.add("visible");
  }
});

characters.left.container.addEventListener("mouseleave", () => {
  infoBubble.classList.remove("visible");
});

characters.left.container.addEventListener("click", () => {
  infoBubble.classList.toggle("visible");
});

function randomPose(c) {
  c.img.src = c.poses[Math.floor(Math.random() * c.poses.length)];
}

function resetPose(c) {
  c.img.src = c.idle;
}

characters.left.img.onmouseenter = () => randomPose(characters.left);
characters.left.img.onmouseleave = () => resetPose(characters.left);

characters.right.img.onmouseenter = () => randomPose(characters.right);
characters.right.img.onmouseleave = () => resetPose(characters.right);

function celebrateLeftCharacter() {
  const c = characters.left;
  c.img.src = c.celebrate;
  c.container.classList.add("celebrate");
  setTimeout(() => {
    c.container.classList.remove("celebrate");
    c.img.src = c.idle;
  }, 600);
}

function tauntRightCharacter() {
  const c = characters.right;
  c.img.src = c.taunt;
  c.container.classList.add("taunt");
  setTimeout(() => {
    c.container.classList.remove("taunt");
    c.img.src = c.idle;
  }, 600);
}

/* ---------- DATA SENDING ---------- */

function sendResults(reason = "level-complete"){
  const payload = {
    reason,
    level: currentLevel,
    totalTime: Date.now() - quizStartTime,
    results
  };
  //Don't f*cking touch this
  fetch("https://backend-production-3c4a.up.railway.app/api/results", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(res => {
  if (!res.ok) throw new Error("Bad response");
  return res.json();
})
.then(data => console.log("Saved:", data))
.catch(err => console.error("Save failed:", err));
}