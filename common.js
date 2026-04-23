/* ═══════════════════════════════════════════════════
   MELLOW TECH SERVICES — SHARED JAVASCRIPT
   common.js — loaded on every page
════════════════════════════════════════════════════ */

/* ── Nav scroll / hide ────────────────────────────── */
(function(){
  var lastScroll = 0;
  var navbar = document.getElementById('navbar');
  if(!navbar) return;
  window.addEventListener('scroll', function(){
    var cur = window.scrollY;
    navbar.classList.toggle('scrolled', cur > 40);
    navbar.style.transform = (cur > lastScroll && cur > 100) ? 'translateY(-100%)' : 'translateY(0)';
    lastScroll = cur;
  }, {passive:true});
})();

/* ── Mobile menu ──────────────────────────────────── */
(function(){
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  if(!hamburger || !mobileMenu) return;
  var menuOpen = false;
  hamburger.addEventListener('click', function(){
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    var spans = hamburger.querySelectorAll('span');
    if(menuOpen){
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      menuOpen = false;
      mobileMenu.classList.remove('open');
      var spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
})();

/* ── Scroll reveal ────────────────────────────────── */
(function(){
  function triggerReveals(){
    document.querySelectorAll('.reveal').forEach(function(el, i){
      if(el.getBoundingClientRect().top < window.innerHeight - 80){
        setTimeout(function(){ el.classList.add('visible'); }, i * 80);
      }
    });
  }
  window.addEventListener('scroll', triggerReveals, {passive:true});
  window.addEventListener('load', function(){ setTimeout(triggerReveals, 100); });
  triggerReveals();
})();

/* ── Audience tabs ────────────────────────────────── */
window.switchTab = function(id, e){
  document.querySelectorAll('.audience-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.audience-content').forEach(function(c){ c.classList.remove('active'); });
  e.target.classList.add('active');
  var el = document.getElementById('tab-' + id);
  if(el) el.classList.add('active');
};

;(function (root) {
  "use strict";

  // ===========================================================================
  //  MODULE 1 — NLP PIPELINE
  // ===========================================================================

  const NLP = (() => {

    /**
     * Synonym / abbreviation / slang expansion table.
     * Covers SMS language, Afrikaans terms, common misspellings, SA context.
     * Sorted by length at runtime so longer phrases match before substrings.
     */
    const RAW_EXPANSIONS = {
      // SA greetings
      "howzit":"hello","haai":"hello","hie":"hello","heita":"hello",
      "sawubona":"hello","dumela":"hello","hola":"hello",
      // Afrikaans / Zulu affirmations
      "ja":"yes","yebo":"yes","nee":"no","aikona":"no",
      // SMS / text contractions
      "wont":"will not","dont":"do not","cant":"cannot","im":"i am",
      "ive":"i have","theres":"there is","whats":"what is","hows":"how is",
      "ur":"your","u":"you","r":"are","b":"be","2":"to",
      "pls":"please","plz":"please","asap":"urgent now","rn":"right now",
      "btw":"by the way","fyi":"for your information","tbh":"to be honest",
      // Service slang
      "reinstall":"install windows","reformat":"format windows",
      "wipe pc":"format windows","wipe laptop":"format windows",
      "os":"operating system windows",
      "bsod":"blue screen crash windows error",
      "lagging":"slow performance","lag":"slow",
      "lekker":"good","bra":"friend","sisi":"friend",
      "spaza":"small business","hustle":"business",
      "smme":"small business","sme":"small business",
      // CV synonyms
      "curriculum vitae":"cv","resume":"cv",
      "job application cv":"cv job","cover letter":"cv job",
      // Assignment synonyms
      "prac":"practical assignment","tut":"tutorial assignment",
      "due":"deadline assignment",
      "referencing":"citation formatting reference",
      "unisa":"university assignment",
      // Payment
      "eft":"bank transfer payment","rands":"price cost","rand":"price cost",
      // Misspellings — services
      "windos":"windows","widows":"windows","winows":"windows",
      "ofice":"office","excell":"excel","powerponit":"powerpoint",
      "troubeshoot":"troubleshoot","virius":"virus","viruse":"virus",
      "websit":"website","web site":"website","sight":"website site",
      "grafic":"graphic","desing":"design","dessign":"design",
      "buisness":"business","bussiness":"business","bizness":"business",
      "develoment":"development","devlopment":"development",
    };

    // Sort by length descending so multi-word phrases match before substrings
    const EXPANSIONS = Object.entries(RAW_EXPANSIONS)
      .sort(([a],[b]) => b.length - a.length);

    function normalize(text) {
      let t = text.toLowerCase()
        .replace(/[''`]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      for (const [term, expansion] of EXPANSIONS) {
        if (t.includes(term)) {
          t = t.split(term).join(expansion);
        }
      }
      return t;
    }

    function tokenize(text) {
      return normalize(text)
        .split(" ")
        .filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    const STOPWORDS = new Set([
      "a","an","the","and","or","but","in","on","at","to","for",
      "of","with","is","it","this","that","my","i","me","we","you",
      "do","can","will","be","am","are","was","were","have","has","had",
      "just","also","so","if","how","what","when","where","which","who",
    ]);

    // Sentiment: -1 frustrated · 0 neutral · 1 positive
    const NEG = ["not working","broken","useless","frustrated","angry","terrible",
      "rubbish","hate","nothing works","waste","worst","problem","issue","failed",
      "doesn't work","wasted","annoyed","sick of","fed up"];
    const POS = ["thanks","thank you","great","awesome","perfect","love",
      "excellent","amazing","fantastic","helpful","wonderful","appreciate","brilliant"];

    function sentiment(raw) {
      const t = raw.toLowerCase();
      const neg = NEG.filter(s => t.includes(s)).length;
      const pos = POS.filter(s => t.includes(s)).length;
      return neg > pos ? -1 : pos > neg ? 1 : 0;
    }

    // Extract deadline entities
    const DEADLINE_RE = [
      { re: /\b(today|tonight|now|asap|urgent|immediately)\b/i,  label: "TODAY"    },
      { re: /\b(tomorrow)\b/i,                                   label: "TOMORROW" },
      { re: /\bin (\d+)\s*(hour|hours|hr|hrs)\b/i,               label: "HOURS"    },
      { re: /\bin (\d+)\s*(day|days)\b/i,                        label: "DAYS"     },
      { re: /\b(monday|tuesday|wednesday|thursday|friday)\b/i,   label: "WEEKDAY"  },
    ];

    function extractDeadline(text) {
      for (const { re, label } of DEADLINE_RE) {
        const m = text.match(re);
        if (m) return { match: m[0], urgency: label };
      }
      return null;
    }

    return { normalize, tokenize, sentiment, extractDeadline };
  })();


  // ===========================================================================
  //  MODULE 2 — KNOWLEDGE BASE
  //  Every service page + about page fully encoded as structured data.
  //  Signals = ranked keyword phrases (longer phrase = more specific = higher weight)
  // ===========================================================================

  const KB = {

    // ── ABOUT / COMPANY ────────────────────────────────────────────────────
    about: {
      signals: [
        "about mellow tech","about your company","who are you","what is mellow tech",
        "tell me about","company background","company history","how long have you been",
        "years in business","polokwane","limpopo","where are you based",
        "where are you located","do you come to me","do you travel","remote service",
        "online service","do you work online","can you help online","south africa",
      ],
      response: {
        text: "**Mellow Tech Services** — making technology simple, fast, and affordable for everyone in South Africa.",
        details: [
          "📍 **Based in Polokwane, Limpopo** — in-person and remote services nationwide",
          "🗓️ **6+ years** of hands-on tech experience",
          "👥 **100+ happy clients** with a 4.9★ average rating",
          "💯 **98% satisfaction rate** · 99% would recommend us",
          "👨‍💻 **Team:** Mellow T. (Founder & Lead Tech), Sipho K. (Systems), Nomvula M. (Design), Dineo L. (Web Dev)",
          "📱 **+27 720 465 993** · 📧 mellowtech@email.com",
        ],
        followUp: "What can we help you with today?",
        suggestions: ["🛠️ Our Services", "💰 Pricing", "📞 Contact Us", "⭐ Client Reviews"],
      }
    },

    // ── WINDOWS INSTALLATION ───────────────────────────────────────────────
    windows: {
      signals: [
        "install windows","reinstall windows","windows installation","clean install",
        "format my pc","format my laptop","fresh install","windows 10","windows 11",
        "activate windows","windows activation","windows license","expired license",
        "blue screen","bsod","blue screen error","pc won't boot","laptop won't start",
        "won't turn on","boot loop","no operating system","no os","new laptop setup",
        "second hand laptop","bought a laptop","corrupted windows","windows is broken",
        "windows not working","factory reset","os installation",
      ],
      response: {
        text: "**Windows Installation & Activation** — a clean, properly configured OS from scratch. No bloatware, no fake activation keys.",
        details: [
          "✅ Windows 10 or Windows 11 — your choice",
          "✅ All hardware drivers installed and verified",
          "✅ Genuine Windows activation (no popups, no expiry)",
          "✅ All critical security updates applied",
          "✅ Your personal files backed up **before** we touch anything",
          "✅ Full system test and handover walkthrough",
        ],
        scenarios: [
          "🔵 PC boots into blue screen loop → clean reinstall, fixed same day",
          "🔵 Second-hand laptop arrived with no OS → Windows 11 installed and activated in 2 hours",
          "🔵 Windows activation expired → proper activation sorted, no more nag screens",
        ],
        turnaround: "⏱ 2–4 hours (same day)",
        price: "💰 From R200 — exact quote before we start",
        followUp: "Is the PC crashing, unactivated, or does it need a fresh setup from scratch?",
        suggestions: ["💥 PC keeps crashing", "🔑 Need activation", "🆕 New / second-hand laptop", "💰 Get exact quote"],
      }
    },

    // ── MICROSOFT OFFICE ───────────────────────────────────────────────────
    office: {
      signals: [
        "microsoft office","install office","ms office","office setup",
        "word and excel","word excel powerpoint","outlook setup",
        "microsoft 365","office 365","install word","install excel",
        "install powerpoint","office activation","office not working",
        "office expired","can't open word","can't open excel",
      ],
      response: {
        text: "**Microsoft Office Installation** — full suite, properly activated, ready to use immediately.",
        details: [
          "✅ Word, Excel, PowerPoint, Outlook, OneNote and more",
          "✅ Genuine activation — no 30-day trials or blocked features",
          "✅ Works on your laptop or desktop (Windows)",
          "✅ **Remote installation available** — no need to come in",
        ],
        turnaround: "⏱ Under 1 hour — often done in a single session",
        price: "💰 From R100",
        followUp: "Are you in Polokwane (in-person) or would you prefer we do it remotely via screen share?",
        suggestions: ["🌐 Remote Installation", "📍 In-Person Polokwane", "💻 Windows + Office Bundle", "💰 Pricing"],
      }
    },

    // ── PC TROUBLESHOOTING & VIRUS REMOVAL ────────────────────────────────
    troubleshoot: {
      signals: [
        "pc is slow","laptop is slow","computer is slow","takes forever to start",
        "slow boot","slow startup","running slow","very slow",
        "i have a virus","virus removal","malware","got malware","ransomware",
        "phishing link","clicked a bad link","suspicious popups","random ads",
        "programs i didn't install","computer crashing","laptop crashing",
        "keeps crashing","random shutdown","black screen","freezing","freezes",
        "not responding","computer hangs","blue screen","bsod error",
        "error message","unknown error","overheating","computer is hot",
        "diagnose my pc","fix my pc","pc repair","pc not working",
        "my pc is broken","something wrong with pc",
      ],
      response: {
        text: "**PC Troubleshooting & Virus Removal** — we find the root cause, not just the symptom, and fix it properly the first time.",
        details: [
          "🔍 Full system diagnosis — hardware, software, and security layers",
          "🦠 Deep virus, malware, spyware & ransomware removal with professional tools",
          "⚡ Performance optimization: startup, RAM, disk, background processes",
          "🔧 Corrupted Windows file repair (without losing your data)",
          "🛡️ Antivirus installation and Windows Defender configuration",
          "📚 Honest explanation of what happened + how to avoid it next time",
        ],
        scenarios: [
          "🐌 PC booting in 5+ minutes → we get it under 30 seconds",
          "🦠 Ransomware after clicking phishing email → full removal, files recovered",
          "💥 Random blue screens every day → root cause identified and fixed, not just rebooted",
        ],
        turnaround: "⏱ Same day for most repairs",
        price: "💰 From R150 — depends on complexity, always quoted upfront",
        note: "🛡️ **Satisfaction guarantee:** if the same issue returns after our fix, we sort it free of charge.",
        followUp: "Can you describe what your PC is doing? The more detail you give me, the better I can help you figure out the right fix.",
        suggestions: ["🐌 PC is very slow", "🦠 Think I have a virus", "💥 Crashing / blue screen", "📞 It's urgent — call me"],
      }
    },

    // ── SOFTWARE & DRIVERS ─────────────────────────────────────────────────
    software: {
      signals: [
        "install software","software installation","install a program","install application",
        "driver installation","install driver","printer driver","scanner driver",
        "device driver","hardware driver","install antivirus","security software",
        "install autocad","specific software","accounting software","any software",
        "software not working","software setup","install apps",
      ],
      response: {
        text: "**Software & Driver Installation** — any application, any driver, installed correctly and verified working.",
        details: [
          "✅ Any Windows application or productivity tool",
          "✅ Printer, scanner, and external device drivers",
          "✅ Antivirus and security software configuration",
          "✅ Industry-specific software (AutoCAD, Pastel, accounting tools, etc.)",
          "✅ Bulk installs — need 5 apps at once? No problem",
          "✅ Remote installation available for most software",
        ],
        turnaround: "⏱ 1–2 hours depending on what's needed",
        price: "💰 From R80 per install",
        followUp: "What software or driver do you need? Let me know and I can give you a better time and cost estimate.",
        suggestions: ["🖨️ Printer Driver", "🛡️ Antivirus Setup", "📦 Multiple Apps at Once", "💰 Get a Quote"],
      }
    },

    // ── GRAPHIC DESIGN ─────────────────────────────────────────────────────
    design: {
      signals: [
        "graphic design","need a logo","design a logo","logo design","company logo",
        "design a flyer","flyer design","poster design","need a flyer","need a poster",
        "social media graphics","social media posts","instagram graphics","facebook graphics",
        "banner design","business card design","letterhead design","branding","brand identity",
        "brand design","marketing materials","need branding","visual identity",
        "professional design","creative design","design work",
      ],
      response: {
        text: "**Graphic Design** — professional, eye-catching visuals delivered fast. Work that looks like it came from a top agency.",
        details: [
          "🎨 Logo and full brand identity design",
          "📄 Flyers, posters, and print-ready materials",
          "📱 Social media graphic packages (posts, covers, stories)",
          "🖼️ Banners — digital (web) and print-ready",
          "💼 Business cards and letterheads",
          "📁 Files delivered in all formats: PNG, JPG, PDF + editable source file",
        ],
        process: "Brief & discovery → Concept designs → Your feedback → Refinement → Final delivery. **Revision round included.**",
        turnaround: "⏱ Logo/flyer: 24–48 hrs · Full brand identity: 2–3 days",
        price: "💰 Logo from R250 · Flyer from R150 · Social media pack from R300",
        followUp: "Is this for a business, an event, or personal use? That helps me give you a more accurate quote.",
        suggestions: ["🏢 Business Logo", "📄 Flyer / Poster", "📱 Social Media Pack", "💼 Full Brand Identity"],
      }
    },

    // ── WEB DEVELOPMENT ────────────────────────────────────────────────────
    web: {
      signals: [
        "build a website","create a website","need a website","web development",
        "website design","website development","business website","portfolio website",
        "personal website","landing page","online store","ecommerce website",
        "my website is slow","website not mobile friendly","website redesign",
        "update my website","new website","responsive website","seo website",
        "website for my business","website for my brand",
      ],
      response: {
        text: "**Web Development** — modern, fast, mobile-first websites that make your business look credible and show up on Google.",
        details: [
          "📱 100% mobile-responsive — perfect on phones, tablets, and desktops",
          "🔍 SEO-optimized from the ground up — built to rank",
          "⚡ Optimized for fast loading — no slow sites",
          "🎨 Clean, modern design tailored to your brand and industry",
          "📝 Your text, images, and logo fully integrated",
          "🎓 Handover training — you'll know how to manage your own content",
          "🔧 Post-launch support available",
        ],
        scenarios: [
          "💅 Beauty salon with zero online presence → 5-page website → 3 new clients in week one",
          "📸 Freelance photographer → stunning gallery portfolio → landed bigger-paying clients",
          "🔧 Plumber running on word-of-mouth → website + Google Business → regular online inquiries",
        ],
        turnaround: "⏱ Most sites: 3–7 days · Complex builds discussed upfront",
        price: "💰 From R800 · Custom quotes for larger or e-commerce projects",
        followUp: "What type of site do you need — business, portfolio, or online store? And do you have content ready (text, logo, photos)?",
        suggestions: ["🏢 Business Website", "🖼️ Portfolio Site", "🛒 Online Store", "💰 Get a Custom Quote"],
      }
    },

    // ── ASSIGNMENT ASSISTANCE ──────────────────────────────────────────────
    assignment: {
      signals: [
        "assignment help","assignment assistance","help with assignment",
        "format my assignment","structure my assignment","proofread my assignment",
        "my essay","help with essay","research paper","academic writing",
        "apa format","harvard referencing","mla format","citation help",
        "referencing style","fix my references","deadline tomorrow",
        "assignment is due","due date","submit my assignment","help me submit",
        "struggling with assignment","don't know how to format","formatting help",
        "university assignment","college assignment","tvet assignment","unisa",
        "high school assignment","need academic help","marks are suffering",
        "failed because of format","lecturer said my format is wrong",
      ],
      response: {
        text: "**Assignment Assistance** — properly formatted, well-structured, submission-ready work. Clients regularly go from stress to submitted on time.",
        details: [
          "📐 APA, Harvard, MLA, Chicago — any referencing style corrected",
          "🏗️ Full document structuring: intro, body, headings, conclusion",
          "✍️ Proofreading: grammar, spelling, academic tone",
          "📚 Citation and reference list verification",
          "📄 Final document polished and submission-ready",
          "🎓 All levels: high school, TVET, college, university, UNISA",
          "🌍 All subjects — we've handled science, law, business, education, and more",
        ],
        note: "⚠️ *We assist with formatting, structure, and presentation — content must be your own work. This keeps your academic integrity intact and ensures you actually learn.*",
        turnaround: "⏱ Same day for urgent requests — always tell us your deadline first",
        price: "💰 From R80 · Student-friendly pricing, always",
        followUp: "When is your deadline? That's the most important thing — tell me and I'll let you know if same-day is achievable.",
        suggestions: ["⏰ Deadline is today", "📅 I have a few days", "📐 Referencing help only", "💰 What's the cost?"],
      }
    },

    // ── CV DESIGN & REVAMP ─────────────────────────────────────────────────
    cv: {
      signals: [
        "cv design","design my cv","cv revamp","revamp my cv","update my cv",
        "professional cv","need a cv","create my cv","new cv","cv from scratch",
        "my cv is outdated","cv looks bad","cv not getting interviews",
        "applying for jobs","job hunting","no callbacks","not getting called",
        "need a job","interview cv","cv for internship","cv for graduate",
        "recent graduate cv","entry level cv","career change cv",
        "ats friendly cv","cover letter","linkedin profile",
      ],
      response: {
        text: "**CV Design & Revamp** — a CV that gets you called. We've seen clients go from months of silence to 3 interview calls in a single week.",
        details: [
          "🆕 Brand new CV built from scratch, or full revamp of your existing one",
          "✍️ Content rewritten to speak the language employers actually want to hear",
          "🎨 Modern, clean design — professional and immediately readable",
          "🤖 ATS-friendly formatting — passes the automated screening systems used by big employers",
          "🏭 Industry-matched styling — what works for finance looks different to creative",
          "🔄 Revision round included — we refine until you're fully satisfied",
          "📦 Delivered as PDF (to send) + editable Word document (to update yourself)",
        ],
        result: "⭐ Real result: Precious N. had been applying for months with no results. After her CV revamp she received 3 interview calls within one week.",
        turnaround: "⏱ Within 24 hours · Urgent turnaround available — ask us",
        price: "💰 Revamp from R150 · New CV from scratch from R200",
        followUp: "Quick question: are you building from scratch or do you have an existing CV to revamp? And what kind of role or industry are you targeting?",
        suggestions: ["📄 Build from scratch", "♻️ Revamp existing CV", "💰 See Pricing", "📞 Order Now"],
      }
    },

    // ── BUSINESS DIGITAL SETUP ─────────────────────────────────────────────
    business: {
      signals: [
        "business digital setup","set up my business online","take business online",
        "go digital","going digital","digital presence","online presence",
        "google business","google maps listing","appear on google","rank on google",
        "business email","professional email","email domain","my own email address",
        "domain name","register domain","facebook business page","instagram business",
        "whatsapp business","business whatsapp","social media for business",
        "small business setup","startup setup","new business online",
        "microsoft 365 business","office for business","productivity setup",
      ],
      response: {
        text: "**Business Digital Setup** — everything your business needs online, handled end-to-end by us in 2–3 days.",
        details: [
          "📧 Professional business email: **yourname@yourbusiness.co.za** (not Gmail)",
          "🌐 Domain name registration and full configuration",
          "📍 Google Business Profile setup and optimization — appear in Google Maps & Search",
          "📱 Facebook and Instagram business pages, fully set up",
          "💬 WhatsApp Business configuration with professional profile",
          "🏗️ Basic business website included in the package",
          "💼 Microsoft 365 or other productivity tools configured",
          "🎓 Handover training — you walk away knowing how to run it all yourself",
        ],
        scenarios: [
          "🔧 Plumber using only word-of-mouth → we set up Google Business + Facebook + website → regular online inquiries within days",
          "🍽️ New catering company → domain, email, website, and socials all live within 3 days",
        ],
        turnaround: "⏱ Full setup: 2–3 days",
        price: "💰 Package pricing — contact us for a tailored quote based on exactly what you need",
        followUp: "Is this a brand new business or an existing one that needs to get online? That changes which package makes the most sense.",
        suggestions: ["🆕 Brand new business", "🏪 Existing business going digital", "💰 Package Pricing", "🌐 Just a website"],
      }
    },

    // ── PRICING ────────────────────────────────────────────────────────────
    pricing: {
      signals: [
        "how much does it cost","what is the price","pricing","cost","fee",
        "how much do you charge","rates","what do you charge","give me a quote",
        "affordable","student price","student discount","is it expensive",
        "budget options","cheap","can i afford","rand","rands",
        "payment plans","how much for","price list","all prices",
      ],
      response: {
        text: "**Transparent pricing — no hidden fees, ever. You know the cost before we start.**",
        details: [
          "📝 Assignment Assistance — **from R80**",
          "📄 CV Revamp — **from R150** · New CV — **from R200**",
          "📊 Microsoft Office Install — **from R100**",
          "⚙️ Software / Driver Install — **from R80 per item**",
          "🔧 PC Troubleshooting & Virus Removal — **from R150**",
          "💻 Windows Installation — **from R200**",
          "🎨 Flyer / Poster Design — **from R150**",
          "🎨 Logo Design — **from R250**",
          "📱 Social Media Graphics Pack — **from R300**",
          "🌐 Website Development — **from R800** (custom quote for larger projects)",
          "🏢 Business Digital Setup — **package pricing** (contact us for tailored quote)",
        ],
        note: "💳 We accept: **Cash** (in-person) · **EFT/Bank Transfer** · Instant payment apps.\n🎓 **Student pricing** — tell us you're a student and we'll always work within your budget.",
        followUp: "Which service are you interested in? I can give you a more specific breakdown.",
        suggestions: ["📄 CV Pricing", "💻 PC / Windows Pricing", "🎨 Design Pricing", "🌐 Website Pricing"],
      }
    },

    // ── TURNAROUND ─────────────────────────────────────────────────────────
    turnaround: {
      signals: [
        "how long will it take","turnaround time","how fast","how quick",
        "same day service","urgent","need it today","need it fast",
        "when will it be ready","how soon","delivery time","time frame",
        "i have a deadline","how many days","how many hours",
      ],
      response: {
        text: "**Speed is one of our strengths — most work is same-day or within 24 hours.**",
        details: [
          "📊 Microsoft Office Install — **under 1 hour**",
          "⚙️ Software / Driver Install — **1–2 hours**",
          "💻 Windows Installation — **2–4 hours** (same day)",
          "🔧 PC Troubleshooting — **same day** (most cases)",
          "📝 Assignment Assistance — **same day** (tell us your deadline!)",
          "📄 CV Design — **within 24 hours**",
          "🎨 Graphic Design (logo/flyer) — **24–48 hours**",
          "🎨 Full brand identity — **2–3 days**",
          "🌐 Website — **3–7 days** (scope discussed upfront)",
          "🏢 Business Digital Setup — **2–3 days**",
        ],
        note: "⚡ **Urgent deadline?** WhatsApp us directly: **+27 720 465 993**. Tell us your deadline and we'll prioritize.",
        followUp: "Which service do you need — and what's your timeline?",
        suggestions: ["⚡ It's urgent", "📞 WhatsApp Us Now", "💰 Pricing", "🛠️ All Services"],
      }
    },

    // ── CONTACT ────────────────────────────────────────────────────────────
    contact: {
      signals: [
        "contact you","how do i contact","get in touch","speak to someone",
        "talk to a person","reach you","call you","your phone number",
        "your whatsapp","your email","book a service","book now",
        "schedule","make an appointment","human agent","real person",
        "talk to the team","contact details","how to reach","where to contact",
      ],
      response: {
        text: "**Reach the Mellow Tech team directly — we respond fast:**",
        details: [
          "📱 **WhatsApp / Call: +27 720 465 993** ← *fastest response*",
          "📧 **Email: mellowtech@email.com**",
          "🌐 **Contact form: [mellowtech.co.za/contact.html](https://mellowtech.co.za/contact.html)**",
        ],
        note: "💬 WhatsApp is always the fastest way. We typically reply within a few hours.",
        followUp: null,
        suggestions: ["💰 Check Pricing First", "🛠️ Browse Services", "⏱ Turnaround Times"],
      }
    },

    // ── GUARANTEE / TRUST ──────────────────────────────────────────────────
    guarantee: {
      signals: [
        "do you guarantee","is there a guarantee","warranty","what if i'm not happy",
        "refund policy","money back","not satisfied","problem comes back",
        "issue after repair","came back","returned","can i trust","are you reliable",
        "is this legit","are you scammers","safe to use","trustworthy",
        "how do i know","track record","do you have proof",
      ],
      response: {
        text: "**We stand behind every job. No exceptions.**",
        details: [
          "🛡️ If any issue returns after our fix — we come back and sort it **free of charge**",
          "🔄 All design and CV work includes a **revision round** — changes until you're satisfied",
          "💰 **Upfront, transparent pricing** — you know the cost before we begin",
          "💬 **Plain English** — no tech jargon, no confusion",
          "⭐ **4.9★ rating** from 100+ verified clients",
          "📊 **98% satisfaction rate · 99% would recommend** Mellow Tech",
        ],
        followUp: "Is there anything specific about the process you'd like to understand before getting started?",
        suggestions: ["⭐ See Client Reviews", "💰 View Pricing", "📞 Talk to the Team"],
      }
    },

    // ── REVIEWS ────────────────────────────────────────────────────────────
    reviews: {
      signals: [
        "client reviews","what do your clients say","testimonials","ratings",
        "real feedback","proof of work","success stories","case studies",
        "have you helped anyone","do you have reviews","show me results",
        "previous clients","past work","references",
      ],
      response: {
        text: "**Real results from real clients — 4.9★ across 100+ jobs.**",
        details: [
          "🗣️ *\"My laptop was practically useless. Mellow Tech fixed everything in a few hours — it runs like brand new.\"* — **Thabo M., University Student**",
          "🗣️ *\"They redesigned my CV and I got 3 interview calls within a week. Incredible.\"* — **Precious N., Job Seeker**",
          "🗣️ *\"Got my whole business set up digitally — website, email, social media. Super patient team.\"* — **Kagiso D., Business Owner**",
          "🗣️ *\"Windows and all software installed in under 2 hours. Very affordable and professional.\"* — **Lerato B., Remote Worker**",
          "🗣️ *\"Assignment assistance saved my semester! Submitted on time and got a great mark.\"* — **Sipho M., College Student**",
        ],
        followUp: "Ready to get the same results?",
        suggestions: ["💰 View Pricing", "📞 Book a Service", "🛠️ All Services"],
      }
    },

    // ── PAYMENT ────────────────────────────────────────────────────────────
    payment: {
      signals: [
        "how do i pay","payment options","payment methods","do you accept cash",
        "can i pay eft","bank transfer","eft payment","do you take card",
        "yoco","snapscan","instant pay","online payment","when do i pay",
        "pay upfront","pay after","deposit required",
      ],
      response: {
        text: "**Payment is simple and we're always transparent about it before we start.**",
        details: [
          "💵 **Cash** — for in-person jobs in and around Polokwane",
          "🏦 **EFT / Bank Transfer** — for all jobs, including remote work",
          "📱 **Instant payment apps** — contact us to confirm which we currently support",
        ],
        note: "For remote jobs, payment is typically confirmed before or upon delivery. We'll always walk you through the process clearly — no surprises.",
        followUp: null,
        suggestions: ["💰 See All Pricing", "📞 Discuss a Job", "🛠️ Browse Services"],
      }
    },

    // ── STUDENT SERVICES ───────────────────────────────────────────────────
    students: {
      signals: [
        "i am a student","im a student","student budget","student discount",
        "student pricing","can a student afford","i'm at university",
        "i'm at college","im at varsity","studying","i study at",
        "i don't have much money","tight budget","no money","student loan",
      ],
      response: {
        text: "**Students are some of our favourite clients — and we keep pricing student-friendly on purpose.**",
        details: [
          "📝 Assignment Assistance — from R80",
          "📄 CV for internships and jobs — from R150",
          "💻 Windows + Office bundle — from R300",
          "🔧 Virus removal and speed fix — from R150",
          "🎨 Design for university projects — from R100",
        ],
        note: "💬 Tell us you're a student when you contact us — we'll always work within your budget and won't turn you away.",
        followUp: "What's your main challenge right now — an assignment, your laptop, or getting a job?",
        suggestions: ["📝 Assignment Help", "📄 CV for Internship", "💻 Laptop Setup", "🔧 PC Problems"],
      }
    },

  }; // end KB


  // ===========================================================================
  //  MODULE 3 — DISAMBIGUATION RULES
  //  When two intents score closely and could lead to very different answers,
  //  ask a targeted clarifying question before responding.
  // ===========================================================================

  const DISAMBIG_RULES = [
    {
      id: "design_vs_web",
      // Fires when both 'design' and 'web' have meaningful scores
      trigger: (scores) => (scores.design || 0) >= 2 && (scores.web || 0) >= 2,
      question: "Just so I point you in the right direction — are you looking for **graphic design** (logos, flyers, social media graphics) or a **website**?",
      options: { "🎨 Graphic Design": "design", "🌐 Website": "web" }
    },
    {
      id: "cv_vs_business",
      trigger: (scores) => (scores.cv || 0) >= 2 && (scores.business || 0) >= 2,
      question: "Are you setting up something for yourself as an **individual** (CV, personal brand) or for a **business**?",
      options: { "📄 CV / Personal": "cv", "🏢 Business Setup": "business" }
    },
    {
      id: "windows_vs_troubleshoot",
      trigger: (scores) => {
        const w = scores.windows || 0;
        const t = scores.troubleshoot || 0;
        return w >= 2 && t >= 2 && Math.abs(w - t) <= 3;
      },
      question: "For your PC problem — would you prefer a **fresh Windows reinstall** (clean slate), or should we **diagnose and fix** it first without formatting?",
      options: { "💻 Reinstall Windows": "windows", "🔧 Diagnose & Fix First": "troubleshoot" }
    },
  ];


  // ===========================================================================
  //  MODULE 4 — MULTI-TURN FLOW HANDLERS
  //  Activated when an intent + entity combination triggers a specific path.
  // ===========================================================================

  const FLOWS = {
    assignment_urgent: {
      match: (intent, entities) => intent === "assignment" && entities.deadline?.urgency === "TODAY",
      respond: () => ({
        html: buildHTML({
          text: "⚡ That's urgent — but we've handled this before. Here's what to do **right now:**",
          details: [
            "1️⃣ WhatsApp us immediately: **+27 720 465 993**",
            "2️⃣ Send your assignment brief and any work you've done so far",
            "3️⃣ Tell us the exact submission time and the formatting style required",
            "4️⃣ We'll get started as soon as we receive it",
          ],
          note: "Same-day assignment formatting from R80. We'll confirm availability when you WhatsApp.",
        }),
        suggestions: ["📱 WhatsApp Now", "💰 Assignment Pricing"],
      })
    },
    assignment_tomorrow: {
      match: (intent, entities) => intent === "assignment" && entities.deadline?.urgency === "TOMORROW",
      respond: () => ({
        html: buildHTML({
          text: "Good news — tomorrow is very workable. We've handled tighter deadlines than that.",
          details: [
            "📱 WhatsApp us today: **+27 720 465 993**",
            "📎 Share your assignment brief and any existing work",
            "📐 Tell us the referencing style (APA, Harvard, MLA, etc.)",
            "✅ We'll format, structure, and proofread it — ready before your deadline",
          ],
          price: "💰 From R80",
        }),
        suggestions: ["📱 WhatsApp Us", "📐 What Referencing Styles?", "💰 Pricing"],
      })
    },
  };


  // ===========================================================================
  //  MODULE 5 — INTENT CLASSIFIER
  //  Scores each KB intent against normalized input.
  //  Weights: exact phrase match length × 2, token match × 1.
  // ===========================================================================

  function classify(rawInput) {
    const norm = NLP.normalize(rawInput);
    const tokens = NLP.tokenize(rawInput);
    const scores = {};

    for (const [intent, data] of Object.entries(KB)) {
      let score = 0;
      for (const signal of data.signals) {
        const sn = signal.toLowerCase();
        if (norm.includes(sn)) {
          score += sn.split(" ").length * 2; // phrase length = specificity weight
        }
        // Token-level match as secondary signal
        const overlap = sn.split(" ").filter(t => tokens.includes(t)).length;
        score += overlap * 0.5;
      }
      if (score > 0) scores[intent] = score;
    }

    const ranked = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([intent, score]) => ({ intent, score }));

    return { ranked, scores };
  }


  // ===========================================================================
  //  MODULE 6 — RESPONSE BUILDER
  //  Converts structured KB response objects into formatted HTML.
  //  Supports markdown bold/italic/links + scoped CSS classes.
  // ===========================================================================

  function buildHTML(r) {
    let html = "";
    if (r.text)      html += `<p>${md(r.text)}</p>`;
    if (r.details?.length) {
      html += `<ul class="mwt-list">${r.details.map(d => `<li>${md(d)}</li>`).join("")}</ul>`;
    }
    if (r.scenarios?.length) {
      html += `<div class="mwt-scenarios">${r.scenarios.map(s => `<div class="mwt-scenario">${md(s)}</div>`).join("")}</div>`;
    }
    if (r.process)   html += `<p class="mwt-process">${md(r.process)}</p>`;
    if (r.turnaround || r.price) {
      html += `<div class="mwt-meta">`;
      if (r.turnaround) html += `<span>${md(r.turnaround)}</span>`;
      if (r.price)      html += `<span>${md(r.price)}</span>`;
      html += `</div>`;
    }
    if (r.result)    html += `<p class="mwt-result">${md(r.result)}</p>`;
    if (r.note)      html += `<p class="mwt-note">${md(r.note)}</p>`;
    if (r.followUp)  html += `<p class="mwt-followup">${md(r.followUp)}</p>`;
    return html;
  }

  // Micro-markdown renderer (bold, italic, links, line breaks)
  function md(s) {
    return s
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g,     "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }


  // ===========================================================================
  //  MODULE 7 — CONVERSATION MEMORY
  //  Tracks the last N turns, last resolved intent, and any pending state.
  // ===========================================================================

  const Memory = (() => {
    const MAX = 12;
    let turns        = [];
    let lastIntent   = null;
    let pendingState = null; // { type: 'disambig', options: {label: intent} }

    const push = (role, text, intent = null) => {
      turns.push({ role, text, intent, ts: Date.now() });
      if (turns.length > MAX) turns = turns.slice(-MAX);
      if (intent) lastIntent = intent;
    };

    // Short / ambiguous message: likely a follow-up to the previous topic
    const isFollowUp = (text) => {
      const SHORT_AFFIRM = /^(yes|no|sure|okay|ok|please|ya|yep|nope|more|tell me more|go on|and|what else|thanks)[\.\?!]?$/i;
      return SHORT_AFFIRM.test(text.trim()) || text.trim().length < 12;
    };

    return {
      push,
      isFollowUp,
      getLast:      ()    => lastIntent,
      setPending:   (s)   => { pendingState = s; },
      getPending:   ()    => pendingState,
      clearPending: ()    => { pendingState = null; },
    };
  })();


  // ===========================================================================
  //  MODULE 8 — MAIN PROCESSING ENGINE
  //  Input → NLP → classify → disambig/flow/direct → structured response
  // ===========================================================================

  function process(rawInput) {
    const sent     = NLP.sentiment(rawInput);
    const deadline = NLP.extractDeadline(rawInput);
    const entities = { deadline };

    Memory.push("user", rawInput);

    // ── STEP 1: Resolve any pending disambiguation ──────────────────────
    const pending = Memory.getPending();
    if (pending && pending.type === "disambig") {
      Memory.clearPending();
      const norm = NLP.normalize(rawInput);
      for (const [label, intent] of Object.entries(pending.options)) {
        if (norm.includes(NLP.normalize(label.replace(/[^\w\s]/g,""))) || norm.includes(intent)) {
          return resolveIntent(intent, entities, sent);
        }
      }
      // Couldn't match their input to an option — re-prompt gently
      return {
        html: "<p>I want to make sure I give you the right info — could you tap one of the options below? 😊</p>",
        suggestions: Object.keys(pending.options),
      };
    }

    // ── STEP 2: Classify intent ─────────────────────────────────────────
    const { ranked, scores } = classify(rawInput);
    const THRESHOLD = 1.5;

    // ── STEP 3: Frustrated user with no clear intent → escalate ────────
    if (sent === -1 && (ranked.length === 0 || ranked[0].score < THRESHOLD)) {
      Memory.push("bot", "", "contact");
      return {
        html: buildHTML({
          text: "I can hear this is really frustrating — I'm sorry you're having a tough time. 😔",
          details: [
            "The best thing right now is to speak directly with our team:",
            "📱 **WhatsApp: +27 720 465 993** ← fastest",
            "📧 **Email: mellowtech@email.com**",
          ],
          note: "They'll get you sorted quickly.",
        }),
        suggestions: ["📞 Contact Team Now", "🛠️ Browse Services"],
      };
    }

    // ── STEP 4: No confident match — try context follow-up or fallback ──
    if (ranked.length === 0 || ranked[0].score < THRESHOLD) {
      if (Memory.isFollowUp(rawInput) && Memory.getLast()) {
        return resolveIntent(Memory.getLast(), entities, sent);
      }
      return buildFallback(rawInput);
    }

    // ── STEP 5: Check disambiguation rules ──────────────────────────────
    for (const rule of DISAMBIG_RULES) {
      if (rule.trigger(scores)) {
        Memory.setPending({ type: "disambig", options: rule.options });
        return {
          html: `<p>${md(rule.question)}</p>`,
          suggestions: Object.keys(rule.options),
        };
      }
    }

    // ── STEP 6: Check multi-turn flow handlers ───────────────────────────
    const topIntent = ranked[0].intent;
    for (const [, flow] of Object.entries(FLOWS)) {
      if (flow.match(topIntent, entities)) {
        const r = flow.respond();
        Memory.push("bot", r.html, topIntent);
        return r;
      }
    }

    // ── STEP 7: Direct intent resolution ────────────────────────────────
    return resolveIntent(topIntent, entities, sent);
  }

  function resolveIntent(intentKey, entities, sentiment) {
    const entry = KB[intentKey];
    if (!entry) return buildFallback("");

    let html = buildHTML(entry.response);

    // Empathy prefix for frustrated users even when we have an answer
    if (sentiment === -1) {
      html = `<p>I understand this is stressful — let me get you the right information. 👇</p>` + html;
    }

    Memory.push("bot", html, intentKey);
    return { html, suggestions: entry.response.suggestions || [] };
  }

  function buildFallback(input) {
    Memory.push("bot", "", null);
    const snippet = input.length > 55 ? input.slice(0, 55) + "…" : input;
    return {
      html: buildHTML({
        text: snippet
          ? `I don't have a specific answer for *"${escapeHtml(snippet)}"* — but the team definitely will.`
          : "I'm not sure about that one — but the team will know for certain.",
        details: [
          "📱 **WhatsApp: +27 720 465 993** ← fastest way to get an answer",
          "📧 **Email: mellowtech@email.com**",
          "🌐 [Contact form →](https://mellowtech.co.za/contact.html)",
        ],
        followUp: "Or pick a topic below and I'll do my best to help:",
      }),
      suggestions: ["🛠️ All Services", "💰 Pricing", "⏱ Turnaround", "📞 Contact Us"],
    };
  }


  // ===========================================================================
  //  MODULE 9 — UI ADAPTER
  //  Thin bridge between the engine and the existing widget HTML/CSS.
  //  Adjust SEL selectors to match your actual widget element classes/IDs.
  // ===========================================================================


    // Scoped CSS — injected once, won't conflict with your existing styles
    function injectStyles() {
      if (document.getElementById("mwt-styles")) return;
      const s = document.createElement("style");
      s.id = "mwt-styles";
      s.textContent = `
        .mwt-msg{display:flex;margin:5px 10px;animation:mwtIn .22s ease}
        .mwt-bot{justify-content:flex-start}
        .mwt-user{justify-content:flex-end}
        @keyframes mwtIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

        .mwt-bubble{max-width:84%;padding:10px 14px;border-radius:18px;font-size:13.5px;line-height:1.6}
        .mwt-bot  .mwt-bubble{background:#f0f4ff;border-bottom-left-radius:4px;color:#1a1a2e}
        .mwt-user .mwt-bubble{background:#2c3e85;border-bottom-right-radius:4px;color:#fff}
        .mwt-bubble p{margin:0 0 7px}.mwt-bubble p:last-child{margin-bottom:0}
        .mwt-bubble a{color:#2c3e85;text-decoration:underline}
        .mwt-user .mwt-bubble a{color:#aac4ff}

        ul.mwt-list{margin:5px 0;padding-left:0;list-style:none}
        ul.mwt-list li{padding:2px 0 2px 4px;margin-bottom:3px;border-left:2px solid transparent}
        ul.mwt-list li:hover{border-left-color:#2c3e85}

        .mwt-scenarios{margin:6px 0}
        .mwt-scenario{background:#e8eeff;border-left:3px solid #2c3e85;padding:5px 10px;margin-bottom:4px;border-radius:0 8px 8px 0;font-size:12.5px;color:#2a2a4a}

        .mwt-meta{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 4px}
        .mwt-meta span{background:#fff;border:1px solid #d0d8f0;border-radius:12px;padding:3px 11px;color:#2c3e85;font-weight:600;font-size:12.5px}

        .mwt-result{background:#fffbea;border-left:3px solid #f0b429;padding:5px 10px;border-radius:0 8px 8px 0;font-size:12.5px;margin:5px 0}
        .mwt-note{color:#666;font-size:12px;font-style:italic;margin-top:5px}
        .mwt-followup{margin-top:9px;font-weight:600;color:#2c3e85;font-size:13px}
        .mwt-process{color:#444;font-size:12.5px;margin-top:5px}

        .mwt-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:3px 10px 8px}
        .mwt-suggestion-btn{background:#fff;border:1.5px solid #c5d0f0;border-radius:20px;padding:5px 13px;font-size:12px;cursor:pointer;color:#2c3e85;font-weight:500;transition:all .15s;white-space:nowrap}
        .mwt-suggestion-btn:hover{background:#dce6ff;border-color:#2c3e85;transform:translateY(-1px)}
        .mwt-suggestion-btn:disabled{opacity:.4;cursor:default;transform:none}

        .mwt-typing .mwt-bubble{display:flex;gap:5px;align-items:center;padding:14px 16px}
        .mwt-typing .mwt-bubble span{width:7px;height:7px;background:#2c3e85;border-radius:50%;animation:mwtDot 1.1s infinite}
        .mwt-typing .mwt-bubble span:nth-child(2){animation-delay:.18s}
        .mwt-typing .mwt-bubble span:nth-child(3){animation-delay:.36s}
        @keyframes mwtDot{0%,80%,100%{transform:scale(.65);opacity:.4}40%{transform:scale(1);opacity:1}}
      `;
      document.head.appendChild(s);
    }

    return { init, handleInput };
  })();


  // ===========================================================================
  //  BOOTSTRAP
  // ===========================================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", UI.init);
  } else {
    UI.init();
  }

  // Public API — useful for debugging in the browser console:
  // MellowTechBot.classify("my pc is slow")
  // MellowTechBot.process("how much does a website cost")
  root.MellowTechBot = { process, classify, NLP, Memory, UI, KB };

})(window);

/* ═══════════════════════════════════════════════════
   LOADER (canvas background — mtLoader element)
════════════════════════════════════════════════════ */
(function(){
  if(window._mtLdr) return;
  window._mtLdr = true;

  var ldr      = document.getElementById('mtLoader');
  var canvas   = document.getElementById('mtCanvas');
  var barFill  = document.getElementById('mtBarFill');
  var barPct   = document.getElementById('mtBarPct');
  var logoBase = document.getElementById('mtLogoBase');
  var fillClip = document.getElementById('mtFillClip');
  if(!ldr) return;

  document.body.classList.add('mt-hidden');

  var dur = 10000;
/*  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if(conn && conn.effectiveType){
      if(conn.effectiveType==='2g'||conn.effectiveType==='slow-2g') dur=3000;
      else if(conn.effectiveType==='3g') dur=3500;
    }
  } catch(e){} */

  var ctx = canvas.getContext('2d');
  var W, H;
  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, {passive:true});

  var isMob = window.innerWidth < 600;
  var NODE_COUNT = isMob ? 28 : 55;
  var PART_COUNT = isMob ? 18 : 38;
  var MAX_D      = isMob ? 110 : 155;

  var nodes = [];
  for(var i=0; i<NODE_COUNT; i++){
    nodes.push({x:Math.random()*(window.innerWidth||800),y:Math.random()*(window.innerHeight||600),vx:(Math.random()-0.5)*0.32,vy:(Math.random()-0.5)*0.32,r:1.5+Math.random()*1.8,ph:Math.random()*Math.PI*2});
  }
  var parts = [];
  for(var j=0; j<PART_COUNT; j++){
    parts.push({x:Math.random()*(window.innerWidth||800),y:Math.random()*(window.innerHeight||600),vx:(Math.random()-0.5)*0.55,vy:-0.3-Math.random()*0.55,r:0.7+Math.random()*1.2,lf:Math.random()});
  }

  var rafId = null;
  function drawFrame(){
    ctx.clearRect(0,0,W,H);
    for(var a=0;a<nodes.length;a++){
      var n=nodes[a];
      n.x+=n.vx;n.y+=n.vy;n.ph+=0.022;
      if(n.x<0)n.x=W;if(n.x>W)n.x=0;if(n.y<0)n.y=H;if(n.y>H)n.y=0;
      var alpha=0.35+0.3*Math.sin(n.ph);
      ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,6.2832);ctx.fillStyle='rgba(75,207,250,'+alpha+')';ctx.fill();
      for(var b=a+1;b<nodes.length;b++){
        var m=nodes[b],dx=n.x-m.x,dy=n.y-m.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<MAX_D){
          ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(m.x,m.y);
          ctx.strokeStyle='rgba(75,207,250,'+(1-d/MAX_D)*0.2+')';ctx.lineWidth=0.7;ctx.stroke();
          if(Math.random()<0.002){var t=Math.random(),px=n.x+(m.x-n.x)*t,py=n.y+(m.y-n.y)*t;ctx.beginPath();ctx.arc(px,py,1.4,0,6.2832);ctx.fillStyle='rgba(255,107,0,0.75)';ctx.fill();}
        }
      }
    }
    for(var k=0;k<parts.length;k++){
      var p=parts[k];p.x+=p.vx;p.y+=p.vy;p.lf+=0.005;
      if(p.lf>1||p.y<-10){p.x=Math.random()*W;p.y=H+5;p.lf=0;p.vy=-0.3-Math.random()*0.55;p.vx=(Math.random()-0.5)*0.55;}
      var fade=Math.sin(p.lf*3.1416);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.2832);ctx.fillStyle='rgba(27,20,100,'+(p.r*0.12*fade)+')';ctx.fill();
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*0.4,0,6.2832);ctx.fillStyle='rgba(200,244,90,'+(0.35*fade)+')';ctx.fill();
    }
    rafId=requestAnimationFrame(drawFrame);
  }
  rafId=requestAnimationFrame(drawFrame);

  var prog=0,t0=null,done=false;
  function easeOut(t){return 1-Math.pow(1-t,2.5);}
  function tick(ts){
    if(!t0)t0=ts;
    var raw=Math.min((ts-t0)/dur,1);
    prog=easeOut(raw)*100;
    barFill.style.width=Math.round(prog)+'%';
    barPct.textContent=Math.round(prog)+'%';
    fillClip.style.width=Math.round(prog)+'%';
    logoBase.style.filter='brightness('+(0.08+(prog/100)*0.92)+') saturate('+(prog/100)+')';
    if(raw<1){requestAnimationFrame(tick);}
    else if(!done){done=true;exit();}
  }
  requestAnimationFrame(tick);

  function exit(){
    ldr.classList.add('mt-burst');
    setTimeout(function(){
      ldr.classList.add('mt-out');
      document.body.classList.remove('mt-hidden');
      document.body.classList.add('mt-reveal');
      setTimeout(function(){
        cancelAnimationFrame(rafId);
        if(ldr.parentNode) ldr.parentNode.removeChild(ldr);
        document.body.classList.remove('mt-reveal');
      },900);
    },350);
  }
  setTimeout(function(){if(!done){done=true;exit();}},dur+2500);
})();

