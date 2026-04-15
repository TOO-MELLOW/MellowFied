/* ═══════════════════════════════════════════════════
   MELLOW TECH SERVICES — SHARED JAVASCRIPT
   common.js — loaded on every page
════════════════════════════════════════════════════ */
// Loader - show only once per session
// Loader - show only once per session (simplified)
(function() {
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    
    // Check if loader has already been shown this session
    if (sessionStorage.getItem('loaderShown')) {
      // Hide immediately - no animation
      loader.style.display = 'none';
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      document.body.classList.remove('mt-hidden'); // Ensure body is visible
      return;
    }
    
    // First visit - mark as shown
    sessionStorage.setItem('loaderShown', 'true');
    
    // Hide loader after page loads
    window.addEventListener('load', function() {
      if (loader) {
        loader.classList.add('hide');
        setTimeout(() => { 
          if (loader) {
            loader.style.display = 'none';
            document.body.classList.remove('mt-hidden');
          }
        }, 600);
      }
    });
    
    // Fallback: hide after 5 seconds max
    setTimeout(function() {
      if (loader && !loader.classList.contains('hide')) {
        loader.classList.add('hide');
        setTimeout(() => { 
          if (loader) {
            loader.style.display = 'none';
            document.body.classList.remove('mt-hidden');
          }
        }, 600);
      }
    }, 5000);
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
  } else {
    initLoader();
  }
})();
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
  // close mobile menu on link click
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

