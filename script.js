const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
let ringX = mouseX, ringY = mouseY;

window.addEventListener("pointermove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = `${mouseX}px`;
  dot.style.top = `${mouseY}px`;
});

function animateCursor(){
  ringX += (mouseX - ringX) * 0.16;
  ringY += (mouseY - ringY) * 0.16;
  ring.style.left = `${ringX}px`;
  ring.style.top = `${ringY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll(".magnetic").forEach(el => {
  el.addEventListener("pointerenter", () => ring.classList.add("hover"));
  el.addEventListener("pointerleave", () => {
    ring.classList.remove("hover");
    el.style.transform = "";
  });
  el.addEventListener("pointermove", e => {
    if (matchMedia("(hover:hover)").matches) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.16;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.16;
      el.style.transform = `translate(${x}px, ${y}px)`;
    }
  });
});

// Reveal sections and project rows as they enter the viewport.
const revealTargets = document.querySelectorAll(".project, .lab-item, .about-grid, .manifesto-line, .contact-wrap");
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});

revealTargets.forEach(el => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// Tiny parallax on the hero orbit.
const orbit = document.querySelector(".hero-orbit");
window.addEventListener("pointermove", e => {
  if (!orbit || !matchMedia("(hover:hover)").matches) return;
  const x = (e.clientX / innerWidth - .5) * 18;
  const y = (e.clientY / innerHeight - .5) * 18;
  orbit.style.transform = `translate(${x}px, ${y}px)`;
});