/* ═══════════════════════════════════════════════════
   LOADER (SVG scene — page-loader element)
════════════════════════════════════════════════════ */
(function() {
  const CX = 260, CY = 260, R = 170;
  const NS = 'http://www.w3.org/2000/svg';
  const MIN_DISPLAY_TIME = 10000;

  const services = [
    { label: 'CV Writing',          icon: '📄', angle: -90 },
    { label: 'Web Dev',             icon: '🌐', angle: -30 },
    { label: 'Assignments',         icon: '📝', angle:  30 },
    { label: 'Tech Support',        icon: '💻', angle:  90 },
    { label: 'Graphic Design',      icon: '🎨', angle: 150 },
    { label: 'Google Digital Setup',icon: '📈', angle: 210 }
  ];

  const nodeGroup = document.getElementById('nodes');
  const connGroup = document.getElementById('connections');
  const partGroup = document.getElementById('particles');
  if(!nodeGroup) return; // SVG loader not present on this page

  const nodeEls = [];
  const lineEls = [];

  function deg2rad(d) { return d * Math.PI / 180; }

  // Build nodes and connection lines
  services.forEach((svc, i) => {
    const rad = deg2rad(svc.angle);
    const nx = CX + R * Math.cos(rad);
    const ny = CY + R * Math.sin(rad);
    svc.x = nx; svc.y = ny;

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', CX); line.setAttribute('y1', CY);
    line.setAttribute('x2', nx); line.setAttribute('y2', ny);
    line.setAttribute('stroke', 'url(#line-grad)');
    line.setAttribute('stroke-width', '1.2');
    line.setAttribute('opacity', '0.55');
    const totalLen = Math.hypot(nx-CX, ny-CY);
    line.setAttribute('stroke-dasharray', totalLen);
    line.setAttribute('stroke-dashoffset', totalLen);
    connGroup.appendChild(line);
    lineEls.push({ el: line, len: totalLen });

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('opacity', '0');
    g.setAttribute('transform', `translate(${nx},${ny})`);

    const glowC = document.createElementNS(NS, 'circle');
    glowC.setAttribute('r', '28');
    glowC.setAttribute('fill', 'rgba(75,207,250,0.06)');
    glowC.setAttribute('filter', 'url(#glow-node)');
    g.appendChild(glowC);

    const bgC = document.createElementNS(NS, 'circle');
    bgC.setAttribute('r', '24');
    bgC.setAttribute('fill', '#0E1B2E');
    bgC.setAttribute('stroke', 'rgba(75,207,250,0.25)');
    bgC.setAttribute('stroke-width', '1');
    g.appendChild(bgC);

    const fo = document.createElementNS(NS, 'foreignObject');
    fo.setAttribute('x', '-16'); fo.setAttribute('y', '-20');
    fo.setAttribute('width', '32'); fo.setAttribute('height', '30');
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;';
    div.textContent = svc.icon;
    fo.appendChild(div);
    g.appendChild(fo);

    const txt = document.createElementNS(NS, 'text');
    txt.setAttribute('y', '38');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', "'DM Sans', sans-serif");
    txt.setAttribute('font-size', '9');
    txt.setAttribute('font-weight', '500');
    txt.setAttribute('fill', '#cde8f8');
    txt.setAttribute('letter-spacing', '0.5');
    txt.setAttribute('opacity', '0.8');
    txt.textContent = svc.label.toUpperCase();
    g.appendChild(txt);

    nodeGroup.appendChild(g);
    nodeEls.push({ g, nx, ny, baseX: nx, baseY: ny, floatOffset: Math.random() * Math.PI * 2 });
  });

  // Particles
  const MAX_PARTICLES = 90;
  const particles = [];
  function spawnParticle(svcIdx) {
    const svc = services[svcIdx];
    const p = {
      svcIdx, t: 0, speed: 0.004 + Math.random() * 0.004,
      radius: 2 + Math.random() * 1.5,
      opacity: 0.7 + Math.random() * 0.3,
      toCenter: Math.random() > 0.5,
      el: null
    };
    const el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', p.radius);
    el.setAttribute('fill', p.svcIdx % 2 === 0 ? '#4BCFFA' : '#E8B84B');
    el.setAttribute('opacity', '0');
    partGroup.appendChild(el);
    p.el = el;
    particles.push(p);
    return p;
  }
  function updateParticle(p) {
    p.t += p.speed;
    if (p.t >= 1) { p.t = 0; p.toCenter = !p.toCenter; p.opacity = 0.7 + Math.random() * 0.3; }
    const svc = services[p.svcIdx];
    let t = p.toCenter ? p.t : 1 - p.t;
    const px = CX + (svc.x - CX) * (1 - t);
    const py = CY + (svc.y - CY) * (1 - t);
    p.el.setAttribute('cx', px);
    p.el.setAttribute('cy', py);
    p.el.setAttribute('opacity', Math.sin(p.t * Math.PI) * p.opacity);
  }

  // Rings & Logo pulse
  const rings = document.querySelectorAll('.ring');
  let lastRingTime = 0;
  function pulseRings(now) {
    if (now - lastRingTime > 1500) { lastRingTime = now; }
    const elapsed = now - lastRingTime;
    rings.forEach((ring, i) => {
      const delay = i * 400;
      const t = Math.max(0, (elapsed - delay) / 1500);
      const op = t < 0.3 ? t/0.3 * 0.35 : (1-t) * 0.35;
      ring.setAttribute('opacity', op > 0 ? op : 0);
    });
  }
  const logoGroup = document.getElementById('logo-group');
  function pulseLogo(now) {
    if(!logoGroup) return;
    const scale = 1 + 0.025 * Math.sin(now / 900);
    logoGroup.setAttribute('transform', `translate(${CX},${CY}) scale(${scale}) translate(${-CX},${-CY})`);
  }

  const bar     = document.getElementById('progress-bar');
  const pctEl   = document.getElementById('pct');
  const loader  = document.getElementById('page-loader');

  let startTime = null, animationFrame = null, isLoaded = false;
  const LINE_STARTS = [0.02, 0.08, 0.14, 0.20, 0.26, 0.32];
  let particleSpawnCount = 0;

  // ── Main animation frame ──────────────────────────
  function frame(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const FAKE_DURATION = 10000;
    const rawProgress = Math.min(elapsed / FAKE_DURATION, 0.90);

    bar.style.width = (rawProgress * 100) + '%';
    pctEl.textContent = Math.floor(rawProgress * 100) + '%';

    lineEls.forEach((ln, i) => {
      const lineStart = LINE_STARTS[i];
      const lineP = Math.max(0, Math.min(1, (rawProgress - lineStart) / (0.9 - lineStart)));
      ln.el.setAttribute('stroke-dashoffset', ln.len * (1 - lineP));
    });

    nodeEls.forEach((n, i) => {
      const revealAt = LINE_STARTS[i] + 0.20;
      const revealP = Math.max(0, Math.min(1, (rawProgress - revealAt) / 0.08));
      n.g.setAttribute('opacity', revealP);
      const floatAmp = 4 * revealP;
      const fx = n.baseX + floatAmp * Math.cos(now / 1800 + n.floatOffset);
      const fy = n.baseY + floatAmp * Math.sin(now / 1400 + n.floatOffset);
      n.g.setAttribute('transform', `translate(${fx},${fy})`);
    });

    if (rawProgress > 0.2 && particles.length < MAX_PARTICLES && particleSpawnCount < 3000) {
      const svcIdx = Math.floor(Math.random() * 6);
      if (rawProgress > LINE_STARTS[svcIdx] + 0.2) {
        spawnParticle(svcIdx);
        particleSpawnCount++;
      }
    }
    particles.forEach(p => updateParticle(p));

    pulseRings(now);
    pulseLogo(now);

    animationFrame = requestAnimationFrame(frame); // keep loop running
  }

  // ── Finish & hide loader ──────────────────────────
  function finishLoader() {
    if (animationFrame) cancelAnimationFrame(animationFrame);

    bar.style.width = '100%';
    pctEl.textContent = '100%';
    lineEls.forEach(ln => ln.el.setAttribute('stroke-dashoffset', 0));
    nodeEls.forEach(n => n.g.setAttribute('opacity', 1));

    setTimeout(() => {
      if(loader) loader.classList.add('done');
    }, 400);
  }

  // ── Wait for page load + minimum display time ─────
  window.addEventListener('load', function() {
    isLoaded = true;
    const elapsed = startTime ? performance.now() - startTime : 0;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
    setTimeout(finishLoader, remaining);
  });

  // Kick off the animation
  animationFrame = requestAnimationFrame(frame);
})();

