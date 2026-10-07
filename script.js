(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Loader ---------- */
  window.addEventListener("load", function () {
    var l = document.getElementById("loader");
    if (l) setTimeout(function () { l.classList.add("hide"); }, 500);
  });

  /* ---------- Mobile menu ---------- */
  var btn = document.getElementById("menu-button");
  var menu = document.getElementById("nav-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll reveal + counters ---------- */
  function countUp(el) {
    var end = +el.dataset.count, suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = end + suffix; return; }
    var start = performance.now(), dur = 1200;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(countUp);
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(function (el) { revealIO.observe(el); });

  /* ---------- Active nav link ---------- */
  var links = document.querySelectorAll(".nav-link");
  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) {
        l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(function (s) { navIO.observe(s); });

  /* ---------- 3D card tilt (mouse devices only) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + x * 9 + "deg) rotateX(" + -y * 9 + "deg) translateZ(6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Three.js background (lazy, desktop only, pauses when hidden) ---------- */
  var canvas = document.getElementById("three-canvas");
  if (canvas && !reduce && window.innerWidth >= 800) {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = function () { initThree(canvas); };
    document.body.appendChild(s);
  }

  function initThree(canvas) {
    if (typeof THREE === "undefined") return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 8;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);

    // Particles
    var N = 1200, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var r = 10 + Math.random() * 25, t = Math.random() * Math.PI * 2, p = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p);
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var particles = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0x00e5ff, size: 0.035, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    }));
    scene.add(particles);

    // Structure
    var group = new THREE.Group();
    scene.add(group);
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 2),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.18 }));
    var inner = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x7c4dff, transparent: true, opacity: 0.3 }));
    group.add(core, inner);

    function ring(rad, color, rx, ry) {
      var m = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.015, 12, 90),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4 }));
      m.rotation.set(rx, ry, 0);
      group.add(m);
      return m;
    }
    var r1 = ring(2.2, 0x00e5ff, 0.7, 0.3), r2 = ring(2.7, 0x7c4dff, 1.3, 0.5), r3 = ring(3.1, 0x00e5ff, 0.2, 1);

    // Mouse parallax + scroll drift
    var mx = 0, my = 0, tx = 0, ty = 0;
    addEventListener("pointermove", function (e) {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    });

    var clock = new THREE.Clock(), running = true, raf;
    function animate() {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      particles.rotation.y = t * 0.015;
      particles.rotation.x = t * 0.006;
      core.rotation.x = t * 0.15; core.rotation.y = t * 0.25;
      inner.rotation.y = -t * 0.2;
      r1.rotation.z = t * 0.25; r2.rotation.z = -t * 0.18; r3.rotation.z = t * 0.12;
      mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
      group.position.x = mx * 0.4 + 2.2;                       // sits right of centre
      group.position.y = -my * 0.3 - scrollY * 0.0008;         // drifts with scroll
      renderer.render(scene, camera);
    }
    animate();

    // Pause when tab is hidden
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { clock.getDelta(); animate(); } else cancelAnimationFrame(raf);
    });

    addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  }

  /* ---------- Disable links to files that return 404 ---------- */
  document.querySelectorAll("[data-check]").forEach(function (el) {
    var url = el.getAttribute("href") || el.dataset.file;
    if (!url) return;
    fetch(url, { method: "HEAD" }).then(function (r) {
      if (r.status !== 404) return;
      el.classList.add("is-missing");
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.tabIndex = -1;
      el.innerHTML = 'Coming soon <i class="fa-regular fa-clock"></i>';
    }).catch(function () { /* offline or file:// preview: leave as is */ });
  });

  /* ---------- Password-gated downloads ----------
     NOTE: this is a client-side gate. It deters casual access only; anyone can
     read the hash and file URL from the source. Don't put truly confidential
     files in a public repo. Generate a new hash in your browser console:
       crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOUR_PASSWORD"))
         .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("")))
  */
  var PASSWORD_HASH = "748ab406e1ae94b69f6abc487b635c9e3290d778859cdca92811cc31a743e26e";

  var overlay = document.getElementById("pw-overlay");
  var box = document.getElementById("pw-box");
  var input = document.getElementById("pw-input");
  var errorEl = document.getElementById("pw-error");
  var eye = document.getElementById("pw-eye");
  var title = document.getElementById("pw-title");
  var file = "", lastFocus = null;

  function sha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function openModal(f, t) {
    file = f; lastFocus = document.activeElement;
    title.textContent = t ? t + " (protected)" : "Protected file";
    input.value = ""; input.type = "password"; errorEl.textContent = "";
    eye.innerHTML = '<i class="fa-solid fa-eye"></i>';
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(function () { input.focus(); }, 50);
  }
  function closeModal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  }
  function submit() {
    if (!input.value) { errorEl.textContent = "Please enter the password."; return; }
    if (!window.crypto || !crypto.subtle) {
      errorEl.textContent = "This browser can't verify passwords here. Use the request link below.";
      return;
    }
    sha256(input.value).then(function (h) {
      if (h === PASSWORD_HASH) {
        var a = document.createElement("a");
        a.href = file; a.download = "";
        document.body.appendChild(a); a.click(); a.remove();
        closeModal();
      } else {
        errorEl.textContent = "Incorrect password. Try again.";
        box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
        input.select();
      }
    });
  }

  document.querySelectorAll(".lock-btn").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.dataset.file, b.dataset.title); });
  });
  document.getElementById("pw-submit").addEventListener("click", submit);
  document.getElementById("pw-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
  eye.addEventListener("click", function () {
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    eye.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });
})();