/* ═══════════════════════════════════════════════════
   MT-CHATBOT
════════════════════════════════════════════════════ */
(function(){
  var MT_INTENTS = {
    cv:         { kw:['cv','resume','curriculum','vitae','cover letter'],            fn: mtHandleCV },
    website:    { kw:['website','web','site','online store','ecommerce','landing page'], fn: mtHandleWebsite },
    assignment: { kw:['assignment','task','essay','homework','research','thesis','dissertation','project'], fn: mtHandleAssignment },
    laptop:     { kw:['laptop','pc','computer','slow','repair','fix','virus','screen','battery','not turning on',"won't start",'freeze','crash','blue screen'], fn: mtHandleLaptop },
    price:      { kw:['price','pricing','cost','how much','rate','fee','charge','affordable'], fn: mtFaqPrice },
    time:       { kw:['how long','turnaround','timeline','delivery','when','days','hours'], fn: mtFaqTime },
    payment:    { kw:['payment','pay','deposit','eft','cash','bank','transfer','yoco'],    fn: mtFaqPayment },
    greeting:   { kw:['hello','hi','hey','howzit','sup','good morning','good afternoon','good evening'], fn: mtGreeting }
  };

  function mtDetect(text){
    var low = text.toLowerCase();
    for(var k in MT_INTENTS){
      if(MT_INTENTS[k].kw.some(function(w){ return low.includes(w); })) return MT_INTENTS[k].fn;
    }
    return mtUnknown;
  }

  function mtHandleCV(text){
    var low = text.toLowerCase();
    var type = 'Standard CV', price = 100;
    if(low.includes('ats'))                                         { type='ATS-Optimised CV'; price=200; }
    else if(low.includes('professional')||low.includes('exec'))     { type='Professional CV'; price=150; }
    else if(low.includes('student')||low.includes('graduate'))      { type='Student / Graduate CV'; price=100; }
    else if(low.includes('cover'))                                  { type='CV + Cover Letter'; price=180; }
    var dep = Math.round(price*.25);
    var wa = encodeURIComponent('Hi MellowTech! I need a '+type+'.\n\nService: CV Writing\nType: '+type+'\nPrice: R'+price+'\nDeposit: R'+dep);
    return mtCard({icon:'📄',title:'CV Writing Service',intro:'Got it! Here\'s your quote for a <strong>'+type+'</strong>:',rows:[
      {k:'CV Type',v:type},{k:'Price',v:'R'+price,hi:true},{k:'Deposit',v:'R'+dep+' (25%)'},{k:'Turnaround',v:'24–48 hours'}
    ],note:'🔔 A 25% deposit is required before work begins.',wa:wa,waLabel:'Order on WhatsApp'});
  }

  function mtHandleWebsite(text){
    var low = text.toLowerCase();
    var type = 'Basic Website', price = 1500;
    if(low.includes('ecommerce')||low.includes('online store')||low.includes('shop')||low.includes('sell')) { type='E-Commerce Store'; price=4000; }
    else if(low.includes('business')||low.includes('company')||low.includes('corporate')) { type='Business Website'; price=2500; }
    else if(low.includes('portfolio')||low.includes('personal')||low.includes('blog'))    { type='Portfolio / Personal Site'; price=1500; }
    var dep = Math.round(price*.25);
    var wa = encodeURIComponent('Hi MellowTech! I need a '+type+'.\n\nService: Web Development\nType: '+type+'\nPrice: R'+price+'\nDeposit: R'+dep);
    return mtCard({icon:'🌐',title:'Website Development',intro:'Great choice! Here\'s your estimate for a <strong>'+type+'</strong>:',rows:[
      {k:'Website Type',v:type},{k:'Price',v:'R'+price,hi:true},{k:'Deposit',v:'R'+dep+' (25%)'},{k:'Turnaround',v:'5–14 business days'}
    ],note:'✅ Includes mobile-responsive design, hosting guidance &amp; 1 revision round.',wa:wa,waLabel:'Start My Project'});
  }

  function mtHandleAssignment(text){
    var low = text.toLowerCase();
    var base=200, urgLabel='Standard', urgFee=0;
    if(low.includes('today')||low.includes('asap')||low.includes('hours'))         { urgLabel='URGENT (same-day)'; urgFee=200; }
    else if(low.includes('tomorrow')||low.includes('urgent')||low.includes('rush')) { urgLabel='Rush (next-day)'; urgFee=100; }
    var dm = text.match(/\b(\d{1,2})\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi);
    var dueDate = dm ? dm[0] : null;
    var subj = 'General Assignment';
    if(low.includes('research'))subj='Research Paper';
    else if(low.includes('essay'))subj='Essay';
    else if(low.includes('thesis')||low.includes('dissertation'))subj='Thesis / Dissertation';
    else if(low.includes('report'))subj='Report';
    var total=base+urgFee, dep=Math.round(total*.25);
    var rows=[{k:'Type',v:subj},{k:'Urgency',v:urgLabel,hi:urgFee>0}];
    if(dueDate)rows.push({k:'Due Date',v:dueDate});
    if(urgFee>0)rows.push({k:'Urgency Fee',v:'+R'+urgFee});
    rows.push({k:'Total Price',v:'R'+total,hi:true},{k:'Deposit',v:'R'+dep+' (25%)'});
    var wa = encodeURIComponent('Hi MellowTech! I need assignment help.\n\nType: '+subj+'\nUrgency: '+urgLabel+(dueDate?'\nDue Date: '+dueDate:'')+'\nPrice: R'+total+'\nDeposit: R'+dep);
    return mtCard({icon:'📝',title:'Assignment Help',intro:'Here\'s your quote for <strong>'+subj+'</strong>:',rows:rows,note:'🔒 A 25% deposit is required before work starts. Confidentiality guaranteed.',wa:wa,waLabel:'Submit Assignment Brief'});
  }

  function mtHandleLaptop(text){
    var low = text.toLowerCase();
    var issue='General Diagnosis',min=50,max=200;
    if(low.includes('slow')||low.includes('lagg')||low.includes('freeze'))    { issue='Performance / Speed Issues'; min=150;max=300; }
    else if(low.includes('virus')||low.includes('malware'))                  { issue='Virus / Malware Removal'; min=200;max=400; }
    else if(low.includes('screen')||low.includes('display'))                 { issue='Screen Repair / Replacement'; min=300;max=600; }
    else if(low.includes('not turning')||low.includes("won't start"))         { issue='Power / Boot Issue'; min=150;max=500; }
    else if(low.includes('battery'))                                         { issue='Battery Replacement'; min=200;max=450; }
    else if(low.includes('keyboard'))                                        { issue='Keyboard Repair'; min=150;max=350; }
    else if(low.includes('wifi')||low.includes('network'))                   { issue='Network / Wi-Fi Issues'; min=100;max=250; }
    else if(low.includes('blue screen')||low.includes('crash'))              { issue='Crash / Blue Screen Error'; min=150;max=400; }
    var wa = encodeURIComponent('Hi MellowTech! I need tech support.\n\nIssue: '+issue+'\nDiagnosis Fee: R50\nRepair Estimate: R'+min+'–R'+max);
    return mtCard({icon:'💻',title:'Tech Support',intro:'Let\'s get that fixed! Here\'s what to expect for <strong>'+issue+'</strong>:',rows:[
      {k:'Issue',v:issue},{k:'Diagnosis Fee',v:'R50'},{k:'Repair Estimate',v:'R'+min+'–R'+max,hi:true},{k:'Note',v:'Final quote after diagnosis'}
    ],note:'🔧 Diagnosis fee applies toward the repair if you proceed.',wa:wa,waLabel:'Book a Diagnosis'});
  }

  function mtFaqPrice(){
    return 'Here\'s a quick overview of our pricing:<div class="mt-card"><div class="mt-card-label">💰 Service Pricing</div>'
      +'<div class="mt-row"><span class="mt-rkey">📄 CV Standard</span><span class="mt-rval">R100</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📄 CV Professional</span><span class="mt-rval">R150</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📄 CV ATS-Optimised</span><span class="mt-rval">R200</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 Basic Website</span><span class="mt-rval">R1,500</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 Business Website</span><span class="mt-rval">R2,500</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 E-Commerce</span><span class="mt-rval">R4,000</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📝 Assignment (base)</span><span class="mt-rval">R200+</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">💻 Tech Diagnosis</span><span class="mt-rval">R50</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">💻 Repairs</span><span class="mt-rval mt-hi">R150–R500</span></div>'
      +'</div><br>All prices require a <strong style="color:var(--mt-accent)">25% deposit</strong> upfront.';
  }

  function mtFaqTime(){
    return 'Typical turnaround times:<div class="mt-card"><div class="mt-card-label">⏱ Turnaround</div>'
      +'<div class="mt-row"><span class="mt-rkey">📄 CV Writing</span><span class="mt-rval">24–48 hrs</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 Basic Website</span><span class="mt-rval">5–7 days</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 Business Website</span><span class="mt-rval">7–10 days</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">🌐 E-Commerce</span><span class="mt-rval">10–14 days</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📝 Assignment</span><span class="mt-rval">By your deadline</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">💻 Tech Repair</span><span class="mt-rval">Same-day – 3 days</span></div>'
      +'</div>';
  }

  function mtFaqPayment(){
    return 'We make paying easy! 💳<div class="mt-card"><div class="mt-card-label">💰 Payment Methods</div>'
      +'<div class="mt-row"><span class="mt-rkey">🏦 EFT / Bank Transfer</span><span class="mt-rval mt-hi">✓</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📱 Capitec Pay</span><span class="mt-rval mt-hi">✓</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">💵 Cash</span><span class="mt-rval mt-hi">✓</span></div>'
      +'<div class="mt-row"><span class="mt-rkey">📲 SnapScan / Zapper</span><span class="mt-rval mt-hi">✓</span></div>'
      +'</div><br>A <strong style="color:var(--mt-accent)">25% deposit</strong> is required before work begins.';
  }

  function mtGreeting(){
    return 'Hey there! 👋 Welcome to <strong>MellowTech</strong>!<br><br>I\'m your smart assistant — I can help you with quotes and info on all our services.<br><br>What can I help you with today?'
      +'<div class="mt-suggest">'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'I need a professional CV\')"><div class="mt-sitem-icon">📄</div>CV Writing</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'I need a business website\')"><div class="mt-sitem-icon">🌐</div>Website Dev</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'I have an urgent assignment\')"><div class="mt-sitem-icon">📝</div>Assignments</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'My laptop is slow\')"><div class="mt-sitem-icon">💻</div>Tech Support</div>'
      +'</div>';
  }

  function mtUnknown(){
    return 'I didn\'t quite catch that — no worries! 🙂<br><br>Here\'s what I can help you with:'
      +'<div class="mt-suggest">'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'CV services and pricing\')"><div class="mt-sitem-icon">📄</div>CV Writing</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'I need a website\')"><div class="mt-sitem-icon">🌐</div>Web Development</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'Help with my assignment\')"><div class="mt-sitem-icon">📝</div>Assignments</div>'
      +'<div class="mt-sitem" onclick="window._mtSendChip(\'Laptop repair\')"><div class="mt-sitem-icon">💻</div>Tech Support</div>'
      +'</div><br>Or <a href="https://wa.me/27720465993" target="_blank" style="color:var(--mt-accent)">WhatsApp us</a> directly!';
  }

  var WA_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.84L.057 24l6.305-1.654A11.882 11.882 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>';

  function mtCard(o){
    var rowsHtml = o.rows.map(function(r){ return '<div class="mt-row"><span class="mt-rkey">'+r.k+'</span><span class="mt-rval'+(r.hi?' mt-hi':'')+'">'+r.v+'</span></div>'; }).join('');
    return o.intro+'<div class="mt-card"><div class="mt-card-label">'+o.icon+' '+o.title+'</div>'+rowsHtml+'</div>'
      +'<div style="font-size:11px;color:var(--mt-muted);margin-top:8px;line-height:1.6">'+o.note+'</div>'
      +'<a href="https://wa.me/27720465993?text='+o.wa+'" target="_blank" class="mt-wa-btn">'+WA_SVG+o.waLabel+'</a>';
  }

  var mtBusy = false;

  function mtAppendMsg(role, html){
    var body = document.getElementById('mtBody');
    if(!body) return;
    var wrap = document.createElement('div');
    wrap.className = 'mt-msg mt-'+role;
    var av = document.createElement('div');
    av.className = 'mt-avatar';
    av.textContent = role === 'bot' ? '⚡' : '👤';
    var bub = document.createElement('div');
    bub.className = 'mt-bubble';
    bub.innerHTML = html;
    wrap.appendChild(av); wrap.appendChild(bub);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function mtShowTyping(){ var t=document.getElementById('mtTyping'); if(t){t.classList.add('mt-show'); document.getElementById('mtBody').scrollTop=9999;} }
  function mtHideTyping(){ var t=document.getElementById('mtTyping'); if(t) t.classList.remove('mt-show'); }

  function mtProcess(txt){
    mtBusy = true; mtShowTyping();
    var fn = mtDetect(txt);
    setTimeout(function(){
      mtHideTyping();
      mtAppendMsg('bot', fn(txt));
      mtBusy = false;
    }, 550 + Math.random()*350);
  }

  function mtEsc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  window._mtSendChip = function(txt){
    if(mtBusy) return;
    mtAppendMsg('user', mtEsc(txt));
    mtProcess(txt);
  };

  window.mtHandleSend = function(){
    if(mtBusy) return;
    var inp = document.getElementById('mtInput');
    var txt = inp.value.trim(); if(!txt) return;
    inp.value = ''; inp.style.height = 'auto';
    mtAppendMsg('user', mtEsc(txt));
    mtProcess(txt);
  };

  window.mtSendChip = window._mtSendChip;

  window.mtHandleKey = function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); window.mtHandleSend(); }
  };

  window.mtResize = function(el){
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  };

  window.mtOpenPanel = function(){
    document.getElementById('mtOpenBtn').style.display = 'none';
    document.getElementById('mtPanel').classList.add('mt-visible');
  };

  window.mtClosePanel = function(){
    document.getElementById('mtPanel').classList.remove('mt-visible');
    document.getElementById('mtOpenBtn').style.display = 'flex';
  };

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      if(document.getElementById('mtBody')) mtAppendMsg('bot', mtGreeting());
    }, 800);
  });
})();

