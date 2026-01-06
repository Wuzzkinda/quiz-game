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
const characterLeft = document.getElementById("character-left");
const infoBubble = document.getElementById("info-bubble");
const characters = {
  left: {
    img: document.getElementById("char-left-img"),
    poses: [
      "images/characterA/idle.png",
      "images/characterA/pose1.png",
      "images/characterA/pose2.png",
      "images/characterA/pose3.png"
    ],
    idle: "images/characterA/idle.png"
  },
  right: {
    img: document.getElementById("char-right-img"),
    poses: [
      "images/characterB/idle.png",
      "images/characterB/pose1.png",
      "images/characterB/pose2.png",
      "images/characterB/pose3.png"
    ],
    idle: "images/characterB/idle.png"
  }
};

const characterPoses = {
  left: {
    idle: "images/left/idle.png",
    celebrate: "images/left/pose1.png"
  },
  right: {
    idle: "images/right/idle.png",
    taunt: "images/right/pose3.png"
  }
};

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
  const infoBubble = document.getElementById("info-bubble");
  questionStartTime = Date.now();
  updateProgress();

  infoBubble.textContent = q.info || "No hint available.";
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

  if (q.info) {
  infoBubble.textContent = q.info;
} else {
  infoBubble.textContent = "";
}
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
  tauntRightCharacter();
  return;
  }

  // Correct
  answerLocked = true;
  answerBox.classList.add("locked");
  flash("green", "Correct!");
  celebrateLeftCharacter();
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

console.log("🚀 PAYLOAD", JSON.stringify({
  totalTime: totalTimeMs,
  results
  
}, null, 2));

  fetch("https://backend-production-3c4a.up.railway.app/api/results", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    totalTime: Number(totalTimeMs),
    results: results || []
  })
})
.then(res => {
  if (!res.ok) throw new Error("Bad response");
  return res.json();
})
.then(data => console.log("Saved:", data))
.catch(err => console.error("Save failed:", err));
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

// Show info on hover or click
characterLeft.addEventListener("mouseenter", () => {
  if (infoBubble.textContent.trim() !== "") {
    infoBubble.classList.add("visible");
  }
});

characterLeft.addEventListener("mouseleave", () => {
  infoBubble.classList.remove("visible");
});

// Mobile support (tap)
characterLeft.addEventListener("click", () => {
  infoBubble.classList.toggle("visible");
});

function randomPose(character) {
  const poses = character.poses;
  const randomIndex = Math.floor(Math.random() * poses.length);
  character.img.src = poses[randomIndex];
}

function resetPose(character) {
  character.img.src = character.idle;
}

// LEFT CHARACTER
characters.left.img.addEventListener("mouseenter", () => {
  randomPose(characters.left);
});

characters.left.img.addEventListener("mouseleave", () => {
  resetPose(characters.left);
});

// RIGHT CHARACTER
characters.right.img.addEventListener("mouseenter", () => {
  randomPose(characters.right);
});

characters.right.img.addEventListener("mouseleave", () => {
  resetPose(characters.right);
});

function celebrateLeftCharacter() {
  const char = document.getElementById("character-left");
  const img = char.querySelector("img");

  // Switch pose
  img.src = characterPoses.left.celebrate;

  // Animate
  char.classList.add("celebrate");

  setTimeout(() => {
    char.classList.remove("celebrate");
    img.src = characterPoses.left.idle;
  }, 600);
}

function tauntRightCharacter() {
  const char = document.getElementById("character-right");
  const img = char.querySelector("img");

  // Switch pose
  img.src = characterPoses.right.taunt;

  // Animate
  char.classList.add("taunt");

  setTimeout(() => {
    char.classList.remove("taunt");
    img.src = characterPoses.right.idle;
  }, 600);
}