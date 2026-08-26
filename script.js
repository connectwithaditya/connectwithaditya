/* =========================================================
   ADITYA SHARMA — PORTFOLIO V2
   Interaction / Animation / UX
========================================================= */


/* =========================================================
   DOM
========================================================= */

const body = document.body;

const cursor = document.querySelector(".cursor");
const cursorFollower = document.querySelector(".cursor-follower");

const navbar = document.querySelector(".navbar");

const backTop = document.querySelector(".back-top");

const revealElements =
    document.querySelectorAll("[data-reveal]");

const counters =
    document.querySelectorAll(".counter");

const magneticElements =
    document.querySelectorAll(".magnetic");

const yearElement =
    document.querySelector("#year");


/* =========================================================
   YEAR
========================================================= */

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}


/* =========================================================
   CUSTOM CURSOR
========================================================= */

let mouseX = 0;
let mouseY = 0;

let followerX = 0;
let followerY = 0;


if (
    window.innerWidth > 650 &&
    cursor &&
    cursorFollower
) {

    window.addEventListener(
        "mousemove",
        (event) => {

            mouseX = event.clientX;
            mouseY = event.clientY;

            cursor.style.left =
                `${mouseX}px`;

            cursor.style.top =
                `${mouseY}px`;

        }
    );


    function animateFollower() {

        followerX +=
            (mouseX - followerX) * 0.12;

        followerY +=
            (mouseY - followerY) * 0.12;

        cursorFollower.style.left =
            `${followerX}px`;

        cursorFollower.style.top =
            `${followerY}px`;

        requestAnimationFrame(
            animateFollower
        );

    }

    animateFollower();


    const hoverTargets =
        document.querySelectorAll(
            "a, button, .tools-cloud span, .language-card"
        );


    hoverTargets.forEach((element) => {

        element.addEventListener(
            "mouseenter",
            () => {

                cursorFollower.style.width =
                    "65px";

                cursorFollower.style.height =
                    "65px";

                cursorFollower.style.background =
                    "rgba(215,255,69,.06)";

            }
        );


        element.addEventListener(
            "mouseleave",
            () => {

                cursorFollower.style.width =
                    "38px";

                cursorFollower.style.height =
                    "38px";

                cursorFollower.style.background =
                    "transparent";

            }
        );

    });

}


/* =========================================================
   NAVBAR
========================================================= */

function handleNavbar() {

    if (!navbar) return;

    if (window.scrollY > 50) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

}


window.addEventListener(
    "scroll",
    handleNavbar
);

handleNavbar();


/* =========================================================
   BACK TO TOP
========================================================= */

function handleBackTop() {

    if (!backTop) return;

    if (window.scrollY > 700) {

        backTop.classList.add("visible");

    } else {

        backTop.classList.remove("visible");

    }

}


window.addEventListener(
    "scroll",
    handleBackTop
);


if (backTop) {

    backTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealObserver =
    new IntersectionObserver(
        (entries, observer) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add(
                    "revealed"
                );

                observer.unobserve(
                    entry.target
                );

            });

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach(
    (element) => {

        revealObserver.observe(
            element
        );

    }
);


/* =========================================================
   COUNTERS
========================================================= */

function animateCounter(element) {

    const target =
        Number(
            element.dataset.target
        );

    if (!target) return;

    let current = 0;

    const duration = 1600;

    const startTime =
        performance.now();


    function updateCounter(time) {

        const progress =
            Math.min(
                (time - startTime) /
                duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                4
            );


        current =
            Math.floor(
                eased * target
            );


        element.textContent =
            current;


        if (progress < 1) {

            requestAnimationFrame(
                updateCounter
            );

        } else {

            element.textContent =
                target;

        }

    }


    requestAnimationFrame(
        updateCounter
    );

}


const counterObserver =
    new IntersectionObserver(
        (entries, observer) => {

            entries.forEach(
                (entry) => {

                    if (
                        !entry.isIntersecting
                    ) {
                        return;
                    }

                    animateCounter(
                        entry.target
                    );

                    observer.unobserve(
                        entry.target
                    );

                }
            );

        },
        {
            threshold: .6
        }
    );


counters.forEach(
    (counter) => {

        counterObserver.observe(
            counter
        );

    }
);


/* =========================================================
   MAGNETIC BUTTONS
========================================================= */

if (window.innerWidth > 800) {

    magneticElements.forEach(
        (element) => {

            element.addEventListener(
                "mousemove",
                (event) => {

                    const rect =
                        element.getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left -
                        rect.width / 2;


                    const y =
                        event.clientY -
                        rect.top -
                        rect.height / 2;


                    element.style.transform =
                        `translate(${x * .12}px, ${y * .12}px)`;

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    element.style.transform =
                        "translate(0, 0)";

                }
            );

        }
    );

}


/* =========================================================
   SMOOTH ANCHOR SCROLL
========================================================= */

document
    .querySelectorAll(
        'a[href^="#"]'
    )
    .forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const targetId =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (!target) return;


                event.preventDefault();


                const offset = 80;


                const targetPosition =
                    target.getBoundingClientRect()
                        .top
                    +
                    window.scrollY
                    -
                    offset;


                window.scrollTo({

                    top: targetPosition,

                    behavior: "smooth"

                });

            }
        );

    });


/* =========================================================
   EXPERIENCE CARD PARALLAX
========================================================= */

const experienceCards =
    document.querySelectorAll(
        ".experience-card"
    );


window.addEventListener(
    "scroll",
    () => {

        experienceCards.forEach(
            (card) => {

                const rect =
                    card.getBoundingClientRect();


                const viewportHeight =
                    window.innerHeight;


                if (
                    rect.top <
                    viewportHeight &&
                    rect.bottom > 0
                ) {

                    const center =
                        rect.top +
                        rect.height / 2;


                    const distance =
                        center -
                        viewportHeight / 2;


                    const movement =
                        distance * -.015;


                    card.style.setProperty(
                        "--card-offset",
                        `${movement}px`
                    );

                }

            }
        );

    },
    {
        passive: true
    }
);


/* =========================================================
   TOOLS HOVER
========================================================= */

const toolItems =
    document.querySelectorAll(
        ".tools-cloud span"
    );


toolItems.forEach(
    (tool) => {

        tool.addEventListener(
            "mouseenter",
            () => {

                tool.style.transform =
                    "translateY(-4px)";

            }
        );


        tool.addEventListener(
            "mouseleave",
            () => {

                tool.style.transform =
                    "translateY(0)";

            }
        );

    }
);


/* =========================================================
   RANDOM MICRO DELAYS
========================================================= */

revealElements.forEach(
    (element, index) => {

        const delay =
            (index % 5) * 70;

        element.style.transitionDelay =
            `${delay}ms`;

    }
);


/* =========================================================
   KEYBOARD ACCESSIBILITY
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            document
                .activeElement
                ?.blur();

        }

    }
);


/* =========================================================
   REDUCED MOTION
========================================================= */

const reducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );


if (reducedMotion.matches) {

    document.documentElement.style
        .scrollBehavior = "auto";


    revealElements.forEach(
        (element) => {

            element.style.transition =
                "none";

            element.classList.add(
                "revealed"
            );

        }
    );

}


/* =========================================================
   CONSOLE BRANDING
========================================================= */

console.log(
`
%c ADITYA SHARMA
%c SEO EXECUTIVE

Organic growth through
ethical and data-driven SEO.

`,
"font-size:20px;font-weight:bold;color:#d7ff45;",
"font-size:12px;color:#eeeede;"
);