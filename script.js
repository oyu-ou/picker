document.addEventListener("DOMContentLoaded", () => {
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

  const totalSlices = 11;
  let rotation = 0;

  // -----------------------------
  // DRAG STATE
  // -----------------------------
  let isDragging = false;
  let startAngle = 0;
  let lastAngle = 0;
  let velocity = 0;
  let lastTime = 0;

  // -----------------------------
  // CREATE WHEEL
  // -----------------------------
  function generateWheel() {
    const sliceAngle = 360 / totalSlices;
    const options = optionInputs.map(
      (inp, i) => inp.value.trim() || ["yes", "no", "maybe"][i]
    );

    wheel.innerHTML = "";

    for (let i = 0; i < totalSlices; i++) {
      const slice = document.createElement("div");
      slice.className = "slice";
      slice.style.transform = `rotate(${i * sliceAngle}deg)`;

      if (toggleText.checked) {
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
  toggleText.addEventListener("change", generateWheel);
  optionInputs.forEach(inp =>
    inp.addEventListener("input", generateWheel)
  );

  // Allow Enter key to toggle checkboxes when focused
  const checkboxes = document.querySelectorAll(".label-container input[type='checkbox']");
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  // -----------------------------
  // ANGLE HELPER
  // -----------------------------
  function getAngle(e) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
  }

  // -----------------------------
  // MOUSE DRAG
  // -----------------------------
  wheel.addEventListener("mousedown", e => {
    isDragging = true;
    wheel.style.transition = "none";
    startAngle = getAngle(e) - rotation;
    lastAngle = rotation;
    lastTime = Date.now();
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const angle = getAngle(e) - startAngle;
    const now = Date.now();

    velocity = (angle - lastAngle) / (now - lastTime);
    rotation = angle;

    wheel.style.transform = `rotate(${rotation}deg)`;
    lastAngle = angle;
    lastTime = now;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;

    rotation += velocity * 600;
    wheel.style.transition = "transform 2s cubic-bezier(0.33,1,0.68,1)";
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(selectByVisualHit, 2000);
  });

  // -----------------------------
  // BUTTON SPIN
  // -----------------------------
  spinBtn.addEventListener("click", () => {
    spinBtn.disabled = true;

    rotation += Math.random() * 360 + 360 * 6;
    wheel.style.transition = "transform 4s ease-out";
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(selectByVisualHit, 4100);
  });

  // -----------------------------
  // VISUAL SLICE SELECTION
  // -----------------------------
  function selectByVisualHit() {
    document.querySelectorAll(".slice").forEach(s =>
      s.classList.remove("selected")
    );

    const rect = wheel.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height * 0.18;

    const hit = document.elementFromPoint(x, y);
    const slice = hit?.closest(".slice");

    if (!slice) {
      spinBtn.disabled = false;
      return;
    }

    slice.classList.add("selected");

    const slices = Array.from(document.querySelectorAll(".slice"));
    const index = slices.indexOf(slice);

    const options = optionInputs.map(
      (inp, i) => inp.value.trim() || ["Yes", "No", "Maybe"][i]
    );

    resultText.textContent = `Result: ${options[index % 3]}`;
    overlay.style.display = "flex";
    spinBtn.disabled = false;
  }

  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // Allow Enter key globally - click spinBtn or closeBtn depending on overlay state
  // But NOT when checkbox is focused
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const checkboxes = document.querySelectorAll(".label-container input[type='checkbox']");
      let isCheckboxFocused = false;
      
      for (let checkbox of checkboxes) {
        if (document.activeElement === checkbox) {
          isCheckboxFocused = true;
          break;
        }
      }
      
      // Only spin/close if no checkbox is focused
      if (!isCheckboxFocused) {
        if (overlay.style.display === "flex") {
          closeBtn.click();
        } else {
          spinBtn.click();
        }
      }
    }
  });
});
