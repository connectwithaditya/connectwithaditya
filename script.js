/* =========================================
   LOADER
========================================= */
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (!loader) return;
    setTimeout(() => loader.classList.add("hide"), 700);
});


/* =========================================
   MOBILE MENU
========================================= */
const menuButton = document.getElementById("menu-button");
const navMenu = document.getElementById("nav-menu");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => navMenu.classList.toggle("open"));
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => navMenu.classList.remove("open"));
    });
}


/* =========================================
   THREE.JS
========================================= */
const canvas = document.getElementById("three-canvas");

if (!canvas) {
    console.warn("ERROR: #three-canvas was not found.");
} else if (typeof THREE === "undefined") {
    console.warn("ERROR: Three.js library was not loaded.");
} else {

    console.log("[3D] draggable structure script v2 loaded");

    /* ---------- Scene / Camera / Renderer ---------- */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        60, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);


    /* ---------- Particles ---------- */
    const particleCount = 1600;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const radius = 10 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
            color: 0x00e5ff,
            size: 0.035,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(particles);


    /* ---------- Draggable structure group ---------- */
    const structureGroup = new THREE.Group();
    scene.add(structureGroup);

    // Wireframe globe
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.8, 3),
        new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.18
        })
    );
    structureGroup.add(core);

    // Inner purple sphere
    const innerCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x7c4dff,
            transparent: true,
            opacity: 0.3
        })
    );
    structureGroup.add(innerCore);

    // Rings
    function createRing(radius, color, rotationX, rotationY) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.015, 16, 100),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4
            })
        );
        ring.rotation.x = rotationX;
        ring.rotation.y = rotationY;
        structureGroup.add(ring);
        return ring;
    }

    const ringOne   = createRing(2.2, 0x00e5ff, 0.7, 0.3);
    const ringTwo   = createRing(2.7, 0x7c4dff, 1.3, 0.5);
    const ringThree = createRing(3.1, 0x00e5ff, 0.2, 1);

    /*
       Invisible hit sphere used ONLY for raycasting.
       visible = false -> never rendered, but the raycaster
       can still hit it, so the thin wireframe is easy to grab.
    */
    const dragHitArea = new THREE.Mesh(
        new THREE.SphereGeometry(3.1, 24, 24),
        new THREE.MeshBasicMaterial()
    );
    dragHitArea.visible = false;
    structureGroup.add(dragHitArea);


    /* ---------- Mouse parallax ---------- */
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

    window.addEventListener("mousemove", event => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 2;
        targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    });


    /* =========================================
       DRAG SYSTEM
       - Position is kept ONLY in memory.
       - No localStorage / sessionStorage, so a page
         refresh always resets to the original spot.
    ========================================= */
    let isDragging = false;
    let dragMoved = false;
    let pointerStartX = 0, pointerStartY = 0;
    let structureStartX = 0, structureStartY = 0;
    let structureX = 0, structureY = 0;

    const INTERACTIVE = "a, button, input, textarea, select, label, nav, header";

    function isInteractive(target) {
        return !!(target && target.closest && target.closest(INTERACTIVE));
    }

    // How many screen pixels equal 1 world unit at the structure's depth (z = 0)
    function pxPerUnit() {
        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        return (window.innerHeight / 2) / halfH;
    }

    // Simple screen-space hit test: is the pointer inside the structure's circle?
    function isPointerOverStructure(clientX, clientY) {
        const ppu = pxPerUnit();
        const sx = window.innerWidth / 2 + structureGroup.position.x * ppu;
        const sy = window.innerHeight / 2 - structureGroup.position.y * ppu;
        return Math.hypot(clientX - sx, clientY - sy) <= 3.1 * ppu;
    }

    // Keep the structure's centre inside the visible screen
    function getBounds() {
        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        return { x: halfH * camera.aspect, y: halfH };
    }

    function beginDrag(clientX, clientY) {
        pointerStartX = clientX;
        pointerStartY = clientY;
        structureStartX = structureX;
        structureStartY = structureY;
        isDragging = true;
        dragMoved = false;
        return true;
    }

    function moveDrag(clientX, clientY) {
        if (!isDragging) return;

        const dx = clientX - pointerStartX;
        const dy = clientY - pointerStartY;

        if (!dragMoved) {
            if (Math.hypot(dx, dy) < 4) return;
            dragMoved = true;
            document.body.classList.add("dragging-3d");
            const sel = window.getSelection && window.getSelection();
            if (sel) sel.removeAllRanges();
        }

        const ppu = pxPerUnit();
        const bounds = getBounds();

        structureX = THREE.MathUtils.clamp(structureStartX + dx / ppu, -bounds.x, bounds.x);
        structureY = THREE.MathUtils.clamp(structureStartY - dy / ppu, -bounds.y, bounds.y);
    }

    function endDrag() {
        isDragging = false;
        dragMoved = false;
        document.body.classList.remove("dragging-3d");
    }

    // Stop the browser's own text-selection / drag-and-drop from cancelling our drag
    document.addEventListener("dragstart", e => { if (isDragging) e.preventDefault(); });
    document.addEventListener("selectstart", e => { if (dragMoved) e.preventDefault(); });


    /* ---------- Mouse / pen (pointer events) ---------- */
    window.addEventListener("pointerdown", event => {
        if (event.pointerType === "touch") return;      // touch handled below
        if (event.button !== 0) return;
        if (isInteractive(event.target)) return;
        if (!isPointerOverStructure(event.clientX, event.clientY)) return;
        beginDrag(event.clientX, event.clientY);
    }, true);

    window.addEventListener("pointermove", event => {
        if (event.pointerType === "touch") return;

        if (isDragging) {
            moveDrag(event.clientX, event.clientY);
            return;
        }

        // Hover cursor
        const over =
            !isInteractive(event.target) &&
            isPointerOverStructure(event.clientX, event.clientY);
        document.body.classList.toggle("can-drag-3d", over);
    }, true);

    window.addEventListener("pointerup", event => {
        if (event.pointerType !== "touch") endDrag();
    }, true);

    window.addEventListener("pointercancel", event => {
        if (event.pointerType !== "touch") endDrag();
    }, true);

    window.addEventListener("blur", endDrag);


    /* ---------- Touch: long-press (~0.3s) on the structure, then drag ----------
       A quick swipe still scrolls the page normally.                         */
    let touchTimer = null;
    let touchPending = null;

    function clearTouchTimer() {
        clearTimeout(touchTimer);
        touchTimer = null;
        touchPending = null;
    }

    window.addEventListener("touchstart", event => {
        clearTouchTimer();
        if (event.touches.length !== 1) return;

        const t = event.touches[0];
        if (isInteractive(event.target)) return;
        if (!isPointerOverStructure(t.clientX, t.clientY)) return;

        touchPending = { x: t.clientX, y: t.clientY };

        touchTimer = setTimeout(() => {
            if (!touchPending) return;
            if (beginDrag(touchPending.x, touchPending.y)) {
                document.body.classList.add("dragging-3d");
                dragMoved = true;
                if (navigator.vibrate) navigator.vibrate(12);
            }
            touchPending = null;
        }, 300);
    }, { passive: true });

    window.addEventListener("touchmove", event => {
        const t = event.touches[0];
        if (!t) return;

        if (isDragging) {
            if (event.cancelable) event.preventDefault();   // stop page scroll
            moveDrag(t.clientX, t.clientY);
            return;
        }

        // Finger moved before long-press fired -> user is scrolling
        if (touchPending &&
            Math.hypot(t.clientX - touchPending.x, t.clientY - touchPending.y) > 8) {
            clearTouchTimer();
        }
    }, { passive: false });

    window.addEventListener("touchend", () => { clearTouchTimer(); endDrag(); }, { passive: true });
    window.addEventListener("touchcancel", () => { clearTouchTimer(); endDrag(); }, { passive: true });

    // Block the long-press context menu while dragging
    window.addEventListener("contextmenu", event => {
        if (isDragging || touchPending) event.preventDefault();
    });


    /* ---------- Cursor styles ---------- */
    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = `
        body.can-drag-3d { cursor: grab; }
        body.dragging-3d {
            cursor: grabbing !important;
            user-select: none;
            -webkit-user-select: none;
        }
        body.dragging-3d * { cursor: grabbing !important; }
    `;
    document.head.appendChild(cursorStyle);


    /* ---------- Animation ---------- */
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        particles.rotation.y = time * 0.015;
        particles.rotation.x = time * 0.006;

        core.rotation.x = time * 0.15;
        core.rotation.y = time * 0.25;

        innerCore.rotation.y = -time * 0.2;

        ringOne.rotation.z = time * 0.25;
        ringTwo.rotation.z = -time * 0.18;
        ringThree.rotation.z = time * 0.12;

        mouseX += (targetX - mouseX) * 0.025;
        mouseY += (targetY - mouseY) * 0.025;

        const parallaxAmount = isDragging ? 0.1 : 1;

        structureGroup.position.x = structureX + mouseX * 0.25 * parallaxAmount;
        structureGroup.position.y = structureY - mouseY * 0.20 * parallaxAmount;

        renderer.render(scene, camera);
    }

    animate();


    /* ---------- Resize ---------- */
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Re-clamp so the structure never ends up off-screen after a resize
        const bounds = getBounds();
        structureX = THREE.MathUtils.clamp(structureX, -bounds.x, bounds.x);
        structureY = THREE.MathUtils.clamp(structureY, -bounds.y, bounds.y);
    });
}


/* =========================================
   ACTIVE NAVIGATION
========================================= */
const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 180) {
            current = section.id;
        }
    });

    links.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });
});
