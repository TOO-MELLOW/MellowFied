// ================================
// Particle Canvas Animation
// ================================
const canvas = document.getElementById('particleCanvas');
if(canvas){
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    const numberOfParticles = 80;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if(this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if(this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }

        draw() {
            ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles(){
        particlesArray = [];
        for(let i=0;i<numberOfParticles;i++){
            particlesArray.push(new Particle());
        }
    }

    function connectParticles(){
        for(let a=0;a<particlesArray.length;a++){
            for(let b=a+1;b<particlesArray.length;b++){
                const dx = particlesArray[a].x - particlesArray[b].x;
                const dy = particlesArray[a].y - particlesArray[b].y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if(distance < 150){
                    const opacity = 0.2 - (distance/150)*0.2;
                    ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particlesArray.forEach(p => {p.update(); p.draw();});
        connectParticles();
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    window.addEventListener('resize', ()=>{
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });
}

// ================================
// Mobile Menu Toggle & Nav Links
// ================================
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
if(menuToggle && navMenu){
    menuToggle.addEventListener('click', ()=>{
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link=>{
        link.addEventListener('click', ()=>{
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ================================
// Smooth Scrolling
// ================================
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
    anchor.addEventListener('click', function(e){
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target){
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({top: offsetTop, behavior:'smooth'});
        }
    });
});

// ================================
// Navbar Scroll Effect
// ================================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', ()=>{
    if(navbar){
        if(window.pageYOffset > 100) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
});

// ================================
// Scroll to Top Button
// ================================
const scrollTopBtn = document.getElementById('scrollTop');
if(scrollTopBtn){
    window.addEventListener('scroll', ()=>{
        if(window.pageYOffset > 500) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    });

    scrollTopBtn.addEventListener('click', ()=>{
        window.scrollTo({top:0, behavior:'smooth'});
    });
}

// ================================
// Animated Counter & Intersection Observer
// ================================
function animateCounter(el){
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const increment = target/(duration/16);
    let current=0;
    const timer = setInterval(()=>{
        current += increment;
        if(current >= target){
            el.textContent = target + (target===99?'%':'+');
            clearInterval(timer);
        } else el.textContent = Math.floor(current) + (target===99?'%':'+');
    },16);
}

const observerOptions = {threshold:0.2, rootMargin:'0px 0px -100px 0px'};
const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.style.opacity='1';
            entry.target.style.transform='translateY(0)';
            if(entry.target.classList.contains('stat-number')) animateCounter(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card=>{
    card.style.opacity='0';
    card.style.transform='translateY(30px)';
    card.style.transition='opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

document.querySelectorAll('.stat-number').forEach(stat=>observer.observe(stat));
document.querySelectorAll('.feature-item').forEach(item=>{
    item.style.opacity='0';
    item.style.transform='translateY(20px)';
    item.style.transition='opacity 0.5s ease, transform 0.5s ease';
    observer.observe(item);
});

// ================================
// 3D Tilt Effect on Service Cards
// ================================
document.querySelectorAll('.service-card[data-tilt]').forEach(card=>{
    card.addEventListener('mousemove',(e)=>{
        const rect=card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = (y - rect.height/2)/20;
        const rotateY = (rect.width/2 - x)/20;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    card.addEventListener('mouseleave',()=>{
        card.style.transform='perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// ================================
// WhatsApp Form Submission
// ================================
const sendBtn = document.getElementById("sendBtn");
if(sendBtn){
    sendBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        const nameEl = document.getElementById("userName");
        const emailEl = document.getElementById("userEmail");
        const serviceEl = document.getElementById("userService");
        const messageEl = document.getElementById("userMessage");

        if(!nameEl || !serviceEl){
            alert("Form inputs missing!");
            return;
        }

        const name = nameEl.value.trim();
        const email = emailEl ? emailEl.value.trim() : '';
        const service = serviceEl.value.trim();
        const messageText = messageEl ? messageEl.value.trim() : '';

        if(!name || !service){
            alert("Please enter your name and select a service.");
            return;
        }

        const phoneNumber = "27720465993";
        let message = `Hello, my name is ${name}.\n`;
        message += `I would like to request a quote for the following service:\n\n${service}\n\n`;
        if(messageText) message += `Additional message:\n${messageText}\n\n`;
        message += "Please get back to me when available. Thank you!";
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank");
    });
}

// ================================
// Parallax Effect on Hero Section
// ================================
window.addEventListener('scroll', ()=>{
    const scrolled = window.pageYOffset;
    document.querySelectorAll('.floating-card').forEach((el,index)=>{
        const speed = 0.5 + (index*0.1);
        el.style.transform = `translateY(${scrolled*speed}px)`;
    });
});

// ================================
// Page Load Animation
// ================================
window.addEventListener('load', ()=>{
    document.body.style.opacity='0';
    setTimeout(()=>{
        document.body.style.transition='opacity 0.5s ease';
        document.body.style.opacity='1';
    },100);
});

// ================================
// Cursor Trail Effect (Desktop Only)
// ================================
if(window.innerWidth > 768){
    let cursorTrail = [];
    const trailLength = 10;
    for(let i=0;i<trailLength;i++){
        const trail = document.createElement('div');
        trail.style.position='fixed';
        trail.style.width='6px';
        trail.style.height='6px';
        trail.style.borderRadius='50%';
        trail.style.background='rgba(102, 126, 234, 0.5)';
        trail.style.pointerEvents='none';
        trail.style.zIndex='9999';
        trail.style.transition='transform 0.1s ease';
        document.body.appendChild(trail);
        cursorTrail.push(trail);
    }

    let mouseX=0, mouseY=0;
    document.addEventListener('mousemove',(e)=>{mouseX=e.clientX; mouseY=e.clientY;});

    function animateCursorTrail(){
        let x=mouseX, y=mouseY;
        cursorTrail.forEach((trail,index)=>{
            trail.style.left = x-3+'px';
            trail.style.top = y-3+'px';
            trail.style.transform = `scale(${(trailLength-index)/trailLength})`;
            const nextTrail = cursorTrail[index+1] || cursorTrail[0];
            x += (parseFloat(nextTrail.style.left||mouseX)-x)*0.5;
            y += (parseFloat(nextTrail.style.top||mouseY)-y)*0.5;
        });
        requestAnimationFrame(animateCursorTrail);
    }
    animateCursorTrail();
}

// ================================
// Dynamic Year in Footer
// ================================
const footerYear = document.querySelector('.footer-bottom p');
if(footerYear) footerYear.textContent = `© ${new Date().getFullYear()} Mellow Tech Services. All rights reserved.`;

// ================================
// Lazy Loading Images
// ================================
if('IntersectionObserver' in window){
    const imageObserver = new IntersectionObserver((entries,observer)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img=>imageObserver.observe(img));
}

// ================================
// Console Easter Egg
// ================================
console.log('%c🚀 Mellow Tech Services','font-size:24px;font-weight:bold;color:#667eea;');
console.log('%cLooking for something? Contact us for custom development!','font-size:14px;color:#764ba2;');
console.log('%cWebsite by Mellow Tech - Premium Digital Solutions','font-size:12px;color:#888;');
