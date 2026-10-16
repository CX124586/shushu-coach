(function () {
  const subject = window.PRACTICE_SUBJECT || "练习";
  const questions = window.PRACTICE_QUESTIONS || [];
  const storageKey = "practice-progress-" + subject;

  let currentIndex = 0;
  let correctCount = 0;
  let answered = false;
  let wrongIds = [];

  const promptEl = document.getElementById("prompt");
  const optionsEl = document.getElementById("options");
  const scenarioEl = document.getElementById("scenario");
  const fillInputEl = document.getElementById("fill-input");
  const recallEl = document.getElementById("recall");
  const feedbackEl = document.getElementById("feedback");
  const explanationEl = document.getElementById("explanation");
  const progressEl = document.getElementById("progress");
  const scoreEl = document.getElementById("score");
  const nextBtn = document.getElementById("next");
  const restartBtn = document.getElementById("restart");

  function loadProgress() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        correctCount = data.correctCount || 0;
        wrongIds = data.wrongIds || [];
      }
    } catch (error) {
      wrongIds = [];
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        subject,
        correctCount,
        wrongIds,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      // 本地存储不可用时，仅保留本次会话状态。
    }
  }

  function currentQuestion() {
    return questions[currentIndex];
  }

  function render() {
    answered = false;
    feedbackEl.classList.remove("visible");
    nextBtn.disabled = true;
    optionsEl.innerHTML = "";
    scenarioEl.style.display = "none";
    scenarioEl.textContent = "";
    fillInputEl.style.display = "none";
    fillInputEl.value = "";
    recallEl.value = "";
    recallEl.style.display = "none";

    const q = currentQuestion();
    if (!q) return;

    promptEl.textContent = q.prompt;
    progressEl.textContent = "第 " + (currentIndex + 1) + " / " + questions.length + " 题";
    scoreEl.textContent = "已答对 " + correctCount + " 题";

    if (q.scenario) {
      scenarioEl.textContent = q.scenario;
      scenarioEl.style.display = "block";
    }

    if (q.type === "choice" || q.type === "scenario") {
      q.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "practice-option";
        button.type = "button";
        button.textContent = option;
        button.addEventListener("click", () => answerChoice(index, button));
        optionsEl.appendChild(button);
      });
    } else if (q.type === "fill") {
      fillInputEl.style.display = "block";
      const submitBtn = document.createElement("button");
      submitBtn.className = "practice-button";
      submitBtn.type = "button";
      submitBtn.textContent = "提交答案";
      submitBtn.addEventListener("click", answerFill);
      optionsEl.appendChild(submitBtn);
    } else {
      recallEl.style.display = "block";
      const submitBtn = document.createElement("button");
      submitBtn.className = "practice-button";
      submitBtn.type = "button";
      submitBtn.textContent = "提交并自查";
      submitBtn.addEventListener("click", answerRecall);
      optionsEl.appendChild(submitBtn);
    }
  }

  function answerChoice(selected, button) {
    if (answered) return;
    answered = true;

    const q = currentQuestion();
    const correct = selected === q.answer;
    if (correct) correctCount += 1;
    else wrongIds.push(q.id);

    [...optionsEl.querySelectorAll(".practice-option")].forEach((item, index) => {
      item.disabled = true;
      if (index === q.answer) item.classList.add("correct");
      if (index === selected && !correct) item.classList.add("wrong");
    });

    showFeedback(correct, q.explanation);
    saveProgress();
  }

  function answerRecall() {
    if (answered) return;
    answered = true;

    const q = currentQuestion();
    const buttons = document.createElement("div");
    buttons.className = "practice-actions";

    ["想起来了", "有点模糊", "没想起来"].forEach((label, index) => {
      const button = document.createElement("button");
      button.className = "practice-button";
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        if (index === 0) correctCount += 1;
        else wrongIds.push(q.id);
        showFeedback(index === 0, q.explanation);
        saveProgress();
      });
      buttons.appendChild(button);
    });

    optionsEl.innerHTML = "";
    optionsEl.appendChild(buttons);
  }

  function answerFill() {
    if (answered) return;
    answered = true;

    const q = currentQuestion();
    const value = (fillInputEl.value || "").trim().toLowerCase();
    const accepted = (q.answerText || []).map((item) => item.toLowerCase());
    const correct = accepted.includes(value);

    if (correct) correctCount += 1;
    else wrongIds.push(q.id);

    fillInputEl.disabled = true;
    showFeedback(correct, q.explanation);
    saveProgress();
  }

  function showFeedback(correct, explanation) {
    feedbackEl.classList.add("visible");
    explanationEl.textContent = (correct ? "正确。 " : "这次没答对。 ") + explanation;
    nextBtn.disabled = false;
  }

  function next() {
    if (currentIndex + 1 >= questions.length) {
      currentIndex = 0;
      restartBtn.style.display = "inline-block";
    } else {
      currentIndex += 1;
    }
    render();
  }

  function restart() {
    currentIndex = 0;
    correctCount = 0;
    wrongIds = [];
    restartBtn.style.display = "none";
    saveProgress();
    render();
  }

  nextBtn.addEventListener("click", next);
  restartBtn.addEventListener("click", restart);

  loadProgress();
  render();
})();
