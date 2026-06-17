const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".site-nav a, .nav-cta, .footer-grid a")];
const sections = [...document.querySelectorAll("main section[id]")];
const heroCanvas = document.querySelector("[data-hero-canvas]");
const productDetails = {
  marketpulse: {
    title: "MarketPulse",
    text: "A mobile-first market intelligence dashboard focused on watchlists, price movement, trend signals, and clean AI-generated market summaries."
  },
  tippulse: {
    title: "TipPulse",
    text: "A practical tip management system for weekly tip records, employees, locations, manager visibility, and clean reporting."
  },
  caseworth: {
    title: "CaseWorth AI",
    text: "An educational case organization tool for accident details, injuries, treatment timelines, documents, lost wages, and AI case summaries."
  },
  future: {
    title: "Future Ventures",
    text: "A pipeline for new AI productivity tools, business automation systems, mobile products, consulting utilities, and web platforms."
  }
};

function initHeroCanvas() {
  if (!heroCanvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const context = heroCanvas.getContext("2d");
  const pointer = { x: 0, y: 0, active: false };
  const particles = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  function resizeCanvas() {
    const rect = heroCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    heroCanvas.width = Math.floor(width * pixelRatio);
    heroCanvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particleCount = Math.max(42, Math.min(92, Math.floor(width / 16)));
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: 1.2 + Math.random() * 1.8
      });
    }
  }

  function updatePointer(event) {
    const rect = heroCanvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    pointer.x = point.clientX - rect.left;
    pointer.y = point.clientY - rect.top;
    pointer.active = true;
  }

  function render() {
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;

    particles.forEach((particle) => {
      if (pointer.active) {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 160 && distance > 1) {
          particle.vx -= (dx / distance) * 0.006;
          particle.vy -= (dy / distance) * 0.006;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.992;
      particle.vy *= 0.992;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      particle.x = Math.max(0, Math.min(width, particle.x));
      particle.y = Math.max(0, Math.min(height, particle.y));
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 135) {
          context.strokeStyle = `rgba(34, 211, 238, ${0.18 * (1 - distance / 135)})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    particles.forEach((particle) => {
      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 18);
      glow.addColorStop(0, "rgba(34, 211, 238, .45)");
      glow.addColorStop(1, "rgba(34, 211, 238, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, 18, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(244, 185, 66, .72)";
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
    });

    animationFrame = requestAnimationFrame(render);
  }

  resizeCanvas();
  render();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  heroCanvas.addEventListener("mousemove", updatePointer, { passive: true });
  heroCanvas.addEventListener("touchmove", updatePointer, { passive: true });
  heroCanvas.addEventListener("mouseleave", () => { pointer.active = false; });

  window.addEventListener("pagehide", () => cancelAnimationFrame(animationFrame));
}

function setHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

toggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".site-nav a").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-42% 0px -52% 0px" });

sections.forEach((section) => navObserver.observe(section));
window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();
initHeroCanvas();

document.querySelectorAll("[data-product-card]").forEach((card) => {
  const selectCard = () => {
    const key = card.dataset.productCard;
    const detail = productDetails[key];
    const spotlight = document.querySelector("[data-product-spotlight]");

    document.querySelectorAll("[data-product-card]").forEach((item) => item.classList.remove("is-selected"));
    card.classList.add("is-selected");
    spotlight.querySelector("h3").textContent = detail.title;
    spotlight.querySelector("p").textContent = detail.text;
  };

  card.addEventListener("click", selectCard);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCard();
    }
  });
});

document.querySelectorAll("[data-service-card]").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll("[data-service-card]").forEach((item) => item.classList.remove("is-active"));
    card.classList.add("is-active");
    document.querySelector("[data-service-note]").textContent = card.dataset.serviceCard;
  });
});

document.querySelectorAll("[data-pipeline-step]").forEach((step) => {
  step.addEventListener("click", () => {
    document.querySelectorAll("[data-pipeline-step]").forEach((item) => item.classList.remove("is-active"));
    step.classList.add("is-active");
    document.querySelector("[data-pipeline-note]").textContent = step.dataset.pipelineStep;
  });
});

document.querySelector("[data-contact-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const note = form.querySelector("[data-form-note]");
  const draft = form.querySelector("[data-email-draft]");
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const company = String(data.get("company") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !email || !message) {
    note.textContent = "Please complete your name, email, and message.";
    note.classList.remove("success");
    draft.classList.remove("is-visible");
    return;
  }

  const subject = encodeURIComponent(`Website inquiry from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCompany: ${company || "Not provided"}\n\nMessage:\n${message}`);
  draft.href = `mailto:cisco@ortizventureholdings.com?subject=${subject}&body=${body}`;
  draft.classList.add("is-visible");
  note.textContent = "Message ready. Open the email draft to send it from your mail app.";
  note.classList.add("success");
  form.reset();
});
