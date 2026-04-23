/* ═══════════════════════════════════════════════════════════════════════════
   MELLOW TECH SERVICES — INTELLIGENT SALES BOT v3.0
   mellowtech-salesbot.js
   
   Architecture:
     MODULE 1  — NLP Pipeline       (normalize, tokenize, sentiment, deadline)
     MODULE 2  — Knowledge Base     (service data, pricing, guarantees)
     MODULE 3  — Intent Classifier  (scored synonym matching)
     MODULE 4  — Conversation Memory (name, need, stage, history)
     MODULE 5  — Sales Flow Engine  (greeting → discovery → qualify → close)
     MODULE 6  — WhatsApp Redirect  (pre-filled message, proper encoding)
     MODULE 7  — Response Builder   (HTML + suggestion chips)
     MODULE 8  — Main Process       (entry point: window.MellowTechBot.process)
     MODULE 9  — UI Adapter         (chat panel, send, typing, chips)
     MODULE 10 — Bootstrap          (DOMContentLoaded safe init)
════════════════════════════════════════════════════════════════════════════ */

;(function (root) {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 1 — NLP PIPELINE
  // ══════════════════════════════════════════════════════════════════════════
  const NLP = (() => {

    // Slang / abbreviation expansions (sorted longest-first for safe replacement)
    const RAW_EXP = {
      // Greetings
      "howzit":"hello","haai":"hello","hie":"hello","heita":"hello",
      "sawubona":"hello","dumela":"hello","hola":"hello","sup":"hello",
      "yo":"hello","hey":"hello",
      // Affirmations
      "ja":"yes","yebo":"yes","nee":"no","aikona":"no","nah":"no",
      "yep":"yes","yup":"yes","nope":"no",
      // Contractions
      "wont":"will not","dont":"do not","cant":"cannot","im":"i am",
      "ive":"i have","theres":"there is","whats":"what is","hows":"how is",
      "id":"i would","ill":"i will","its":"it is","ive":"i have",
      // Text speak
      "ur":"your","u":"you","r":"are","b":"be","2":"to","4":"for",
      "pls":"please","plz":"please","asap":"urgent now","rn":"right now",
      "btw":"by the way","tbh":"to be honest","lol":"",
      // Tech terms
      "reinstall":"install windows","reformat":"format windows",
      "wipe pc":"format windows","wipe laptop":"format windows",
      "os":"operating system windows","bsod":"blue screen crash error",
      "lagging":"slow performance","lag":"slow","hanging":"freezing",
      // SA business
      "lekker":"good","bra":"friend","sisi":"friend",
      "spaza":"small business","hustle":"business",
      "smme":"small business","sme":"small business",
      // CV synonyms
      "curriculum vitae":"cv","resume":"cv","job application cv":"cv job",
      "cover letter":"cv job",
      // Academic
      "prac":"practical assignment","tut":"tutorial assignment",
      "due":"deadline assignment","referencing":"citation formatting",
      "unisa":"university assignment","tvet":"college assignment",
      // Payment
      "eft":"bank transfer payment","rands":"price cost","rand":"price cost",
      // Typos
      "windos":"windows","widows":"windows","winows":"windows",
      "websit":"website","web site":"website","sight":"website",
      "grafic":"graphic","desing":"design","dessign":"design",
      "buisness":"business","bussiness":"business","bizness":"business",
      "develoment":"development","devlopment":"development",
      "ofice":"office","excell":"excel","powerponit":"powerpoint",
    };

    const EXPANSIONS = Object.entries(RAW_EXP)
      .sort(([a], [b]) => b.length - a.length);

    function normalize(text) {
      let t = String(text).toLowerCase()
        .replace(/[''`]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      for (const [term, expansion] of EXPANSIONS) {
        if (t.includes(term)) t = t.split(term).join(expansion);
      }
      return t;
    }

    const STOPWORDS = new Set([
      "a","an","the","and","or","but","in","on","at","to","for","of","with",
      "is","it","this","that","my","i","me","we","you","do","can","will","be",
      "am","are","was","were","have","has","had","just","also","so","if","how",
      "what","when","where","which","who","please","okay","ok","yes","no",
    ]);

    function tokenize(text) {
      return normalize(text).split(" ")
        .filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    const NEG_PHRASES = [
      "not working","broken","useless","frustrated","angry","terrible",
      "rubbish","hate","nothing works","waste","worst","problem","issue",
      "failed","doesn't work","wasted","annoyed","sick of","fed up","scam",
    ];
    const POS_PHRASES = [
      "thanks","thank you","great","awesome","perfect","love","excellent",
      "amazing","fantastic","helpful","wonderful","appreciate","brilliant","lekker",
    ];

    function sentiment(raw) {
      const t = raw.toLowerCase();
      const neg = NEG_PHRASES.filter(s => t.includes(s)).length;
      const pos = POS_PHRASES.filter(s => t.includes(s)).length;
      return neg > pos ? -1 : pos > neg ? 1 : 0;
    }

    const NAME_STOP = new Set([
      "hi","hello","hey","help","need","want","looking","please","a","the","and",
      "or","my","me","i","is","it","yes","no","ok","okay","thanks","good","great",
      "fine","sure","of","for","with","some","what","just","can","you","we","do",
    ]);

    function extractName(text) {
      // Patterns: "my name is X", "I am X", "I'm X", "call me X"
      const patterns = [
        /my name is ([A-Za-z]{2,20})/i,
        /i(?:'m| am) ([A-Za-z]{2,20})/i,
        /call me ([A-Za-z]{2,20})/i,
        /it's ([A-Za-z]{2,20})/i,
        /^([A-Za-z]{2,20})$/i,   // single word response (after name prompt)
      ];
      for (const re of patterns) {
        const m = text.match(re);
        if (m) {
          const candidate = m[1].toLowerCase();
          if (!NAME_STOP.has(candidate)) {
            return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
          }
        }
      }
      return null;
    }

    const DEADLINE_RE = [
      { re: /\b(today|tonight|now|asap|urgent|immediately|right now)\b/i, label: "TODAY" },
      { re: /\b(tomorrow)\b/i,                                             label: "TOMORROW" },
      { re: /\bin (\d+)\s*(hour|hours|hr|hrs)\b/i,                         label: "HOURS" },
      { re: /\bin (\d+)\s*(day|days)\b/i,                                  label: "DAYS" },
      { re: /\b(monday|tuesday|wednesday|thursday|friday|saturday)\b/i,    label: "WEEKDAY" },
    ];

    function extractDeadline(text) {
      for (const { re, label } of DEADLINE_RE) {
        const m = text.match(re);
        if (m) return { match: m[0], urgency: label };
      }
      return null;
    }

    return { normalize, tokenize, sentiment, extractName, extractDeadline };
  })();


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 2 — KNOWLEDGE BASE
  // ══════════════════════════════════════════════════════════════════════════
  const KB = {

    greeting: {
      signals: [
        "hello","hi","hey","good morning","good afternoon","good evening",
        "howzit","heita","sawubona","dumela","hola","greetings","start",
      ],
      score_boost: 3,
    },

    web: {
      signals: [
        "website","web development","web design","build a site","create a website",
        "need a website","business website","portfolio website","landing page",
        "online store","ecommerce","web page","web app","responsive site",
        "website for my business","website for my brand","seo website",
        "website is slow","website not working","website redesign","update website",
        "new website","website development","build site","make website",
        "online presence website",
      ],
      name: "Website Development",
      emoji: "🌐",
      pitch: "A modern, mobile-first website that makes your business look credible and rank on Google.",
      details: [
        "📱 100% mobile-responsive — looks perfect on all devices",
        "🔍 SEO-optimized from the ground up",
        "⚡ Fast-loading, clean, modern design",
        "🎨 Branded to your business identity",
        "🎓 Handover training included",
      ],
      turnaround: "3–7 business days",
      price: "From R800",
      qualify_q: "Is this for a business, portfolio, or online store — and do you have content ready (text, logo, photos)?",
    },

    cv: {
      signals: [
        "cv","resume","curriculum vitae","job application","cover letter",
        "cv design","design my cv","cv revamp","update my cv","new cv",
        "cv from scratch","cv looks bad","not getting interviews","no callbacks",
        "applying for jobs","job hunting","interview cv","graduate cv",
        "entry level cv","career change cv","ats cv","linkedin profile",
        "need a job","job seeker","cv help","professional cv",
      ],
      name: "CV Design & Revamp",
      emoji: "📄",
      pitch: "A CV that actually gets you called. One client went from months of silence to 3 interview calls in a single week.",
      details: [
        "🆕 Built from scratch or full revamp of existing CV",
        "🤖 ATS-friendly — passes automated screening systems",
        "🎨 Modern, clean design that stands out",
        "✍️ Content rewritten to speak the employer's language",
        "📦 Delivered as PDF + editable Word doc",
      ],
      turnaround: "Within 24 hours",
      price: "Revamp from R150 · New CV from R200",
      qualify_q: "Quick question — are you building from scratch or revamping an existing CV? And what type of role/industry are you targeting?",
    },

    assignment: {
      signals: [
        "assignment","assignment help","assignment assistance","format assignment",
        "proofread","essay","research paper","academic writing","apa format",
        "harvard referencing","mla format","citation","referencing style",
        "fix references","deadline assignment","submit assignment","academic help",
        "university assignment","college assignment","tvet","unisa","school work",
        "struggling with assignment","formatting help","assignment due","marks",
        "lecturer said","wrong format",
      ],
      name: "Assignment Assistance",
      emoji: "📝",
      pitch: "Properly formatted, structured, and submission-ready — we've helped students go from stress to submitted on time.",
      details: [
        "📐 APA, Harvard, MLA, Chicago — any style corrected",
        "🏗️ Full document structuring: intro, body, conclusion",
        "✍️ Grammar, spelling, academic tone fixed",
        "📚 References verified and formatted",
        "🎓 All levels: high school, TVET, university, UNISA",
      ],
      turnaround: "Same day for urgent requests",
      price: "From R80",
      qualify_q: "When is your deadline? That's the most important thing — tell me and I'll confirm if same-day is doable.",
    },

    windows: {
      signals: [
        "install windows","reinstall windows","windows installation","clean install",
        "format pc","format laptop","fresh install","windows 10","windows 11",
        "activate windows","windows activation","windows license","expired license",
        "blue screen","bsod","pc won't boot","laptop won't start","won't turn on",
        "boot loop","no operating system","no os","new laptop setup",
        "second hand laptop","bought a laptop","corrupted windows","windows is broken",
        "windows not working","factory reset","os installation",
      ],
      name: "Windows Installation & Activation",
      emoji: "💻",
      pitch: "Clean, properly configured OS from scratch — no bloatware, no fake activation keys.",
      details: [
        "✅ Windows 10 or 11 — your choice",
        "✅ All drivers installed and verified",
        "✅ Genuine activation — no popups, no expiry",
        "✅ Your files backed up before we touch anything",
        "✅ Full system test and handover walkthrough",
      ],
      turnaround: "2–4 hours (same day)",
      price: "From R200",
      qualify_q: "Is the PC crashing, unactivated, or does it need a completely fresh setup from scratch?",
    },

    troubleshoot: {
      signals: [
        "pc is slow","laptop is slow","computer is slow","slow boot","slow startup",
        "running slow","virus","malware","ransomware","suspicious popups","random ads",
        "crashing","laptop crashing","keeps crashing","random shutdown","black screen",
        "freezing","not responding","computer hangs","blue screen","bsod error",
        "error message","overheating","diagnose pc","fix my pc","pc repair",
        "pc not working","broken","something wrong","computer problems",
        "laptop problems","tech support","repair","help with pc","help with laptop",
      ],
      name: "PC Troubleshooting & Repair",
      emoji: "🔧",
      pitch: "We find the root cause, not just the symptom — and fix it properly the first time.",
      details: [
        "🔍 Full system diagnosis — hardware, software, security",
        "🦠 Deep virus, malware & ransomware removal",
        "⚡ Performance optimization: startup, RAM, disk",
        "🔧 Corrupted Windows file repair",
        "🛡️ Antivirus installation and configuration",
      ],
      turnaround: "Same day for most repairs",
      price: "From R150",
      qualify_q: "Can you describe what your PC is doing? The more detail, the better I can pinpoint the fix.",
    },

    design: {
      signals: [
        "graphic design","logo","logo design","company logo","flyer","poster",
        "flyer design","poster design","social media graphics","instagram graphics",
        "facebook graphics","banner design","business card","letterhead","branding",
        "brand identity","brand design","marketing materials","visual identity",
        "creative design","design work","need a design",
      ],
      name: "Graphic Design & Branding",
      emoji: "🎨",
      pitch: "Professional, eye-catching visuals — work that looks like it came from a top agency.",
      details: [
        "🎨 Logo and full brand identity design",
        "📄 Flyers, posters, and print-ready materials",
        "📱 Social media graphic packages",
        "💼 Business cards and letterheads",
        "📁 PNG, JPG, PDF + editable source files delivered",
      ],
      turnaround: "Logo/flyer: 24–48 hrs · Full brand identity: 2–3 days",
      price: "Logo from R250 · Flyer from R150 · Social media pack from R300",
      qualify_q: "Is this for a business, an event, or personal use? That helps me give you a more accurate quote.",
    },

    office: {
      signals: [
        "microsoft office","install office","ms office","office setup",
        "word and excel","word excel powerpoint","outlook","microsoft 365",
        "office 365","install word","install excel","install powerpoint",
        "office activation","office not working","office expired","cant open word",
        "cant open excel",
      ],
      name: "Microsoft Office Installation",
      emoji: "📊",
      pitch: "Full Office suite, properly activated, ready to use in under an hour.",
      details: [
        "✅ Word, Excel, PowerPoint, Outlook and more",
        "✅ Genuine activation — no 30-day trials",
        "✅ Remote installation available",
      ],
      turnaround: "Under 1 hour",
      price: "From R100",
      qualify_q: "Are you in Polokwane (in-person) or would you prefer a remote installation via screen share?",
    },

    business: {
      signals: [
        "business digital setup","take business online","go digital","digital presence",
        "online presence","google business","google maps","appear on google",
        "business email","professional email","email domain","domain name",
        "register domain","facebook business","instagram business","whatsapp business",
        "social media for business","small business setup","startup setup",
        "new business","business whatsapp",
      ],
      name: "Business Digital Setup",
      emoji: "🏢",
      pitch: "Everything your business needs online — handled end-to-end in 2–3 days.",
      details: [
        "📧 Professional business email (yourname@yourbusiness.co.za)",
        "🌐 Domain registration and configuration",
        "📍 Google Business Profile — appear in Maps & Search",
        "📱 Facebook + Instagram business pages",
        "💬 WhatsApp Business setup",
      ],
      turnaround: "Full setup: 2–3 days",
      price: "Package pricing — contact us for a tailored quote",
      qualify_q: "Is this a brand new business, or an existing one that needs to get online?",
    },

    pricing: {
      signals: [
        "how much","price","pricing","cost","fee","charge","rates","quote",
        "affordable","student price","student discount","expensive","budget",
        "cheap","rand","rands","payment plan","price list","all prices",
        "what does it cost","how much for","how much does",
      ],
    },

    contact: {
      signals: [
        "contact","whatsapp","phone","call","email","speak to someone","talk to",
        "reach you","book","schedule","appointment","human","real person",
        "team","contact details","how to reach","where to contact",
      ],
    },
  };


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 3 — INTENT CLASSIFIER
  // ══════════════════════════════════════════════════════════════════════════
  function classify(rawInput) {
    const norm   = NLP.normalize(rawInput);
    const tokens = NLP.tokenize(rawInput);
    const scores = {};

    for (const [intent, data] of Object.entries(KB)) {
      if (!data.signals) continue;
      let score = 0;

      for (const signal of data.signals) {
        const sn = signal.toLowerCase();
        // Phrase match (weighted by phrase length)
        if (norm.includes(sn)) {
          score += sn.split(" ").length * 2.5;
        }
        // Token overlap
        const overlap = sn.split(" ").filter(t => tokens.includes(t)).length;
        score += overlap * 0.6;
      }

      if (score > 0) {
        scores[intent] = score + (data.score_boost || 0);
      }
    }

    const ranked = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([intent, score]) => ({ intent, score }));

    return { ranked, scores };
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 4 — CONVERSATION MEMORY
  // ══════════════════════════════════════════════════════════════════════════
  const Memory = (() => {
    const MAX_TURNS = 16;

    let state = {
      userName:          null,
      userNeed:          null,
      lastIntent:        null,
      conversationStage: "greeting",  // greeting | discovery | qualify | value | close
      askedName:         false,
      pendingState:      null,
      turns:             [],
    };

    function push(role, text, intent = null) {
      state.turns.push({ role, text, intent, ts: Date.now() });
      if (state.turns.length > MAX_TURNS) state.turns = state.turns.slice(-MAX_TURNS);
      if (intent) state.lastIntent = intent;
    }

    function isShortOrAffirm(text) {
      const SHORT = /^(yes|no|sure|okay|ok|please|ya|yep|nope|more|go on|thanks|and|what else|tell me more)[\.\?!]?$/i;
      return SHORT.test(text.trim()) || text.trim().length < 18;
    }

    function setStage(s)       { state.conversationStage = s; }
    function getStage()        { return state.conversationStage; }
    function setName(n)        { state.userName = n; }
    function getName()         { return state.userName; }
    function setNeed(n)        { state.userNeed = n; }
    function getNeed()         { return state.userNeed; }
    function getLast()         { return state.lastIntent; }
    function askedNameBefore() { return state.askedName; }
    function markAskedName()   { state.askedName = true; }
    function setPending(s)     { state.pendingState = s; }
    function getPending()      { return state.pendingState; }
    function clearPending()    { state.pendingState = null; }

    return {
      push, isShortOrAffirm, setStage, getStage,
      setName, getName, setNeed, getNeed, getLast,
      askedNameBefore, markAskedName,
      setPending, getPending, clearPending,
    };
  })();


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 5 — SALES FLOW ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  const SERVICE_INTENTS = new Set(["web","cv","assignment","windows","troubleshoot","design","office","business"]);

  // Varied response phrases to avoid robotic repetition
  const GREETINGS = [
    "Hey! 👋 Welcome to Mellow Tech. What can we help you with today?",
    "Hi there! 😊 You've reached Mellow Tech — what do you need help with?",
    "Hey, great to have you here! 👋 What brings you to Mellow Tech today?",
    "Welcome! I'm the Mellow Tech assistant. What can I sort out for you today?",
  ];

  const NAME_ASKS = [
    "Before we go further — what's your name? 😊",
    "Quick one — what should I call you?",
    "What's your name? That way I can personalise this for you 👇",
  ];

  const QUALIFY_TRANSITIONS = [
    "Got it! One quick question before I give you the details:",
    "Perfect — just so I give you the right info:",
    "Great choice! Quick question to narrow it down:",
  ];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function buildServiceResponse(intentKey, entities) {
    const svc = KB[intentKey];
    if (!svc || !svc.name) return null;

    Memory.setNeed(svc.name);
    Memory.setStage("qualify");

    const stage = Memory.getStage();
    const name  = Memory.getName();

    // Check for urgent assignment
    if (intentKey === "assignment" && entities.deadline?.urgency === "TODAY") {
      Memory.setStage("close");
      return {
        html: buildHTML({
          text: "⚡ That's urgent — but we've handled this before.",
          details: [
            "1️⃣ WhatsApp us now: **+27 720 465 993**",
            "2️⃣ Send your brief and any existing work",
            "3️⃣ Tell us the submission time and referencing style required",
            "4️⃣ We'll confirm and get started immediately",
          ],
          note: "Same-day formatting from R80. Reply confirmed on WhatsApp.",
        }),
        suggestions: ["📱 WhatsApp Now", "💰 Assignment Pricing", "📝 More About This Service"],
      };
    }

    // Value delivery + soft qualify
    const qualifyLine = rand(QUALIFY_TRANSITIONS);
    let html = buildHTML({
      text: `**${svc.emoji} ${svc.name}** — ${svc.pitch}`,
      details: svc.details,
      turnaround: `⏱ ${svc.turnaround}`,
      price: `💰 ${svc.price}`,
      followUp: `${qualifyLine} ${svc.qualify_q}`,
    });

    return {
      html,
      suggestions: getServiceSuggestions(intentKey),
    };
  }

  function getServiceSuggestions(intentKey) {
    const map = {
      web:          ["🏢 Business Site", "🖼️ Portfolio Site", "🛒 Online Store", "💰 Get a Quote"],
      cv:           ["📄 Build from Scratch", "♻️ Revamp Existing CV", "💰 Pricing", "📞 Order Now"],
      assignment:   ["⏰ Deadline is Today", "📅 I Have a Few Days", "📐 Referencing Help Only", "💰 What's the Cost?"],
      windows:      ["💥 PC Keeps Crashing", "🔑 Need Activation", "🆕 New Laptop Setup", "💰 Get Exact Quote"],
      troubleshoot: ["🐌 Very Slow PC", "🦠 Think I Have a Virus", "💥 Crashing / Blue Screen", "📞 Urgent — Call Me"],
      design:       ["🏢 Business Logo", "📄 Flyer / Poster", "📱 Social Media Pack", "💼 Full Branding"],
      office:       ["🌐 Remote Install", "📍 In-Person Polokwane", "💻 Windows + Office Bundle", "💰 Pricing"],
      business:     ["🆕 New Business", "🏪 Existing Business Online", "💰 Package Pricing", "🌐 Just a Website"],
    };
    return map[intentKey] || ["💰 Pricing", "📞 Contact Us", "🛠️ Other Services"];
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 6 — WHATSAPP REDIRECT
  // ══════════════════════════════════════════════════════════════════════════
  const WA_NUMBER = "27720465993";

  function buildWhatsAppLink(name, need, extra = "") {
    const nm  = name || "a potential client";
    const svc = need || "your services";
    const msg = `Hi, I came from your website. My name is ${nm} and I would like help with ${svc}.${extra ? " " + extra : ""}`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function whatsAppCTA(name, need, extraContext = "") {
    const link = buildWhatsAppLink(name, need, extraContext);
    const nm   = name ? `, ${name}` : "";
    return buildHTML({
      text: `Perfect${nm}! 🎉 Here's your direct link to get started:`,
      details: [
        `📱 <a href="${link}" target="_blank" rel="noopener"><strong>Click here to WhatsApp us →</strong></a>`,
        "We typically respond within a few minutes.",
        "Your details are pre-filled so no need to type anything extra 👆",
      ],
    });
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 7 — RESPONSE BUILDER
  // ══════════════════════════════════════════════════════════════════════════
  function buildHTML(r) {
    let html = "";
    if (r.text)     html += `<p>${md(r.text)}</p>`;
    if (r.details?.length) {
      html += `<ul class="mwt-list">${r.details.map(d => `<li>${md(d)}</li>`).join("")}</ul>`;
    }
    if (r.turnaround || r.price) {
      html += `<div class="mwt-meta">`;
      if (r.turnaround) html += `<span>${md(r.turnaround)}</span>`;
      if (r.price)      html += `<span>${md(r.price)}</span>`;
      html += `</div>`;
    }
    if (r.result)   html += `<p class="mwt-result">${md(r.result)}</p>`;
    if (r.note)     html += `<p class="mwt-note">${md(r.note)}</p>`;
    if (r.followUp) html += `<p class="mwt-followup">${md(r.followUp)}</p>`;
    return html;
  }

  function md(s) {
    return String(s)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g,     "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // Pricing summary response
  function pricingResponse() {
    return {
      html: buildHTML({
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
          "🌐 Website Development — **from R800**",
          "🏢 Business Digital Setup — **package pricing**",
        ],
        note: "🎓 Student? Tell us when you contact us — we always work within your budget.",
        followUp: "Which service are you interested in? I can give you a more specific breakdown.",
      }),
      suggestions: ["📄 CV Pricing", "💻 PC / Windows", "🎨 Design Pricing", "🌐 Website Pricing"],
    };
  }

  // Contact response
  function contactResponse() {
    return {
      html: buildHTML({
        text: "**Reach the Mellow Tech team directly — we respond fast:**",
        details: [
          "📱 **WhatsApp / Call: +27 720 465 993** ← *fastest response*",
          "📧 **Email: mellowtech@email.com**",
          "🌐 **[Contact form →](https://mellowtech.co.za/contact.html)**",
        ],
        note: "💬 WhatsApp is always fastest. We typically reply within a few hours.",
      }),
      suggestions: ["💰 Check Pricing", "🛠️ Browse Services", "⏱ Turnaround Times"],
    };
  }

  // Fallback response
  function fallback(input) {
    Memory.push("bot", "", null);
    const snippet = input.length > 55 ? input.slice(0, 55) + "…" : input;
    return {
      html: buildHTML({
        text: snippet
          ? `Not sure about *"${escHtml(snippet)}"* — but let's get you to the right place.`
          : "Not sure about that one — let me help you find the right service 👇",
        details: [
          "📱 **WhatsApp: +27 720 465 993** ← fastest way to get an answer",
          "📧 **Email: mellowtech@email.com**",
        ],
        followUp: "Or pick one of these:",
      }),
      suggestions: ["🛠️ All Services", "💰 Pricing", "🌐 Websites", "📄 CV Help"],
    };
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 8 — MAIN PROCESSING ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  function process(rawInput) {
    const sent     = NLP.sentiment(rawInput);
    const deadline = NLP.extractDeadline(rawInput);
    const entities = { deadline };

    Memory.push("user", rawInput);

    // ── STEP 0: Resolve pending disambiguation ───────────────────────────
    const pending = Memory.getPending();
    if (pending && pending.type === "disambig") {
      Memory.clearPending();
      const norm = NLP.normalize(rawInput);
      for (const [label, intent] of Object.entries(pending.options)) {
        const cleanLabel = NLP.normalize(label.replace(/[^\w\s]/g, ""));
        if (norm.includes(cleanLabel) || norm.includes(intent)) {
          return resolveService(intent, entities, sent);
        }
      }
      return {
        html: "<p>Could you tap one of the options below? 😊</p>",
        suggestions: Object.keys(pending.options),
      };
    }

    // ── STEP 1: Pending name capture ─────────────────────────────────────
    if (pending && pending.type === "name_capture") {
      Memory.clearPending();
      const extractedName = NLP.extractName(rawInput) || (
        rawInput.trim().length < 25 && /^[A-Za-z\s]+$/.test(rawInput.trim())
          ? rawInput.trim().split(" ")[0]
          : null
      );
      if (extractedName) {
        Memory.setName(extractedName);
        const need = Memory.getNeed();
        if (need) {
          // Have name + need → push to WhatsApp
          Memory.setStage("close");
          const html = whatsAppCTA(extractedName, need);
          Memory.push("bot", html, "close");
          return {
            html,
            suggestions: ["📱 Open WhatsApp", "🛠️ Other Services"],
          };
        } else {
          // Have name, no need yet → discovery
          Memory.setStage("discovery");
          const html = buildHTML({
            text: `Great, ${extractedName}! 😊 What do you need help with?`,
            followUp: "Tap one below or just type it:",
          });
          Memory.push("bot", html, "discovery");
          return {
            html,
            suggestions: ["🌐 Website", "📄 CV", "💻 PC Repair", "🎨 Design", "📝 Assignment", "💰 Pricing"],
          };
        }
      } else {
        // Couldn't parse a name — try again once
        Memory.setPending({ type: "name_capture" });
        const html = "<p>What's your name? I just need a first name is fine 😊</p>";
        Memory.push("bot", html, null);
        return { html, suggestions: [] };
      }
    }

    // ── STEP 2: Pending confirmation (soft close) ────────────────────────
    if (pending && pending.type === "confirm_close") {
      Memory.clearPending();
      const norm = NLP.normalize(rawInput);
      if (/yes|sure|okay|ok|ya|yep|please|go ahead|do it/i.test(norm)) {
        // Confirmed — go to name if we don't have it
        if (!Memory.getName()) {
          Memory.markAskedName();
          Memory.setPending({ type: "name_capture" });
          const html = `<p>${rand(NAME_ASKS)}</p>`;
          Memory.push("bot", html, null);
          return { html, suggestions: [] };
        } else {
          Memory.setStage("close");
          const html = whatsAppCTA(Memory.getName(), Memory.getNeed());
          Memory.push("bot", html, "close");
          return { html, suggestions: ["📱 Open WhatsApp", "🛠️ Other Services"] };
        }
      } else {
        // Not ready — keep exploring
        const html = "<p>No problem! 😊 What else can I help clarify?</p>";
        Memory.push("bot", html, null);
        return {
          html,
          suggestions: ["💰 Pricing", "⏱ Turnaround", "🛡️ Our Guarantee", "📞 Contact Team"],
        };
      }
    }

    // ── STEP 3: Classify intent ──────────────────────────────────────────
    const { ranked, scores } = classify(rawInput);
    const THRESHOLD = 1.5;

    // ── STEP 4: Frustrated user — escalate fast ──────────────────────────
    if (sent === -1 && (ranked.length === 0 || ranked[0].score < THRESHOLD)) {
      Memory.push("bot", "", "contact");
      return {
        html: buildHTML({
          text: "I can hear this is frustrating — let's get you to the right person right away. 😔",
          details: [
            "📱 **WhatsApp: +27 720 465 993** ← fastest",
            "📧 **Email: mellowtech@email.com**",
          ],
          note: "They'll get you sorted quickly.",
        }),
        suggestions: ["📞 Contact Team Now", "🛠️ Browse Services"],
      };
    }

    // ── STEP 5: No confident match — follow-up or fallback ───────────────
    if (ranked.length === 0 || ranked[0].score < THRESHOLD) {
      if (Memory.isShortOrAffirm(rawInput) && Memory.getLast()) {
        return resolveService(Memory.getLast(), entities, sent);
      }
      return fallback(rawInput);
    }

    const topIntent = ranked[0].intent;

    // ── STEP 6: Greeting ─────────────────────────────────────────────────
    if (topIntent === "greeting") {
      Memory.setStage("discovery");
      const html = `<p>${rand(GREETINGS)}</p>`;
      Memory.push("bot", html, "greeting");
      return {
        html,
        suggestions: ["🌐 Website", "📄 CV", "💻 PC Repair", "🎨 Design", "📝 Assignment", "💰 Pricing"],
      };
    }

    // ── STEP 7: Pricing intent ───────────────────────────────────────────
    if (topIntent === "pricing") {
      Memory.push("bot", "", "pricing");
      const res = pricingResponse();
      return res;
    }

    // ── STEP 8: Contact intent ───────────────────────────────────────────
    if (topIntent === "contact") {
      Memory.push("bot", "", "contact");
      return contactResponse();
    }

    // ── STEP 9: Disambiguation ───────────────────────────────────────────
    // Design vs Web
    if ((scores.design || 0) >= 2 && (scores.web || 0) >= 2) {
      Memory.setPending({
        type: "disambig",
        options: { "🎨 Graphic Design": "design", "🌐 Website": "web" }
      });
      return {
        html: "<p>Just to point you in the right direction — are you looking for <strong>graphic design</strong> (logos, flyers) or a <strong>website</strong>?</p>",
        suggestions: ["🎨 Graphic Design", "🌐 Website"],
      };
    }
    // Windows vs Troubleshoot
    if ((scores.windows || 0) >= 2 && (scores.troubleshoot || 0) >= 2) {
      const w = scores.windows, t = scores.troubleshoot;
      if (Math.abs(w - t) <= 3) {
        Memory.setPending({
          type: "disambig",
          options: { "💻 Fresh Windows Install": "windows", "🔧 Diagnose & Fix First": "troubleshoot" }
        });
        return {
          html: "<p>For your PC — would you prefer a <strong>fresh Windows reinstall</strong>, or should we <strong>diagnose and fix</strong> the issue first without formatting?</p>",
          suggestions: ["💻 Fresh Windows Install", "🔧 Diagnose & Fix First"],
        };
      }
    }

    // ── STEP 10: Service intent → value delivery + qualify ───────────────
    if (SERVICE_INTENTS.has(topIntent)) {
      const res = buildServiceResponse(topIntent, entities);
      if (res) {
        Memory.push("bot", res.html, topIntent);

        // After value delivery: if we have name + need, show soft close
        const name = Memory.getName();
        const need = Memory.getNeed();
        if (name && need) {
          Memory.setStage("close");
          const waHtml = whatsAppCTA(name, need);
          Memory.push("bot", waHtml, "close");
          return {
            html: res.html + waHtml,
            suggestions: ["📱 Open WhatsApp", "💰 Pricing", "🛠️ Other Services"],
          };
        }

        // Soft close if we have a need but no name yet
        if (need && !Memory.askedNameBefore()) {
          Memory.setPending({ type: "confirm_close" });
          return {
            html: res.html + `<p class="mwt-followup">Ready to get this started? 🚀</p>`,
            suggestions: ["✅ Yes, let's go!", "💰 Tell Me More / Pricing", "🛠️ Show Other Services"],
          };
        }

        return res;
      }
    }

    // ── STEP 11: Default fallback ─────────────────────────────────────────
    return fallback(rawInput);
  }

  function resolveService(intentKey, entities, sentiment) {
    if (intentKey === "pricing") return pricingResponse();
    if (intentKey === "contact") return contactResponse();

    const svc = KB[intentKey];
    if (!svc) return fallback("");

    let res;
    if (SERVICE_INTENTS.has(intentKey)) {
      res = buildServiceResponse(intentKey, entities);
    }
    if (!res) return fallback("");

    let html = res.html;
    if (sentiment === -1) {
      html = `<p>I understand this is stressful — let me get you the right info. 👇</p>` + html;
    }

    Memory.push("bot", html, intentKey);
    return { html, suggestions: res.suggestions };
  }

  // ── Export process() ──────────────────────────────────────────────────
  root.MellowTechBot = { process };

}(window));


// ══════════════════════════════════════════════════════════════════════════
//  MODULE 9 — UI ADAPTER
// ══════════════════════════════════════════════════════════════════════════
window.UI = (function () {

  const SEL = {
    panel:    "#mtPanel",
    messages: "#mtBody",
    input:    "#mtInput",
    button:   ".mt-send",
    typing:   "#mtTyping",
    openBtn:  ".mt-open-btn",
    closeBtn: ".mt-close-btn",
  };

  const $ = (s) => { try { return s ? document.querySelector(s) : null; } catch(e) { return null; } };

  let welcomed = false;

  // Greeting messages with buying intent chip shown up front
  const WELCOME_CHIPS = [
    "🌐 Website",
    "📄 CV Help",
    "💻 PC Repair",
    "🎨 Design",
    "📝 Assignment",
    "💰 Pricing",
  ];

  function init() {
    try {
      injectStyles();

      const panel  = $(SEL.panel);
      const input  = $(SEL.input);
      const button = $(SEL.button);

      if (!panel || !input || !button) {
        console.warn("MellowTech Chat: UI elements missing — skipping init.");
        return;
      }

      // Open chatbot
      const openBtn = $(SEL.openBtn);
      if (openBtn) {
        openBtn.addEventListener("click", () => {
          panel.style.display = "flex";
          setTimeout(() => input.focus(), 100);
          if (!welcomed) {
            welcomed = true;
            botHTML(
              `<p>Hey! 👋 Welcome to <strong>Mellow Tech</strong>.</p><p>What can I help you with today?</p>`,
              WELCOME_CHIPS
            );
          }
        });
      }

      // Close chatbot
      const closeBtn = $(SEL.closeBtn);
      if (closeBtn) {
        closeBtn.addEventListener("click", () => { panel.style.display = "none"; });
      }

      // Send on button click
      button.addEventListener("click", send);

      // Send on Enter (Shift+Enter = newline)
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      });

      // Auto-resize textarea
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 90) + "px";
      });

      // Delegated chip/suggestion click handler
      document.addEventListener("click", (e) => {
        const chip = e.target.closest(".mt-chip");
        if (chip) {
          const txt = chip.dataset.chip || chip.textContent.trim();
          handle(txt);
        }
      });

    } catch (err) {
      console.error("MellowTech UI init failed:", err);
    }
  }

  function send() {
    const input = $(SEL.input);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    handle(text);
  }

  function handle(text) {
    user(text);
    typing(true);

    // Realistic typing delay (longer for longer responses)
    const delay = 350 + Math.min(text.length * 8, 900);

    setTimeout(() => {
      typing(false);
      let res;
      try {
        res = window.MellowTechBot.process(text);
      } catch (err) {
        console.error("MellowTechBot error:", err);
        botHTML("<p>Something went wrong — please try again or WhatsApp us at +27 720 465 993 📱</p>", []);
        return;
      }
      botHTML(res.html, res.suggestions || []);
    }, delay);
  }

  function user(text) {
    const box = $(SEL.messages);
    if (!box) return;
    box.insertAdjacentHTML("beforeend",
      `<div class="mwt-msg mwt-user"><div class="mwt-bubble">${esc(text)}</div></div>`
    );
    scroll();
  }

  function botHTML(html, suggestions = []) {
    const box = $(SEL.messages);
    if (!box) return;

    box.insertAdjacentHTML("beforeend",
      `<div class="mwt-msg mwt-bot"><div class="mwt-bubble">${html}</div></div>`
    );

    if (suggestions?.length) {
      const chips = suggestions
        .map(s => `<button class="mt-chip" data-chip="${esc(s)}">${esc(s)}</button>`)
        .join("");
      box.insertAdjacentHTML("beforeend",
        `<div class="mwt-suggestions">${chips}</div>`
      );
    }

    scroll();
  }

  function typing(show) {
    const t = $(SEL.typing);
    if (t) t.style.display = show ? "flex" : "none";
  }

  function scroll() {
    const box = $(SEL.messages);
    if (box) setTimeout(() => { box.scrollTop = box.scrollHeight; }, 20);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, m =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])
    );
  }

  function injectStyles() {
    if (document.getElementById("mwt-styles")) return;
    const s = document.createElement("style");
    s.id = "mwt-styles";
    s.textContent = `
      .mwt-msg{display:flex;margin:6px 0;animation:mwt-fadein .25s ease}
      @keyframes mwt-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      .mwt-user{justify-content:flex-end}
      .mwt-bot{justify-content:flex-start}
      .mwt-bubble{padding:10px 13px;border-radius:14px;max-width:84%;font-size:12.5px;line-height:1.65;word-break:break-word}
      .mwt-user .mwt-bubble{background:#1e1e30;color:#e8e8f0;border-top-right-radius:4px}
      .mwt-bot .mwt-bubble{background:#0f1a16;border:1px solid rgba(0,229,160,0.12);color:#e8e8f0;border-top-left-radius:4px}
      .mwt-bubble p{margin:0 0 6px 0}
      .mwt-bubble p:last-child{margin-bottom:0}
      .mwt-list{padding-left:0;list-style:none;margin:8px 0 0 0}
      .mwt-list li{padding:3px 0;font-size:12px;line-height:1.6}
      .mwt-meta{display:flex;gap:12px;margin-top:8px;flex-wrap:wrap}
      .mwt-meta span{font-size:11px;opacity:.8}
      .mwt-note{font-size:11px;opacity:.7;margin-top:8px;font-style:italic}
      .mwt-followup{margin-top:10px;font-size:12px;opacity:.85}
      .mwt-result{font-size:11.5px;color:#00e5a0;margin-top:8px}
      .mwt-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:6px 4px 2px 4px}
      .mt-chip{background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.22);
        color:#a8f0d8;font-size:11px;padding:5px 10px;border-radius:20px;cursor:pointer;
        transition:all .18s ease;white-space:nowrap;font-family:inherit}
      .mt-chip:hover{background:rgba(0,229,160,0.18);border-color:rgba(0,229,160,0.45);color:#e8fff5}
      .mwt-bubble a{color:#4bcffa;text-decoration:underline}
      .mwt-bubble strong{color:#fff}
    `;
    document.head.appendChild(s);
  }

  return { init };

})();


// ══════════════════════════════════════════════════════════════════════════
//  MODULE 10 — BOOTSTRAP
// ══════════════════════════════════════════════════════════════════════════
(function () {
  function bootUI() {
    if (window.UI && typeof window.UI.init === "function") {
      window.UI.init();
    } else {
      console.warn("MellowTech: UI not ready at boot time.");
    }
  }
  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootUI);
    } else {
      bootUI();
    }
  } catch (e) {
    console.error("MellowTech UI bootstrap failed:", e);
  }
})();
