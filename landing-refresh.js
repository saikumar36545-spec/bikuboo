(function(){
  function init(){
    if(document.getElementById('bikuboo-launch-home')) return;
    var find=document.getElementById('find');
    if(!find) return;
    var oldHero=document.querySelector('.hero');
    var oldVibe=document.querySelector('.vibe-strip');
    if(oldHero) oldHero.style.display='none';
    if(oldVibe) oldVibe.style.display='none';

    var style=document.createElement('style');
    style.id='bikuboo-launch-style';
    style.textContent=`
      :root{--bk-navy:#062b55;--bk-blue:#0b74d1;--bk-orange:#ff5a1f;--bk-orange2:#ff7a21;--bk-soft:#f5f9fd;--bk-line:#dce7f2}
      body{background:#fff;color:var(--bk-navy)}
      .bk-launch{font-family:Inter,Arial,sans-serif;overflow:hidden;background:#fff}
      .bk-hero{min-height:650px;padding:72px 7% 48px;display:grid;grid-template-columns:1.02fr .98fr;gap:35px;align-items:center;position:relative;background:linear-gradient(120deg,#f9fbff 0%,#fff 52%,#eef7ff 100%);isolation:isolate}
      .bk-hero:before{content:"";position:absolute;right:-140px;top:-180px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,#dceeff 0,#fff0 68%);z-index:-1}
      .bk-kicker{display:inline-flex;gap:8px;align-items:center;padding:9px 14px;border-radius:999px;background:#fff;border:1px solid #dce8f4;color:#15548a;font-weight:900;font-size:12px;box-shadow:0 8px 24px #173b5c12}
      .bk-kicker i{width:8px;height:8px;border-radius:50%;background:var(--bk-orange);display:block}
      .bk-hero h1{font-size:clamp(50px,6vw,82px);line-height:.92;letter-spacing:-4px;margin:22px 0 18px;font-weight:950;color:var(--bk-navy)}
      .bk-hero h1 span{display:block;color:var(--bk-orange);background:linear-gradient(90deg,var(--bk-orange),#ff7a18);-webkit-background-clip:text;background-clip:text;color:transparent}
      .bk-hero p{font-size:19px;line-height:1.6;max-width:590px;color:#52677d;margin:0 0 26px}
      .bk-actions{display:flex;gap:12px;flex-wrap:wrap}
      .bk-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 22px;border-radius:13px;font-weight:950;cursor:pointer;border:1px solid transparent;transition:.2s;text-decoration:none}
      .bk-btn:hover{transform:translateY(-3px);box-shadow:0 12px 28px #12395a18}
      .bk-btn.primary{background:linear-gradient(135deg,var(--bk-orange),#ff7022);color:#fff!important}
      .bk-btn.secondary{background:#fff;border-color:#ff6a2b;color:var(--bk-navy)!important}
      .bk-trust-row{display:flex;gap:22px;flex-wrap:wrap;margin-top:32px;color:#254d73;font-size:13px;font-weight:850}
      .bk-trust-row span{display:flex;align-items:center;gap:7px}.bk-trust-row b{color:#159447;font-size:17px}
      .bk-hero-art{min-height:520px;position:relative;display:flex;align-items:center;justify-content:center}
      .bk-scene{position:absolute;inset:25px 0 0;border-radius:38px;background:linear-gradient(145deg,#fcebd7 0%,#dceeff 52%,#b9d9f3 100%);overflow:hidden;box-shadow:0 30px 70px #153b5c1c;border:1px solid #d6e5f2}
      .bk-sky{position:absolute;inset:0;background:radial-gradient(circle at 72% 26%,#fff7d5 0,transparent 25%),linear-gradient(180deg,#f7dfc1 0,#dceafa 55%,#c7d9e9 100%)}
      .bk-city{position:absolute;left:0;right:0;bottom:115px;height:150px;background:linear-gradient(160deg,transparent 0 15%,#94a9bb 16% 31%,transparent 32%),linear-gradient(170deg,transparent 0 34%,#718ba0 35% 56%,transparent 57%),linear-gradient(155deg,transparent 0 54%,#a9bac7 55% 76%,transparent 77%);opacity:.55}
      .bk-road{position:absolute;left:-5%;right:-5%;bottom:-90px;height:300px;background:#24394a;transform:perspective(260px) rotateX(55deg);border-radius:50% 50% 0 0}
      .bk-road:after{content:"";position:absolute;left:49%;top:5%;height:100%;border-left:6px dashed #fff;opacity:.8}
      .bk-bike{position:absolute;left:23%;bottom:45px;width:290px;height:260px}
      .bk-wheel{position:absolute;width:92px;height:92px;border:9px solid #101c27;border-radius:50%;bottom:0;background:#667583;box-shadow:inset 0 0 0 12px #1d2a35}
      .bk-wheel.a{left:0}.bk-wheel.b{right:0}
      .bk-frame{position:absolute;left:55px;right:55px;bottom:46px;height:70px;border-bottom:13px solid #ff5a1f;border-left:11px solid #0d3154;transform:skew(-22deg)}
      .bk-rider{position:absolute;left:105px;bottom:115px;width:80px;height:120px;border-radius:45px 45px 18px 18px;background:#172d42;transform:rotate(10deg)}
      .bk-rider:before{content:"";position:absolute;left:8px;top:-53px;width:62px;height:62px;border-radius:50%;background:#142c45;border:7px solid #ff9a2f}
      .bk-rider:after{content:"BIKU";position:absolute;left:23px;top:37px;color:#ff7626;font-weight:950;font-size:11px;transform:rotate(-10deg)}
      .bk-phone{position:absolute;right:-10px;top:10px;width:250px;height:500px;border:10px solid #101923;border-radius:36px;background:#fff;box-shadow:0 28px 55px #071a2b55;z-index:5;overflow:hidden}
      .bk-phone-top{height:28px;background:#101923;border-radius:0 0 18px 18px;margin:0 auto;width:105px}
      .bk-phone-screen{padding:22px 16px;background:linear-gradient(180deg,#f7fbff,#fff);height:100%;text-align:center}
      .bk-phone-screen img{width:118px;height:98px;object-fit:contain;margin:18px auto 8px;display:block}
      .bk-phone-screen h3{margin:5px 0;font-size:18px;color:var(--bk-navy)}.bk-phone-screen p{font-size:10px;line-height:1.4;color:#65778b;margin:6px 10px 18px}
      .bk-phone-btn{display:block;width:100%;padding:11px;border-radius:11px;margin:9px 0;font-weight:900;font-size:12px}.bk-phone-btn.o{background:var(--bk-orange);color:#fff}.bk-phone-btn.w{border:1px solid #12385d;background:#fff;color:#12385d}
      .bk-phone-icons{display:flex;justify-content:center;gap:10px;margin-top:18px}.bk-phone-icons span{width:34px;height:34px;border:1px solid #dce6ef;border-radius:9px;display:grid;place-items:center;font-size:16px;background:#fff}
      .bk-mini-card{position:absolute;left:24px;top:34px;background:#fff;padding:13px 16px;border-radius:15px;box-shadow:0 15px 35px #173b5c1d;z-index:4}.bk-mini-card b{display:block;color:var(--bk-navy);font-size:13px}.bk-mini-card small{color:#6c7c8c}
      .bk-features{padding:34px 7% 25px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;background:#fff}
      .bk-feature{padding:25px 18px;border:1px solid #e2ebf3;border-radius:22px;background:#fff;box-shadow:0 10px 30px #12395a0c;text-align:center;transition:.2s}.bk-feature:hover{transform:translateY(-5px);box-shadow:0 18px 35px #12395a15}.bk-feature-icon{width:62px;height:62px;border-radius:50%;margin:0 auto 13px;display:grid;place-items:center;font-size:28px;background:#eef7ff}.bk-feature:nth-child(2) .bk-feature-icon{background:#eefcf0}.bk-feature:nth-child(3) .bk-feature-icon{background:#edf8ff}.bk-feature:nth-child(4) .bk-feature-icon{background:#fff3df}.bk-feature h3{margin:7px 0;color:var(--bk-navy);font-size:18px}.bk-feature p{margin:0;color:#697b8d;font-size:13px;line-height:1.45}
      .bk-benefits{margin:0 7%;padding:26px 18px;display:grid;grid-template-columns:repeat(4,1fr);background:#f4f8fc;border-radius:20px;gap:10px}.bk-benefit{text-align:center;border-right:1px solid #d7e2ed;padding:7px}.bk-benefit:last-child{border:0}.bk-benefit b{display:block;color:var(--bk-navy);font-size:14px}.bk-benefit span{color:#728397;font-size:12px}
      .bk-how{padding:80px 7% 60px;text-align:center}.bk-how h2{font-size:clamp(34px,4vw,50px);letter-spacing:-2px;color:var(--bk-navy);margin:0 0 8px}.bk-how h2 span{color:var(--bk-orange)}.bk-how>p{color:#6b7d8e;margin:0 0 45px}.bk-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}.bk-step{position:relative}.bk-step:not(:last-child):after{content:"→";position:absolute;right:-17px;top:30px;color:#7c91a5;font-size:26px}.bk-step-num{width:42px;height:42px;border-radius:50%;background:#edf4fa;color:var(--bk-navy);display:grid;place-items:center;font-weight:950;margin:0 auto 12px}.bk-step-icon{font-size:30px}.bk-step h3{font-size:15px;color:var(--bk-navy);margin:8px}.bk-step p{font-size:12px;color:#748597;line-height:1.45;margin:0}
      .bk-safety{margin:10px 7% 45px;padding:22px 26px;border:1px solid #dfeaf4;border-radius:20px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(90deg,#fff,#f5faff);box-shadow:0 12px 35px #173b5c0a}.bk-safety-copy{display:flex;align-items:center;gap:15px}.bk-safety-icon{width:52px;height:52px;border-radius:15px;background:#fff0e9;display:grid;place-items:center;font-size:25px}.bk-safety h3{margin:0 0 5px;color:var(--bk-navy)}.bk-safety p{margin:0;color:#708195;font-size:13px}.bk-safety p span{margin:0 7px;color:#9aa8b6}
      .bk-cta{margin:0 0 0;padding:70px 7%;background:linear-gradient(110deg,#062b55,#0b4c83);color:#fff;position:relative;overflow:hidden}.bk-cta:after{content:"";position:absolute;right:-100px;bottom:-170px;width:500px;height:500px;border-radius:50%;border:80px solid #ffffff10}.bk-cta-inner{display:flex;align-items:center;justify-content:space-between;gap:30px;position:relative;z-index:1}.bk-cta h2{font-size:clamp(34px,4vw,54px);line-height:1;margin:0 0 10px;letter-spacing:-2px}.bk-cta h2 span{color:#ff6a22}.bk-cta p{margin:0;color:#c8d9e8}.bk-cta .bk-btn{background:var(--bk-orange);color:#fff!important;min-width:190px}
      @media(max-width:1000px){.bk-hero{grid-template-columns:1fr;padding-top:55px}.bk-hero-art{min-height:520px}.bk-features,.bk-steps{grid-template-columns:repeat(2,1fr)}.bk-benefits{grid-template-columns:repeat(2,1fr)}.bk-benefit:nth-child(2){border:0}.bk-phone{right:3%}}
      @media(max-width:600px){.bk-hero{padding:42px 5% 30px}.bk-hero h1{font-size:52px;letter-spacing:-3px}.bk-hero p{font-size:16px}.bk-hero-art{min-height:430px}.bk-scene{inset:20px 0 0;border-radius:25px}.bk-phone{width:185px;height:390px;right:-5px;border-width:7px;border-radius:27px}.bk-phone-screen{padding:12px 10px}.bk-phone-screen img{width:88px;height:72px;margin:14px auto 4px}.bk-phone-screen h3{font-size:14px}.bk-phone-btn{padding:8px;font-size:10px}.bk-mini-card{left:10px;top:25px}.bk-bike{transform:scale(.72);transform-origin:left bottom;left:2%;bottom:18px}.bk-features,.bk-steps{grid-template-columns:1fr}.bk-benefits{grid-template-columns:1fr 1fr;margin:0 5%}.bk-benefit{border-right:0}.bk-safety{margin:10px 5% 35px;display:block}.bk-safety .bk-btn{margin-top:15px;width:100%}.bk-cta{padding:55px 5%}.bk-cta-inner{display:block}.bk-cta .bk-btn{margin-top:20px;width:100%}}
    `;
    document.head.appendChild(style);

    var section=document.createElement('section');
    section.id='bikuboo-launch-home';
    section.className='bk-launch';
    section.innerHTML=`
      <div class="bk-hero">
        <div>
          <span class="bk-kicker"><i></i> A safer, smarter way to share rides</span>
          <h1>Ride Together<span>Go Further</span></h1>
          <p>A safer, smarter and more affordable bike pooling community. Find trusted riders going your way or share your own ride.</p>
          <div class="bk-actions"><a class="bk-btn primary" href="#find">⌕&nbsp; Find a Ride</a><a class="bk-btn secondary" href="#offer">＋&nbsp; Offer a Ride</a></div>
          <div class="bk-trust-row"><span><b>✓</b> Verified users</span><span><b>✓</b> Safety tools</span><span><b>✓</b> In-app chat</span></div>
        </div>
        <div class="bk-hero-art">
          <div class="bk-scene"><div class="bk-sky"></div><div class="bk-city"></div><div class="bk-road"></div><div class="bk-bike"><div class="bk-wheel a"></div><div class="bk-wheel b"></div><div class="bk-frame"></div><div class="bk-rider"></div></div></div>
          <div class="bk-mini-card"><b>🏍️ BIKUBOO ride</b><small>Verified • nearby • trusted</small></div>
          <div class="bk-phone"><div class="bk-phone-top"></div><div class="bk-phone-screen"><img src="assets/bikuboo-logo.webp" alt="BIKUBOO"><h3>Welcome to BIKUBOO</h3><p>A safer, smarter and more affordable bike pooling community.</p><span class="bk-phone-btn o">Create Account</span><span class="bk-phone-btn w">Login</span><div class="bk-phone-icons"><span>G</span><span>●</span><span>⌕</span></div></div></div>
        </div>
      </div>
      <div class="bk-features">
        <article class="bk-feature"><div class="bk-feature-icon">🏍️</div><h3>Find a Ride</h3><p>Discover verified riders going your way.</p></article>
        <article class="bk-feature"><div class="bk-feature-icon">👤＋</div><h3>Offer a Ride</h3><p>Share your ride and help others.</p></article>
        <article class="bk-feature"><div class="bk-feature-icon">🛡️</div><h3>Verified Users</h3><p>Trusted community with safety first.</p></article>
        <article class="bk-feature"><div class="bk-feature-icon">🎁</div><h3>Earn Rewards</h3><p>Refer friends and earn ₹50 rewards.</p></article>
      </div>
      <div class="bk-benefits"><div class="bk-benefit"><b>👥 SHARE RIDES</b><span>Travel together</span></div><div class="bk-benefit"><b>🪙 SAVE COSTS</b><span>Spend less</span></div><div class="bk-benefit"><b>🌿 CLEANER TOMORROW</b><span>A greener planet</span></div><div class="bk-benefit"><b>❤️ STRONGER COMMUNITIES</b><span>A better tomorrow</span></div></div>
      <div class="bk-how"><h2>How <span>BIKUBOO</span> Works</h2><p>Get started in minutes and make every ride count.</p><div class="bk-steps"><div class="bk-step"><div class="bk-step-num">1</div><div class="bk-step-icon">👤</div><h3>Create Account</h3><p>Sign up and build your trusted profile.</p></div><div class="bk-step"><div class="bk-step-num">2</div><div class="bk-step-icon">⌕</div><h3>Find or Offer a Ride</h3><p>Choose your route or share your ride.</p></div><div class="bk-step"><div class="bk-step-num">3</div><div class="bk-step-icon">👥</div><h3>Connect & Ride</h3><p>Chat, confirm and ride together.</p></div><div class="bk-step"><div class="bk-step-num">4</div><div class="bk-step-icon">✓</div><h3>Reach Your Destination</h3><p>Save money and make a difference.</p></div></div></div>
      <div class="bk-safety"><div class="bk-safety-copy"><div class="bk-safety-icon">🛡️</div><div><h3>Your Safety, Our Priority</h3><p>Verified users <span>•</span> OTP verification <span>•</span> In-app chat <span>•</span> SOS support</p></div></div><a class="bk-btn secondary" href="#safety">Learn More</a></div>
      <div class="bk-cta"><div class="bk-cta-inner"><div><h2>Join BIKUBOO for a <span>Smarter Tomorrow</span></h2><p>Same routes. New connections. A better tomorrow.</p></div><a class="bk-btn" href="#find">Get Started Today →</a></div></div>
    `;
    find.parentNode.insertBefore(section,find);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