/* ═══════════════════════════════════════════════════
   LOADER
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

  var dur = 4000;
  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if(conn && conn.effectiveType){
      if(conn.effectiveType==='2g'||conn.effectiveType==='slow-2g') dur=3000;
      else if(conn.effectiveType==='3g') dur=3500;
    }
  } catch(e){}

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

(function() {
  const CX = 260, CY = 260, R = 170;
  const NS = 'http://www.w3.org/2000/svg';
  
  const services = [
    { label: 'CV Writing', icon: '📄', angle: -90 },
    { label: 'Web Dev', icon: '🌐', angle: -30 },
    { label: 'Assignments', icon: '📝', angle: 30 },
    { label: 'Tech Support', icon: '💻', angle: 90 },
    { label: 'Graphic Design', icon: '🎨', angle: 150 },
    { label: 'Google Digital Setup', icon: '📈', angle: 210 }
  ];

  const svg = document.getElementById('loader-scene');
  const nodeGroup = document.getElementById('nodes');
  const connGroup = document.getElementById('connections');
  const partGroup = document.getElementById('particles');
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
  const MAX_PARTICLES = 70;
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
  let lastRingTime = 0, ringPhase = 0;
  function pulseRings(now) {
    if (now - lastRingTime > 1500) { lastRingTime = now; ringPhase = 0; }
    const elapsed = now - lastRingTime;
    rings.forEach((ring, i) => {
      const delay = i * 400;
      const t = Math.max(0, (elapsed - delay) / 1800);
      const op = t < 0.3 ? t/0.3 * 0.35 : (1-t) * 0.35;
      ring.setAttribute('opacity', op > 0 ? op : 0);
    });
  }
  const logoGroup = document.getElementById('logo-group');
  function pulseLogo(now) {
    const scale = 1 + 0.025 * Math.sin(now / 900);
    logoGroup.setAttribute('transform', `translate(${CX},${CY}) scale(${scale}) translate(${-CX},${-CY})`);
  }

  const bar = document.getElementById('progress-bar');
  const pctEl = document.getElementById('pct');
  const loader = document.getElementById('page-loader');
  const mainContent = document.getElementById('main-content');
  
  let startTime = null, animationFrame = null, isLoaded = false;
  const LINE_STARTS = [0.02, 0.08, 0.14, 0.20, 0.26, 0.32];
  let particleSpawnCount = 0;

  function frame(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const FAKE_DURATION = 30000;
    const rawProgress = Math.min(elapsed / FAKE_DURATION, 0.99);

    bar.style.width = (rawProgress * 100) + '%';
    pctEl.textContent = Math.floor(rawProgress * 100) + '%';

    lineEls.forEach((ln, i) => {
      const lineStart = LINE_STARTS[i];
      const lineP = Math.max(0, Math.min(1, (rawProgress - lineStart) / (0.9 - lineStart)));
      const offset = ln.len * (1 - lineP);
      ln.el.setAttribute('stroke-dashoffset', offset);
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

    if (!isLoaded) animationFrame = requestAnimationFrame(frame);
  }
(function() {
  // Session check (optional)
  if (sessionStorage.getItem('loaderShown') === 'true') {
    document.getElementById('page-loader')?.remove();
    return;
  }
  sessionStorage.setItem('loaderShown', 'true');

  const MIN_DISPLAY_TIME = 3000; // Minimum 3 seconds
  let startTime = null;
  let isLoaded = false;
  let animationFrame = null;

  function frame(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const FAKE_DURATION = 30000;
    const rawProgress = Math.min(elapsed / FAKE_DURATION, 0.99);

    bar.style.width = (rawProgress * 100) + '%';
    pctEl.textContent = Math.floor(rawProgress * 100) + '%';

    if (!isLoaded || elapsed < MIN_DISPLAY_TIME) {
      animationFrame = requestAnimationFrame(frame);
    }
  }

  function finishLoader() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    
    // Quickly animate to 100%
    bar.style.width = '100%';
    pctEl.textContent = '100%';
    lineEls.forEach(ln => ln.el.setAttribute('stroke-dashoffset', 0));
    nodeEls.forEach(n => n.g.setAttribute('opacity', 1));
    
    setTimeout(() => {
      document.getElementById('page-loader').classList.add('done');
    }, 400);
  }

  window.addEventListener('load', function() {
    isLoaded = true;
    const elapsed = startTime ? performance.now() - startTime : 0;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
    
    if (remainingTime === 0) {
      finishLoader();
    } else {
      setTimeout(finishLoader, remainingTime);
    }
  });

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
