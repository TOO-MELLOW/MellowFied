/* ═══════════════════════════════════════════════════
JAVASCRIPT — NAV / MOBILE MENU / REVEAL / TABS
(unchanged from original)
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


/* ═══════════════════════════════════════════════════════════════════════════
   MELLOW TECH SERVICES — INTELLIGENT SALES BOT v4.0
   mellowtech-salesbot.js

   WHAT'S NEW IN v4:
   • Context-aware pricing — "how much" resolves against lastIntent first
   • Multi-service basket — tracks every service mentioned, smart close
   • 3× wider signal lists with SA slang, broken English, natural speech
   • Smarter fallback — partial match suggestions, never a dead-end
   • Name collected once, stored, pre-fills WhatsApp with full basket
   • Basket close — "I see you need CV + Windows — want both or just one?"
════════════════════════════════════════════════════════════════════════════ */

;(function (root) {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 1 — NLP PIPELINE (expanded)
  // ══════════════════════════════════════════════════════════════════════════
  const NLP = (() => {

    // Slang / abbreviation / typo expansions — sorted longest-first for safe replacement
    const RAW_EXP = {
      // ── Greetings & openers
      "howzit":"hello","haai":"hello","hie":"hello","heita":"hello",
      "sawubona":"hello","dumela":"hello","hola":"hello","sup":"hello",
      "yo":"hello","hey there":"hello","morning":"hello","afternoon":"hello",
      "evening":"hello","good day":"hello","greetings":"hello",
      "hi there":"hello","what's good":"hello","wassup":"hello",

      // ── Affirmations / negations
      "ja":"yes","yebo":"yes","ewe":"yes","yep":"yes","yup":"yes","yeah":"yes",
      "nee":"no","aikona":"no","nah":"no","nope":"no","no ways":"no",

      // ── Contractions
      "wont":"will not","dont":"do not","cant":"cannot","im":"i am",
      "ive":"i have","theres":"there is","whats":"what is","hows":"how is",
      "id":"i would","ill":"i will","its":"it is","doesnt":"does not",
      "havent":"have not","isnt":"is not","arent":"are not","wasnt":"was not",

      // ── Text speak / chat shorthand
      "ur":"your","u":"you","r":"are","b":"be","2":"to","4":"for",
      "pls":"please","plz":"please","asap":"urgent now","rn":"right now",
      "btw":"by the way","tbh":"to be honest","lol":"","lmk":"let me know",
      "dm":"contact","msg":"message","txt":"text","ngl":"honestly",
      "nvm":"never mind","omg":"wow","smh":"frustrated","imo":"i think",

      // ── Tech terms
      "reinstall":"install windows","reformat":"format windows",
      "wipe pc":"format windows","wipe laptop":"format windows",
      "wipe my pc":"format windows","wipe my laptop":"format windows",
      "format my laptop":"format windows","format my pc":"format windows",
      "os":"operating system windows","bsod":"blue screen crash error",
      "lagging":"slow performance","lag":"slow","hanging":"freezing",
      "ram":"memory performance","hdd":"hard drive storage",
      "ssd":"storage performance","wifi":"internet connection",
      "internet not working":"connection troubleshoot",
      "no internet":"connection troubleshoot",
      "driver":"software driver install","drivers":"software driver install",
      "printer":"printer install setup","antivirus":"virus protection install",
      "pop ups":"malware virus","popups":"malware virus","ads popping":"malware virus",

      // ── SA business / social context
      "lekker":"good","bra":"friend","sisi":"friend","china":"friend",
      "spaza":"small business","hustle":"business","side hustle":"business",
      "smme":"small business","sme":"small business","startup":"new business",
      "jozi":"johannesburg","pta":"pretoria","limpopo":"polokwane",
      "kasi":"township community","location":"area",

      // ── CV synonyms (expanded)
      "curriculum vitae":"cv","resume":"cv","job application cv":"cv job",
      "cover letter":"cv job","job profile":"cv","my cv":"cv",
      "need a cv":"cv","want a cv":"cv","cv done":"cv",
      "cv written":"cv","write my cv":"cv","create cv":"cv",
      "new cv":"cv","cv help":"cv","fix my cv":"cv","update cv":"cv",
      "my resume":"cv","job search":"cv job","job hunting":"cv job",
      "looking for work":"cv job","need work":"cv job","finding a job":"cv job",
      "applying for a job":"cv job","job apps":"cv job",
      "getting interviews":"cv","no interviews":"cv","not getting called":"cv",
      "no call backs":"cv","not hearing back":"cv",

      // ── Assignment synonyms (expanded)
      "prac":"practical assignment","tut":"tutorial assignment",
      "due":"deadline assignment","referencing":"citation formatting",
      "unisa":"university assignment","tvet":"college assignment",
      "assignment due":"assignment deadline","homework":"assignment",
      "research paper":"assignment essay","essay help":"assignment",
      "formatting":"assignment format","apa":"assignment apa format",
      "harvard":"assignment harvard format","mla":"assignment mla format",
      "cite":"citation formatting","citations":"citation formatting",
      "references":"citation formatting","bibliography":"citation formatting",
      "school work":"assignment","varsity work":"assignment",
      "uni work":"assignment","college work":"assignment",
      "failing":"assignment help","lecturer":"assignment help",
      "marks dropping":"assignment help","bad marks":"assignment help",

      // ── Windows synonyms (expanded)
      "windos":"windows","widows":"windows","winows":"windows",
      "window":"windows","os install":"windows install","operating system":"windows install",
      "fresh install":"windows install","clean install":"windows install",
      "factory reset":"windows reset","reset pc":"windows reset","reset laptop":"windows reset",
      "wont boot":"windows boot error","wont start":"windows boot error",
      "not booting":"windows boot error","no os":"windows install",
      "corrupt windows":"windows repair","corrupted windows":"windows repair",
      "windows update":"windows repair","stuck on update":"windows repair",
      "activation":"windows activate","not activated":"windows activate",
      "activate my pc":"windows activate","license":"windows license",
      "product key":"windows license","windows key":"windows license",
      "second hand laptop":"windows install","bought a laptop":"windows install",
      "new laptop":"laptop setup","new pc":"laptop setup",
      "got a laptop":"laptop setup","just got a laptop":"laptop setup",

      // ── Design synonyms (expanded)
      "grafic":"graphic","desing":"design","dessign":"design",
      "graphic design":"design","logo":"logo design","flyer":"flyer design",
      "poster":"poster design","branding":"brand design",
      "brand":"brand design","social media post":"social media design",
      "insta post":"social media design","ig post":"social media design",
      "facebook post":"social media design","fb post":"social media design",
      "banner":"banner design","business card":"business card design",
      "letterhead":"letterhead design","company profile":"brand design",
      "marketing material":"design","pamphlet":"flyer design",
      "leaflet":"flyer design","signage":"design",

      // ── Office synonyms (expanded)
      "ofice":"office","excell":"excel","powerponit":"powerpoint",
      "ms office":"microsoft office","ms word":"microsoft office",
      "microsoft word":"microsoft office","word document":"microsoft office",
      "need word":"microsoft office","need excel":"microsoft office",
      "install word":"microsoft office","install excel":"microsoft office",
      "365":"microsoft office","office 365":"microsoft office",
      "microsoft 365":"microsoft office","outlook email":"microsoft office",

      // ── Website synonyms (expanded)
      "websit":"website","web site":"website","sight":"website",
      "online shop":"website ecommerce","online store":"website ecommerce",
      "ecommerce":"website ecommerce","sell online":"website ecommerce",
      "shopify":"website ecommerce","woocommerce":"website ecommerce",
      "portfolio":"website portfolio","landing page":"website landing",
      "one pager":"website landing","web presence":"website",
      "go online":"website","get online":"website","appear online":"website",
      "my own website":"website","personal website":"website",
      "need a website":"website","want a website":"website",
      "business website":"website business","company website":"website business",

      // ── Business digital synonyms
      "google maps":"google business listing","google listing":"google business listing",
      "appear on google":"google business listing","google my business":"google business listing",
      "business email":"business digital email","professional email":"business digital email",
      "email address":"business digital email","domain":"domain registration",
      "website domain":"domain registration","register domain":"domain registration",
      "whatsapp business":"business digital whatsapp",
      "business whatsapp":"business digital whatsapp",
      "facebook page":"business digital facebook","instagram page":"business digital instagram",
      "social media setup":"business digital social","go digital":"business digital",
      "take my business online":"business digital","online presence":"business digital",

      // ── Troubleshoot synonyms (expanded)
      "buisness":"business","bussiness":"business","bizness":"business",
      "develoment":"development","devlopment":"development",
      "slow computer":"pc slow","slow laptop":"pc slow","sluggish":"pc slow",
      "taking forever":"pc slow","freezes":"pc freezing","frozen":"pc freezing",
      "keeps freezing":"pc freezing","crashing":"pc crash","keeps crashing":"pc crash",
      "random shutdown":"pc crash","black screen":"pc crash","blue screen":"pc crash",
      "weird noises":"pc hardware issue","fan loud":"pc hardware issue",
      "overheating":"pc overheating","getting hot":"pc overheating",
      "virus":"malware virus","malware":"malware virus","hacked":"malware virus",
      "ransomware":"malware virus","suspicious":"malware virus",
      "something wrong with pc":"pc troubleshoot","something wrong with laptop":"pc troubleshoot",
      "pc acting up":"pc troubleshoot","laptop acting up":"pc troubleshoot",
      "not working properly":"pc troubleshoot","behaving weird":"pc troubleshoot",
      "needs repair":"pc repair","fix my laptop":"pc repair","fix my computer":"pc repair",
      "broken laptop":"pc repair","broken pc":"pc repair",

      // ── Payment / pricing phrases
      "eft":"bank transfer payment","rands":"price cost","rand":"price cost",
      "payment plan":"payment","pay later":"payment","instalment":"payment",
      "deposit":"payment","pay upfront":"payment",
      "how much does it cost":"pricing","what does it cost":"pricing",
      "what are your prices":"pricing","whats the price":"pricing",
      "price list":"pricing","all prices":"pricing","your rates":"pricing",
      "affordable":"pricing affordable","cheap":"pricing affordable",
      "student price":"pricing student","student discount":"pricing student",
      "student rate":"pricing student","im a student":"pricing student",
      "broke":"pricing affordable","tight budget":"pricing affordable",
      "dont have much":"pricing affordable",
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
      "get","need","want","like","help","make","give","see","use",
    ]);

    function tokenize(text) {
      return normalize(text).split(" ")
        .filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    const NEG_PHRASES = [
      "not working","broken","useless","frustrated","angry","terrible",
      "rubbish","hate","nothing works","waste","worst","problem","issue",
      "failed","doesn't work","wasted","annoyed","sick of","fed up","scam",
      "this is kak","kak service","useless","pathetic","not helping",
      "doesn't make sense","confused","lost","don't understand",
    ];
    const POS_PHRASES = [
      "thanks","thank you","great","awesome","perfect","love","excellent",
      "amazing","fantastic","helpful","wonderful","appreciate","brilliant",
      "lekker","nice one","sharp","dankie","baie dankie","sorted","eish good",
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
      "got","have","has","get","give","make","use","take","come","go","see",
    ]);

    function extractName(text) {
      const patterns = [
        /my name is ([A-Za-z]{2,20})/i,
        /i(?:'m| am) ([A-Za-z]{2,20})/i,
        /call me ([A-Za-z]{2,20})/i,
        /it's ([A-Za-z]{2,20})/i,
        /they call me ([A-Za-z]{2,20})/i,
        /^([A-Za-z]{2,20})$/i,
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
      { re: /\b(today|tonight|now|asap|urgent|immediately|right now|right away|straight away)\b/i, label: "TODAY" },
      { re: /\b(tomorrow|tmrw|tom)\b/i,                                                           label: "TOMORROW" },
      { re: /\bin (\d+)\s*(hour|hours|hr|hrs)\b/i,                                                label: "HOURS" },
      { re: /\bin (\d+)\s*(day|days)\b/i,                                                         label: "DAYS" },
      { re: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,                    label: "WEEKDAY" },
      { re: /\b(this week|next week|end of week|by friday|by monday)\b/i,                         label: "WEEK" },
    ];

    function extractDeadline(text) {
      for (const { re, label } of DEADLINE_RE) {
        const m = text.match(re);
        if (m) return { match: m[0], urgency: label };
      }
      return null;
    }

    // Extract partial/fuzzy service hints from free text
    function extractPartialHints(norm) {
      const hints = [];
      const MAP = {
        web:          ["web","site","online","page","seo","domain","ecommerce","shop"],
        cv:           ["cv","resume","job","interview","apply","work","employ"],
        assignment:   ["assignment","essay","format","apa","harvard","cite","submit","marks","uni","varsity","college","school"],
        windows:      ["windows","install","format","boot","activate","license","key","os","laptop","pc","computer"],
        troubleshoot: ["slow","virus","crash","freeze","repair","diagnose","problem","broken","fix"],
        design:       ["logo","flyer","poster","design","brand","graphic","social","banner","card"],
        office:       ["office","word","excel","powerpoint","outlook","365","microsoft"],
        business:     ["google","maps","email","domain","facebook","instagram","whatsapp","digital","online"],
      };
      for (const [intent, keywords] of Object.entries(MAP)) {
        const matches = keywords.filter(k => norm.includes(k)).length;
        if (matches >= 1) hints.push({ intent, matches });
      }
      return hints.sort((a,b) => b.matches - a.matches);
    }

    return { normalize, tokenize, sentiment, extractName, extractDeadline, extractPartialHints };
  })();


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 2 — KNOWLEDGE BASE (3× expanded signals)
  // ══════════════════════════════════════════════════════════════════════════
  const KB = {

    greeting: {
      signals: [
        "hello","hi","hey","good morning","good afternoon","good evening",
        "howzit","heita","sawubona","dumela","hola","greetings","start",
        "good day","morning","afternoon","evening","hi there","hey there",
        "what's good","wassup","yo","sup","haai","hie",
        "can you help","i need help","help me","help please",
        "is anyone there","hello anyone","anybody there","hello mellow",
      ],
      score_boost: 3,
    },

    web: {
      signals: [
        // Core
        "website","web development","web design","build a site","create a website",
        "need a website","business website","portfolio website","landing page",
        "online store","ecommerce","web page","web app","responsive site",
        "website for my business","website for my brand","seo website",
        "website is slow","website not working","website redesign","update website",
        "new website","website development","build site","make website",
        "online presence website","web presence",
        // Natural / conversational
        "i need a site","i want a website","build me a website","make me a site",
        "how much is a website","website price","website cost","how much website",
        "can you build me a website","can you make a website","do you make websites",
        "create a site for me","design a website","design my website",
        "fix my website","my website is not working","website is broken",
        "get me online","take me online","appear online","go online",
        "i want to go online","i need to go online","business online",
        "my business needs a website","i have a business need website",
        // SA slang / broken English
        "bra i need a site","sisi i need a website","lekker website",
        "nice website","clean website","professional website","cheap website",
        "affordable website","student website","small business website",
        "startup website","sell online","i want to sell online",
        // Specific types
        "portfolio site","personal site","ecommerce site","shop online",
        "online shop","booking website","appointment website","menu website",
        "restaurant website","hair salon website","nails website",
        "shop website","store website","product website",
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
        // Core
        "cv","resume","curriculum vitae","job application","cover letter",
        "cv design","design my cv","cv revamp","update my cv","new cv",
        "cv from scratch","cv looks bad","not getting interviews","no callbacks",
        "applying for jobs","job hunting","interview cv","graduate cv",
        "entry level cv","career change cv","ats cv","linkedin profile",
        "need a job","job seeker","cv help","professional cv",
        // Natural / conversational
        "help me with my cv","fix my cv","my cv is bad","i need a cv",
        "write my cv","create my cv","build my cv","redo my cv",
        "can you do my cv","can you make a cv","make me a cv",
        "how much is a cv","cv price","cv cost","how much for a cv",
        "i'm looking for work","i'm job hunting","i need to find work",
        "i want a new job","i'm applying for jobs","i keep applying but nothing",
        "nobody calls me back","not getting responses","sending cvs not getting replies",
        "my cv is old","my cv needs updating","i haven't updated my cv",
        // SA slang / broken English
        "bra help me with cv","my cv is kak","cv is rubbish",
        "need work bra","looking for a job sisi","i need cv done",
        "do my cv for me","sort out my cv","do my resume","fix my resume",
        "no one is hiring me","jobs not coming","struggling to find work",
        "just graduated","matric certificate","matric cv","grade 12 cv",
        "first time cv","never had a job cv","first job cv",
        "i want to change jobs","i am tired of my job","changing career",
        // Specific types
        "nursing cv","teaching cv","it cv","engineering cv","admin cv",
        "call centre cv","driver cv","security cv","warehouse cv",
        "construction cv","sales cv","marketing cv","accounting cv",
        "graduate cv","student cv","intern cv","internship cv",
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
        // Core
        "assignment","assignment help","assignment assistance","format assignment",
        "proofread","essay","research paper","academic writing","apa format",
        "harvard referencing","mla format","citation","referencing style",
        "fix references","deadline assignment","submit assignment","academic help",
        "university assignment","college assignment","tvet","unisa","school work",
        "struggling with assignment","formatting help","assignment due","marks",
        "lecturer said","wrong format",
        // Natural / conversational
        "help me with my assignment","do my assignment","can you help with assignment",
        "format my assignment","fix my assignment","proofread my essay",
        "how much to format assignment","assignment price","cost of assignment help",
        "my assignment is due","assignment is due tomorrow","due tonight",
        "i have an assignment due","submitting assignment","need to submit",
        "my lecturer said format is wrong","wrong referencing","bad references",
        "my marks are dropping","failing because of format","lost marks for formatting",
        "apa is confusing","harvard is confusing","don't know how to reference",
        "i don't know how to cite","i can't do apa","help with apa",
        // SA slang / broken English
        "bra help with prac","my assignment is kak","need help with my work",
        "unisa assignment help","tvet assignment","varsity assignment",
        "school essay","matric essay","matric assignment","grade 12 essay",
        "class assignment","module assignment","sem assignment",
        "research assignment","literature review","dissertation","thesis help",
        "prac report","lab report","case study","group assignment",
        "last minute assignment","urgent assignment","late assignment",
        // Specific
        "apa 7","apa 6","harvard style","chicago style","mla format",
        "table of contents","page numbering","margins","font size formatting",
        "bibliography","works cited","in text citation","footnotes",
        "abstract writing","methodology","introduction help","conclusion help",
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
        // Core
        "install windows","reinstall windows","windows installation","clean install",
        "format pc","format laptop","fresh install","windows 10","windows 11",
        "activate windows","windows activation","windows license","expired license",
        "blue screen","bsod","pc won't boot","laptop won't start","won't turn on",
        "boot loop","no operating system","no os","new laptop setup",
        "second hand laptop","bought a laptop","corrupted windows","windows is broken",
        "windows not working","factory reset","os installation",
        // Natural / conversational
        "install windows for me","put windows on my laptop","put windows on my pc",
        "how much to install windows","windows installation price","format pc price",
        "my windows is not working","windows messed up","windows giving problems",
        "windows keeps crashing","windows blue screen","getting blue screen",
        "my laptop wont start","my pc wont start","pc wont turn on","laptop wont turn on",
        "stuck on loading screen","stuck on windows logo","won't get past loading",
        "needs a fresh install","fresh windows","clean windows","new windows",
        "activate my laptop","windows not activated","says not activated",
        "windows watermark","watermark on desktop","not genuine windows",
        "windows expired","trial expired","windows trial","need genuine windows",
        // SA slang / broken English
        "bra my windows is broken","my pc is broken windows","laptop has no windows",
        "format my lappy","format my machine","lappy wont boot","machine wont start",
        "my comp needs windows","pc needs formatting","laptop needs formatting",
        "second hand pc need windows","bought pc no windows","no os on laptop",
        "my screen went blue","blue screen of death","bsod error",
        // Specific
        "windows 10 install","windows 11 install","win 10","win 11",
        "w10","w11","64 bit windows","32 bit windows","windows home","windows pro",
        "dell windows install","hp windows install","lenovo windows install",
        "acer windows install","asus windows install","samsung windows install",
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
        // Core
        "pc is slow","laptop is slow","computer is slow","slow boot","slow startup",
        "running slow","virus","malware","ransomware","suspicious popups","random ads",
        "crashing","laptop crashing","keeps crashing","random shutdown","black screen",
        "freezing","not responding","computer hangs","blue screen","bsod error",
        "error message","overheating","diagnose pc","fix my pc","pc repair",
        "pc not working","broken","something wrong","computer problems",
        "laptop problems","tech support","repair","help with pc","help with laptop",
        // Natural / conversational
        "my pc is acting up","my laptop is acting up","something wrong with my pc",
        "something is wrong with my laptop","my computer is doing weird things",
        "pc is giving me problems","laptop is giving me problems",
        "help me fix my pc","help me fix my laptop","can you fix my pc",
        "how much to fix pc","pc repair price","laptop repair price",
        "diagnose my laptop","check my pc","scan my laptop","clean my pc",
        "my pc is very slow","so slow it's painful","takes forever to load",
        "internet is slow on my pc","wifi slow on laptop","downloads slow",
        "apps crashing","programs crashing","keeps closing by itself","shuts down randomly",
        "overheating laptop","laptop is hot","fan running loud","strange noises",
        "black screen of death","blank screen","display not working","no display",
        "cursor freezing","mouse not working","keyboard not working","trackpad frozen",
        // SA slang / broken English
        "my lappy is slow","my machine is slow","comp is slow","pc is kak slow",
        "my pc is proper slow","super slow bra","running like a snail",
        "got a virus bra","i think i have a virus","think its hacked",
        "laptop feels heavy","comp feels laggy","pc hangs a lot",
        "gets hot all the time","burning hot laptop","laptop shuts off by itself",
        "random popups","weird ads","ads everywhere","browser hijacked",
        "lost files","missing files","deleted files","recover files",
        // Specific
        "startup repair","windows repair","disk cleanup","registry clean",
        "defrag","disk full","storage full","c drive full","no space",
        "memory leak","high cpu usage","100 percent cpu","cpu at 100",
        "ram full","memory full","high memory usage","task manager shows",
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
        // Core
        "graphic design","logo","logo design","company logo","flyer","poster",
        "flyer design","poster design","social media graphics","instagram graphics",
        "facebook graphics","banner design","business card","letterhead","branding",
        "brand identity","brand design","marketing materials","visual identity",
        "creative design","design work","need a design",
        // Natural / conversational
        "design me a logo","make me a logo","create a logo","logo for my business",
        "i need a logo","how much is a logo","logo price","logo cost",
        "design a flyer","make a flyer","create a flyer","flyer for my business",
        "design a poster","make a poster","create a poster",
        "social media posts design","design my socials","content for socials",
        "instagram content","facebook content","social media content",
        "design my brand","rebrand my business","brand package",
        "business card design","make business cards","print ready files",
        "company letterhead","email signature design","company profile design",
        // SA slang / broken English
        "bra design me a logo","lekker logo","nice logo","clean logo",
        "professional logo","cheap logo","affordable logo","student logo",
        "logo for my spaza","logo for my salon","logo for my business bra",
        "i need something to post","need a flyer for my event","event flyer",
        "birthday flyer","party flyer","church flyer","funeral flyer",
        "hair salon flyer","nail salon flyer","braids flyer","food flyer",
        "music flyer","dj flyer","promoter flyer","club night flyer",
        // Specific
        "vector logo","png logo","jpg logo","transparent logo","svg logo",
        "full colour logo","black and white logo","flat logo","3d logo",
        "animated logo","logo revamp","redesign logo","update logo",
        "a4 flyer","a5 flyer","square flyer","digital flyer","print flyer",
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
        // Core
        "microsoft office","install office","ms office","office setup",
        "word and excel","word excel powerpoint","outlook","microsoft 365",
        "office 365","install word","install excel","install powerpoint",
        "office activation","office not working","office expired","cant open word",
        "cant open excel",
        // Natural / conversational
        "install microsoft office for me","put office on my laptop","put office on my pc",
        "how much to install office","office installation price","office price",
        "my office is not working","word is not working","excel is not working",
        "office keeps crashing","word keeps crashing","office is expired",
        "office says trial","trial has ended","30 day trial expired",
        "i need word and excel","i need microsoft","i need office suite",
        "i need powerpoint","can you install office","do you install office",
        // SA slang / broken English
        "bra install office for me","need word bra","put office on my lappy",
        "my word is not opening","my excel wont open","word has an error",
        "i just need word","i just need excel","i just need powerpoint",
        "student needs office","i'm a student need office","uni needs office",
        // Specific
        "office home","office professional","office home and student",
        "office 2019","office 2021","office 2024","office ltsc",
        "remote office install","online office install","screen share office",
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
        // Core
        "business digital setup","take business online","go digital","digital presence",
        "online presence","google business","google maps","appear on google",
        "business email","professional email","email domain","domain name",
        "register domain","facebook business","instagram business","whatsapp business",
        "social media for business","small business setup","startup setup",
        "new business","business whatsapp",
        // Natural / conversational
        "set up my business online","take my business online","go online with my business",
        "i need a professional email","i need a business email","create a business email",
        "how much is a business email","email with my domain","yourname at yourbusiness",
        "i want to appear on google","google listing for my business","google maps listing",
        "verify my business on google","google my business setup","gmb setup",
        "create a facebook page","make a facebook page","facebook for my business",
        "instagram for my business","instagram page for my business",
        "set up whatsapp business","whatsapp business setup","business whatsapp profile",
        "i need a domain","buy a domain","register a domain","get a domain name",
        "domain and email","domain name and hosting","get my business online",
        // SA slang / broken English
        "bra i need my business online","take my spaza online","get my hustle online",
        "i'm starting a business need setup","new business need digital","startup setup",
        "salon needs facebook page","hair salon online","nails business online",
        "food business online","catering business online","cleaning business online",
        "tutoring business online","freelance business setup","contractor business online",
        // Specific
        "google workspace","gsuite","microsoft 365 business","business hosting",
        "shared hosting","cpanel hosting","website hosting","email hosting",
        "ssl certificate","https setup","secure website","business instagram",
        "tiktok business","linkedin company page","youtube business channel",
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
        "how much do you charge","what are your rates","is it expensive",
        "is it cheap","can i afford","budget friendly","any discounts",
        "payment options","can i pay","how do i pay","payment methods",
        "do you have a price list","show me prices","what do you charge",
        "can i get a quote","give me a quote","need a quote","free quote",
        "estimate","ballpark","rough price","price range","starting price",
        "minimum price","how much minimum","how much maximum",
      ],
    },

    contact: {
      signals: [
        "contact","whatsapp","phone","call","email","speak to someone","talk to",
        "reach you","book","schedule","appointment","human","real person",
        "team","contact details","how to reach","where to contact",
        "talk to a person","talk to someone","speak to a human","speak to a person",
        "call you","phone you","whatsapp you","message you","send you a message",
        "what is your number","your phone number","your whatsapp number",
        "your email address","how do i contact you","how can i reach you",
        "where are you","are you in polokwane","polokwane office",
        "can i come in","walk in","in person","come to you","your address",
        "working hours","when are you open","hours","open on weekends",
        "do you work on weekends","saturday","sunday","after hours",
      ],
    },
  };


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 3 — INTENT CLASSIFIER (unchanged core, improved scoring)
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
        if (norm.includes(sn)) {
          score += sn.split(" ").length * 2.5;
        }
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
  //  MODULE 4 — CONVERSATION MEMORY (upgraded with serviceBasket)
  // ══════════════════════════════════════════════════════════════════════════
  const Memory = (() => {
    const MAX_TURNS = 20;

    let state = {
      userName:          null,
      serviceBasket:     [],      // ← NEW: array of { intent, name, emoji }
      lastIntent:        null,
      conversationStage: "greeting",
      askedName:         false,
      pendingState:      null,
      turns:             [],
    };

    function push(role, text, intent = null) {
      state.turns.push({ role, text, intent, ts: Date.now() });
      if (state.turns.length > MAX_TURNS) state.turns = state.turns.slice(-MAX_TURNS);
      if (intent && intent !== "greeting" && intent !== "pricing" && intent !== "contact") {
        state.lastIntent = intent;
      }
    }

    // Add a service to the basket (deduped by intent key)
    function addToBasket(intentKey) {
      const svc = KB[intentKey];
      if (!svc || !svc.name) return;
      const already = state.serviceBasket.find(s => s.intent === intentKey);
      if (!already) {
        state.serviceBasket.push({ intent: intentKey, name: svc.name, emoji: svc.emoji });
      }
    }

    function getBasket()        { return state.serviceBasket; }
    function clearBasket()      { state.serviceBasket = []; }

    function isShortOrAffirm(text) {
      const SHORT = /^(yes|no|sure|okay|ok|please|ya|yep|nope|more|go on|thanks|and|what else|tell me more|both|just one|all of them)[\.\?!]?$/i;
      return SHORT.test(text.trim()) || text.trim().length < 18;
    }

    function setStage(s)       { state.conversationStage = s; }
    function getStage()        { return state.conversationStage; }
    function setName(n)        { state.userName = n; }
    function getName()         { return state.userName; }
    function getLast()         { return state.lastIntent; }
    function askedNameBefore() { return state.askedName; }
    function markAskedName()   { state.askedName = true; }
    function setPending(s)     { state.pendingState = s; }
    function getPending()      { return state.pendingState; }
    function clearPending()    { state.pendingState = null; }

    // Legacy: userNeed derived from basket for WhatsApp message
    function getNeed() {
      const basket = state.serviceBasket;
      if (!basket.length) return null;
      return basket.map(s => s.name).join(" + ");
    }

    return {
      push, isShortOrAffirm, setStage, getStage,
      setName, getName, getNeed, getLast,
      addToBasket, getBasket, clearBasket,
      askedNameBefore, markAskedName,
      setPending, getPending, clearPending,
    };
  })();


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 5 — CONTEXT-AWARE PRICING
  //  NEW: "how much" → checks lastIntent → returns that service's price first
  // ══════════════════════════════════════════════════════════════════════════
  function contextAwarePricingResponse(lastIntent) {
    const svc = KB[lastIntent];

    // If we know what they were last talking about, give that price directly
    if (svc && svc.price) {
      const name = Memory.getName();
      const greeting = name ? `, ${name}` : "";
      return {
        html: buildHTML({
          text: `**${svc.emoji} ${svc.name}${greeting} — here's the pricing:**`,
          details: [`💰 **${svc.price}**`, `⏱ Turnaround: ${svc.turnaround}`],
          note: "🎓 Student? Mention it when you contact us — we always work within your budget.",
          followUp: "Ready to get started, or do you have any other questions?",
        }),
        suggestions: ["✅ Let's Go!", "📞 Contact Now", "🛠️ Other Services", "💰 All Prices"],
      };
    }

    // No context → full price list
    return pricingResponse();
  }

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


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 6 — MULTI-SERVICE BASKET CLOSE
  //  NEW: checks basket for multiple services → smart close question
  // ══════════════════════════════════════════════════════════════════════════
  function buildBasketClose() {
    const basket = Memory.getBasket();
    const name   = Memory.getName();

    if (basket.length > 1) {
      // Multiple services — ask which ones
      const serviceList = basket.map(s => `**${s.emoji} ${s.name}**`).join(" and ");
      const nameGreet   = name ? `, ${name}` : "";
      return {
        html: buildHTML({
          text: `I see you've mentioned ${serviceList}${nameGreet}. 🎯`,
          followUp: "Do you want all of them, or just one? Let me know so I can create the right WhatsApp message for you.",
        }),
        suggestions: [
          "✅ I want all of them",
          ...basket.map(s => `Just the ${s.name}`),
          "🛠️ Something else",
        ],
      };
    }

    // Single service — direct close
    if (basket.length === 1) {
      const svc = basket[0];
      const nameGreet = name ? `, ${name}` : "";
      return {
        html: buildHTML({
          text: `Perfect${nameGreet}! Ready to get your **${svc.emoji} ${svc.name}** sorted? 🚀`,
          followUp: "Click below to connect with us on WhatsApp — your details will be pre-filled.",
        }),
        suggestions: ["✅ Yes, let's go!", "💰 What's the price?", "🛠️ Other Services"],
      };
    }

    return null;
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 7 — WHATSAPP REDIRECT
  // ══════════════════════════════════════════════════════════════════════════
  const WA_NUMBER = "27720465993";

  function buildWhatsAppLink(name, need, extra = "") {
    const nm  = name || "a potential client";
    const svc = need || "your services";
    const msg = `Hi, I came from your website. My name is ${nm} and I would like help with: ${svc}.${extra ? " " + extra : ""}`;
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
  //  MODULE 8 — RESPONSE BUILDER
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

  // Smarter fallback — uses partial hints to suggest relevant services
  function fallback(input) {
    Memory.push("bot", "", null);
    const norm   = NLP.normalize(input);
    const hints  = NLP.extractPartialHints(norm);
    const snippet = input.length > 55 ? input.slice(0, 55) + "…" : input;

    // If we got partial hints, suggest the closest service
    if (hints.length > 0) {
      const top = hints[0];
      const svc = KB[top.intent];
      return {
        html: buildHTML({
          text: snippet
            ? `Not 100% sure about *"${escHtml(snippet)}"* — did you mean something about **${svc?.emoji || ""} ${svc?.name || top.intent}**?`
            : `Let me point you in the right direction — are you looking for **${svc?.name || top.intent}**?`,
          details: [
            "📱 **WhatsApp: +27 720 465 993** ← fastest way to get an answer",
          ],
          followUp: "Or pick what fits best:",
        }),
        suggestions: [
          svc ? `${svc.emoji} ${svc.name}` : "🛠️ This Service",
          "🛠️ All Services",
          "💰 Pricing",
          "📞 Talk to a Person",
        ],
      };
    }

    return {
      html: buildHTML({
        text: snippet
          ? `Not sure about *"${escHtml(snippet)}"* — let's get you to the right place.`
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

  const SERVICE_INTENTS = new Set(["web","cv","assignment","windows","troubleshoot","design","office","business"]);

  // Phrases that signal the user is asking for a price, not a service intro
  const PRICE_TRIGGER_WORDS = [
    "how much","how much is","how much for","how much does","how much do",
    "what does it cost","what is the cost","what is the price","what's the price",
    "whats the price","what are your prices","what do you charge","how much to",
    "price for","price of","cost of","cost for","fee for","charge for",
    "rates for","how expensive","is it expensive","affordable","how cheap",
    "how much would","how much will","what will it cost","quote for",
    "rand","rands","r150","r200","r250","r300","r800","r80","r100",
  ];

  // Maps service intent → short inline price answer
  const SERVICE_INLINE_PRICE = {
    cv:           { line: "**CV Revamp — from R150 · New CV — from R200.**", follow: "Are you revamping an existing one or starting from scratch?" },
    web:          { line: "**Website development starts from R800.**", follow: "Business site, portfolio, or online store?" },
    assignment:   { line: "**Assignment assistance starts from R80.**", follow: "What's your deadline? That determines if same-day is doable." },
    windows:      { line: "**Windows installation starts from R200** (includes drivers + genuine activation).", follow: "Is the PC crashing, unactivated, or need a full fresh install?" },
    troubleshoot: { line: "**PC troubleshooting & repair starts from R150.**", follow: "What's your PC doing — slow, crashing, virus?" },
    design:       { line: "**Logo from R250 · Flyer from R150 · Social media pack from R300.**", follow: "What do you need designed?" },
    office:       { line: "**Microsoft Office installation starts from R100** (genuine activation, under 1 hour).", follow: "In Polokwane in-person or remote via screen share?" },
    business:     { line: "**Business digital setup is package-priced** — depends on what you need.", follow: "New business or existing one going online?" },
  };

  // Detects if the message is asking for a price for a specific service
  // Returns { isPriceQuery: true, intentKey } or { isPriceQuery: false }
  function detectPriceQuery(rawInput, scores) {
    const norm = NLP.normalize(rawInput);
    const hasPriceTrigger = PRICE_TRIGGER_WORDS.some(p => norm.includes(p));
    if (!hasPriceTrigger) return { isPriceQuery: false };

    // Find highest-scoring service intent in this message
    let bestIntent = null, bestScore = 0;
    for (const [intent, score] of Object.entries(scores)) {
      if (SERVICE_INTENTS.has(intent) && score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    if (bestIntent && bestScore >= 1.5) {
      return { isPriceQuery: true, intentKey: bestIntent };
    }

    // Also check lastIntent — "how much is that?" with no new service signal
    return { isPriceQuery: hasPriceTrigger, intentKey: null };
  }

  // Short, direct price reply — no pitch, no bullet list of service details
  function inlinePriceResponse(intentKey) {
    const svc  = KB[intentKey];
    const data = SERVICE_INLINE_PRICE[intentKey];
    if (!svc || !data) return contextAwarePricingResponse(intentKey);

    // Set lastIntent so follow-up "how much" still resolves correctly
    Memory.addToBasket(intentKey);

    return {
      html: buildHTML({
        text: `${svc.emoji} ${data.line}`,
        followUp: data.follow,
      }),
      suggestions: ["✅ Let's Go!", "📋 Tell Me More", "📞 Contact Now", "💰 All Prices"],
    };
  }

  const GREETINGS = [
    "Hey! 👋 Welcome to Mellow Tech. What can we help you with today?",
    "Hi there! 😊 You've reached Mellow Tech — what do you need help with?",
    "Hey, great to have you here! 👋 What brings you to Mellow Tech today?",
    "Welcome! I'm the Mellow Tech assistant. What can I sort out for you today?",
    "Howzit! 👋 Mellow Tech here — what can we help you with?",
  ];

  const NAME_ASKS = [
    "Before we go further — what's your name? 😊",
    "Quick one — what should I call you?",
    "What's your name? That way I can personalise this for you 👇",
    "Mind if I get your name first? Makes it easier to help you.",
  ];

  const QUALIFY_TRANSITIONS = [
    "Got it! One quick question before I give you the details:",
    "Perfect — just so I give you the right info:",
    "Great choice! Quick question to narrow it down:",
    "Noted! Just need to know one thing:",
    "Lekker! Quick question first:",
  ];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function buildServiceResponse(intentKey, entities) {
    const svc = KB[intentKey];
    if (!svc || !svc.name) return null;

    // Add to basket
    Memory.addToBasket(intentKey);
    Memory.setStage("qualify");

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

    const qualifyLine = rand(QUALIFY_TRANSITIONS);
    const html = buildHTML({
      text: `**${svc.emoji} ${svc.name}** — ${svc.pitch}`,
      details: svc.details,
      turnaround: `⏱ ${svc.turnaround}`,
      price: `💰 ${svc.price}`,
      followUp: `${qualifyLine} ${svc.qualify_q}`,
    });

    return { html, suggestions: getServiceSuggestions(intentKey) };
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
  //  MODULE 9 — MAIN PROCESSING ENGINE (upgraded)
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
          Memory.setStage("close");
          const html = whatsAppCTA(extractedName, need);
          Memory.push("bot", html, "close");
          return { html, suggestions: ["📱 Open WhatsApp", "🛠️ Other Services"] };
        } else {
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
        Memory.setPending({ type: "name_capture" });
        const html = "<p>What's your name? Just a first name is fine 😊</p>";
        Memory.push("bot", html, null);
        return { html, suggestions: [] };
      }
    }

    // ── STEP 2: Pending basket confirm (multi-service) ───────────────────
    if (pending && pending.type === "basket_confirm") {
      Memory.clearPending();
      const norm = NLP.normalize(rawInput);

      // "I want all of them" / "both" / "all"
      if (/all|both|everything|all of them|yes all/i.test(norm)) {
        // Keep full basket → go to name capture or WhatsApp
        return proceedToClose();
      }

      // Check if they picked a specific service name
      for (const svc of Memory.getBasket()) {
        const svcNorm = NLP.normalize(svc.name);
        if (norm.includes(svcNorm) || norm.includes(svc.intent)) {
          // They only want this one
          Memory.clearBasket();
          Memory.addToBasket(svc.intent);
          return proceedToClose();
        }
      }

      // Partial match on "just cv", "just the website" etc.
      for (const [intentKey] of Object.entries(KB)) {
        if (!SERVICE_INTENTS.has(intentKey)) continue;
        if (norm.includes(intentKey) || (KB[intentKey].name && norm.includes(NLP.normalize(KB[intentKey].name)))) {
          Memory.clearBasket();
          Memory.addToBasket(intentKey);
          return proceedToClose();
        }
      }

      // Couldn't parse — ask again
      return {
        html: "<p>Which one would you like to go with? 😊</p>",
        suggestions: [
          "✅ I want all of them",
          ...Memory.getBasket().map(s => `Just the ${s.name}`),
        ],
      };
    }

    // ── STEP 3: Pending confirm close (soft close yes/no) ────────────────
    if (pending && pending.type === "confirm_close") {
      Memory.clearPending();
      const norm = NLP.normalize(rawInput);
      if (/yes|sure|okay|ok|ya|yep|please|go ahead|do it|both|all|let's go|lets go/i.test(norm)) {
        return proceedToClose();
      } else {
        const html = "<p>No problem! 😊 What else can I help clarify?</p>";
        Memory.push("bot", html, null);
        return {
          html,
          suggestions: ["💰 Pricing", "⏱ Turnaround", "🛡️ Our Guarantee", "📞 Contact Team"],
        };
      }
    }

    // ── STEP 4: Classify intent ──────────────────────────────────────────
    const { ranked, scores } = classify(rawInput);
    const THRESHOLD = 1.5;

    // ── STEP 4b: Price-query intercept ───────────────────────────────────
    // "how much for a cv", "website cost?", "how much is a logo" etc.
    // Runs BEFORE service routing so pricing always wins when explicit.
    const priceCheck = detectPriceQuery(rawInput, scores);
    if (priceCheck.isPriceQuery) {
      const intentKey = priceCheck.intentKey || Memory.getLast();
      if (intentKey && SERVICE_INTENTS.has(intentKey)) {
        Memory.push("bot", "", "pricing");
        return inlinePriceResponse(intentKey);
      }
      // Price question but no service context → full list
      Memory.push("bot", "", "pricing");
      return pricingResponse();
    }

    // ── STEP 5: Frustrated user — escalate fast ──────────────────────────
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

    // ── STEP 6: No confident match — smart fallback ──────────────────────
    if (ranked.length === 0 || ranked[0].score < THRESHOLD) {
      if (Memory.isShortOrAffirm(rawInput) && Memory.getLast()) {
        return resolveService(Memory.getLast(), entities, sent);
      }
      return fallback(rawInput);
    }

    const topIntent = ranked[0].intent;

    // ── STEP 7: Greeting ─────────────────────────────────────────────────
    if (topIntent === "greeting") {
      Memory.setStage("discovery");
      const html = `<p>${rand(GREETINGS)}</p>`;
      Memory.push("bot", html, "greeting");
      return {
        html,
        suggestions: ["🌐 Website", "📄 CV", "💻 PC Repair", "🎨 Design", "📝 Assignment", "💰 Pricing"],
      };
    }

    // ── STEP 8: Pricing intent — CONTEXT AWARE ───────────────────────────
    if (topIntent === "pricing") {
      Memory.push("bot", "", "pricing");
      const lastIntent = Memory.getLast();
      // If we know what service they were talking about — answer that price
      if (lastIntent && SERVICE_INTENTS.has(lastIntent)) {
        return contextAwarePricingResponse(lastIntent);
      }
      return pricingResponse();
    }

    // ── STEP 9: Contact intent ───────────────────────────────────────────
    if (topIntent === "contact") {
      Memory.push("bot", "", "contact");
      return contactResponse();
    }

    // ── STEP 10: Disambiguation ──────────────────────────────────────────
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

    // ── STEP 11: Service intent → value delivery + qualify ───────────────
    if (SERVICE_INTENTS.has(topIntent)) {
      const res = buildServiceResponse(topIntent, entities);
      if (res) {
        Memory.push("bot", res.html, topIntent);

        const name   = Memory.getName();
        const basket = Memory.getBasket();
        const need   = Memory.getNeed();

        // If name + need → direct WhatsApp close
        if (name && need) {
          Memory.setStage("close");
          const waHtml = whatsAppCTA(name, need);
          Memory.push("bot", waHtml, "close");
          return {
            html: res.html + waHtml,
            suggestions: ["📱 Open WhatsApp", "💰 Pricing", "🛠️ Other Services"],
          };
        }

        // Multiple services in basket → basket close
        if (basket.length > 1 && !Memory.askedNameBefore()) {
          Memory.setPending({ type: "basket_confirm" });
          const basketClose = buildBasketClose();
          if (basketClose) {
            Memory.push("bot", basketClose.html, "basket_close");
            return {
              html: res.html + basketClose.html,
              suggestions: basketClose.suggestions,
            };
          }
        }

        // Single service soft close
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

    // ── STEP 12: Default fallback ─────────────────────────────────────────
    return fallback(rawInput);
  }

  // Helper: proceed to name capture or WhatsApp redirect
  function proceedToClose() {
    const name = Memory.getName();
    const need = Memory.getNeed();

    if (!name && !Memory.askedNameBefore()) {
      Memory.markAskedName();
      Memory.setPending({ type: "name_capture" });
      const html = `<p>${rand(NAME_ASKS)}</p>`;
      Memory.push("bot", html, null);
      return { html, suggestions: [] };
    }

    if (name && need) {
      Memory.setStage("close");
      const html = whatsAppCTA(name, need);
      Memory.push("bot", html, "close");
      return { html, suggestions: ["📱 Open WhatsApp", "🛠️ Other Services"] };
    }

    // Fallback close without name
    const link = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi, I came from your website and I need some help.")}`;
    const html = buildHTML({
      text: "Ready to go! Click below to chat with us on WhatsApp:",
      details: [`📱 <a href="${link}" target="_blank" rel="noopener"><strong>Click here to WhatsApp us →</strong></a>`],
    });
    Memory.push("bot", html, "close");
    return { html, suggestions: ["📱 Open WhatsApp", "🛠️ Other Services"] };
  }

  function resolveService(intentKey, entities, sentiment) {
    if (intentKey === "pricing") {
      const lastIntent = Memory.getLast();
      if (lastIntent && SERVICE_INTENTS.has(lastIntent)) return contextAwarePricingResponse(lastIntent);
      return pricingResponse();
    }
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

  root.MellowTechBot = { process };

}(window));


// ══════════════════════════════════════════════════════════════════════════
//  MODULE 10 — UI ADAPTER (unchanged from v3)
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

      const closeBtn = $(SEL.closeBtn);
      if (closeBtn) {
        closeBtn.addEventListener("click", () => { panel.style.display = "none"; });
      }

      button.addEventListener("click", send);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      });

      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 90) + "px";
      });

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
//  MODULE 11 — BOOTSTRAP
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

/* ═══════════════════════════════════════════════════
   EMAILJS CONTACT FORM (unchanged)
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
var _l = document.getElementById('page-loader') || document.getElementById('mtLoader');
if (_l) { _l.style.opacity = '0'; _l.style.pointerEvents = 'none'; setTimeout(function(){ if(_l.parentNode) _l.parentNode.removeChild(_l); }, 800); }
