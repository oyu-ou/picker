document.addEventListener("DOMContentLoaded", () => {

  /* =============================
     MOBILE SAFARI UI HIDE
  ============================= */
  setTimeout(() => window.scrollTo(0, 1), 50);

  /* =============================
     START VIDEO OVERLAY
  ============================= */
  const startOverlay = document.getElementById("startAnimation");
  const introVideo = document.getElementById("introVideo");
  const skipBtn = document.getElementById("skipBtn");

  let overlayRemoved = false; // prevents double trigger

  function animateDistortion() {
    const turbulence = document.querySelector("#distort feTurbulence");
    if (!turbulence) return;

    let start = 0.01;
    const duration = 1000;
    const startTime = performance.now();

    function animate(time) {
      const progress = Math.min((time - startTime) / duration, 1);

      // easeOutCubic → VERY smooth
      const eased = 1 - Math.pow(1 - progress, 3);

      const value = start * (1 - eased);
      turbulence.setAttribute("baseFrequency", `${value} ${value}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        turbulence.setAttribute("baseFrequency", "0 0");
      }
    }

    requestAnimationFrame(animate);
  }

  function removeStartOverlay() {
    if (overlayRemoved) return;
    overlayRemoved = true;

    if (startOverlay) startOverlay.classList.add("hidden");
    if (skipBtn) skipBtn.classList.add("hidden");

    // run distortion once
    animateDistortion();
  }

  /* =============================
     FORCE VIDEO PLAY ON iOS
  ============================= */

  if (introVideo) {

    // try autoplay immediately
    introVideo.play().catch(()=>{});

    // fallback — first touch unlock
    document.addEventListener("touchstart", () => {
      introVideo.play().catch(()=>{});
    }, { once:true });

    introVideo.addEventListener("ended", removeStartOverlay);

    introVideo.addEventListener("click", () => {
      if (introVideo.webkitEnterFullscreen) {
        introVideo.webkitEnterFullscreen();
      }
    });
  }

  // auto remove after 2.5s
  setTimeout(removeStartOverlay, 2500);

  // skip button
  if (skipBtn) {
    skipBtn.addEventListener("click", removeStartOverlay);
  }

  /* =============================
     ELEMENTS
  ============================= */
  const wheel = document.getElementById("wheel");
  const spinBtn = document.getElementById("spinBtn");
  const overlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const closeBtn = document.getElementById("closeBtn");
  const toggleText = document.getElementById("toggleText");

  const optionInputs = [
    document.getElementById("option1"),
    document.getElementById("option2"),
    document.getElementById("option3"),
  ];

  /* =============================
     CHROME DETECT
  ============================= */
  const isChrome =
    /Chrome/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);

  if (isChrome) {
    document.documentElement.classList.add("chrome-only");
  }

  /* =============================
     STATE
  ============================= */
  const totalSlices = 11;
  let rotation = 0;

  let isDragging = false;
  let startAngle = 0;
  let lastAngle = 0;
  let velocity = 0;
  let lastTime = 0;

  /* =============================
     HELPERS
  ============================= */
  function getAngle(point) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(point.clientY - cy, point.clientX - cx) * 180 / Math.PI;
  }

  function startDrag(point) {
    isDragging = true;
    wheel.style.transition = "none";
    startAngle = getAngle(point) - rotation;
    lastAngle = rotation;
    lastTime = Date.now();
  }

  function moveDrag(point) {
    if (!isDragging) return;

    const angle = getAngle(point) - startAngle;
    const now = Date.now();

    velocity = (angle - lastAngle) / (now - lastTime);
    rotation = angle;

    wheel.style.transform = `rotate(${rotation}deg)`;
    lastAngle = angle;
    lastTime = now;
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    rotation += velocity * 600;
    wheel.style.transition = "transform 2s cubic-bezier(0.33,1,0.68,1)";
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(selectByVisualHit, 2000);
  }

  /* =============================
     MOUSE EVENTS
  ============================= */
  wheel.addEventListener("mousedown", e => startDrag(e));
  document.addEventListener("mousemove", e => moveDrag(e));
  document.addEventListener("mouseup", endDrag);

  /* =============================
     TOUCH EVENTS
  ============================= */
  wheel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) startDrag(e.touches[0]);
  }, { passive: true });

  document.addEventListener("touchmove", e => {
    if (e.touches.length === 1) moveDrag(e.touches[0]);
  }, { passive: true });

  document.addEventListener("touchend", endDrag, { passive: true });

  /* =============================
     CREATE WHEEL
  ============================= */
  function generateWheel() {
    const sliceAngle = 360 / totalSlices;
    const options = optionInputs.map(
      (inp, i) => inp.value.trim() || ["Yes", "No", "Maybe"][i]
    );

    wheel.innerHTML = "";

    for (let i = 0; i < totalSlices; i++) {
      const slice = document.createElement("div");
      slice.className = "slice";
      slice.style.transform = `rotate(${i * sliceAngle}deg)`;

      if (toggleText && toggleText.checked) {
        const wrapper = document.createElement("div");
        wrapper.className = "text-wrapper";

        const span = document.createElement("span");
        span.textContent = options[i % 3];

        wrapper.appendChild(span);
        slice.appendChild(wrapper);
      }

      wheel.appendChild(slice);
    }
  }

  generateWheel();
  if (toggleText) toggleText.addEventListener("change", generateWheel);
  optionInputs.forEach(inp => inp.addEventListener("input", generateWheel));

  /* =============================
     SPIN BUTTON
  ============================= */
  spinBtn.addEventListener("click", () => {
    spinBtn.disabled = true;

    rotation += Math.random() * 360 + 360 * 6;
    wheel.style.transition = "transform 4s ease-out";
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(selectByVisualHit, 4100);
  });

  /* =============================
     RESULT SELECTION
  ============================= */
  function selectByVisualHit() {
    document.querySelectorAll(".slice").forEach(s =>
      s.classList.remove("selected")
    );

    const rect = wheel.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height * 0.18;

    const slice = document.elementFromPoint(x, y)?.closest(".slice");
    if (!slice) {
      spinBtn.disabled = false;
      return;
    }

    slice.classList.add("selected");

    const slices = [...document.querySelectorAll(".slice")];
    const index = slices.indexOf(slice);

    const options = optionInputs.map(
      (inp, i) => inp.value.trim() || ["Yes", "No", "Maybe"][i]
    );

    resultText.textContent = `Result: ${options[index % 3]}`;
    overlay.style.display = "flex";
    spinBtn.disabled = false;
  }

  /* =============================
     OVERLAY CLOSE
  ============================= */
  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  /* =============================
     ENTER KEY CONTROL
  ============================= */
  document.addEventListener("keypress", e => {
    if (e.key !== "Enter") return;

    const focusedCheckbox = document.querySelector(
      ".label-container input[type='checkbox']:focus"
    );
    if (focusedCheckbox) return;

    overlay.style.display === "flex"
      ? closeBtn.click()
      : spinBtn.click();
  });

});