/* ═══════════════════════════════════════════════════
   EMAILJS CONTACT FORM
════════════════════════════════════════════════════ */
(function(){
  var form = document.getElementById('contactForm');
  if(!form) return;
  if(!window.__ejLoaded){
    window.__ejLoaded=true;
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload=function(){emailjs.init({publicKey:'xS49JkhsNjH8-uBMZ'});};
    document.head.appendChild(s);
  }
  var SVC='service_ee5shgv',T1='template_16z5mzs',T2='template_49mvvnh';
  var sending=false;
  function setLoad(on){
    var btn=document.getElementById('submitBtn');
    btn.disabled=on;
    btn.querySelector('.btn-text').style.display=on?'none':'';
    btn.querySelector('.btn-loading').style.display=on?'inline':'none';
  }
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if(sending)return;
    var data=Object.fromEntries(new FormData(form).entries());
    if(!data.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){alert('Please enter a valid email address.');return;}
    sending=true;setLoad(true);
    try{
      await Promise.all([emailjs.send(SVC,T1,data),emailjs.send(SVC,T2,data)]);
      form.style.display='none';
      document.getElementById('formSuccess').style.display='block';
    }catch(err){
      console.error(err);alert('Something went wrong. Please try again.');
      sending=false;setLoad(false);
    }
  });
})();
