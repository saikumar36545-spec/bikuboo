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
      :root{
        --bk-green:#a8df65;--bk-green-dark:#5c8d2f;--bk-ink:#182019;
        --bk-muted:#68736a;--bk-soft:#f4f7f1;--bk-line:#dfe7da;
        --bk-white:#fff;--bk-orange:#ff6a2a
      }
      .bk-launch{font-family:Inter,Arial,sans-serif;background:#fff;color:var(--bk-ink);overflow:hidden}
      .bk-launch *{box-sizing:border-box}
      .bk-top{background:#f7faf4;border-bottom:1px solid #e7eee2;padding:9px 7%;text-align:center;font-size:12px;font-weight:800;color:#5b675d}
      .bk-top b{color:var(--bk-green-dark)}
      .bk-mainhero{padding:64px 7% 52px;background:linear-gradient(180deg,#f7faf4 0%,#fff 88%);position:relative}
      .bk-mainhero:after{content:"";position:absolute;left:-120px;bottom:-180px;width:380px;height:380px;border-radius:50%;background:#eef7e5;filter:blur(4px);z-index:0}.bk-floating-orb{position:absolute;border-radius:50%;z-index:1;pointer-events:none}.orb1{width:12px;height:12px;background:#a8df65;right:17%;top:20%;animation:bkFloat 5s ease-in-out infinite}.orb2{width:8px;height:8px;background:#ff6a2a;right:8%;bottom:28%;animation:bkFloat 7s ease-in-out infinite reverse}@keyframes bkFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-18px,0)}}.bk-mainhero:before{content:"";position:absolute;width:520px;height:520px;right:-180px;top:-250px;border-radius:50%;background:#eaf5dc}
      .bk-hero-grid{z-index:2;position:relative;display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:42px;align-items:center;max-width:1240px;margin:auto}
      .bk-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:900;color:#557c31;text-transform:uppercase;letter-spacing:1.4px}
      .bk-eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--bk-orange)}
      .bk-mainhero h1{font-size:clamp(46px,5.6vw,72px);line-height:.98;letter-spacing:-4px;margin:15px 0 18px;max-width:620px}
      .bk-mainhero h1 span{color:#6fa83c}
      .bk-mainhero .lead{font-size:18px;line-height:1.6;color:#647067;max-width:590px;margin:0 0 26px}
      .bk-proof{display:flex;gap:20px;flex-wrap:wrap;color:#526054;font-size:13px;font-weight:800;margin-top:22px}
      .bk-proof span{display:flex;animation:bkProof 1s both}.bk-proof span:nth-child(2){animation-delay:.15s}.bk-proof span:nth-child(3){animation-delay:.3s}@keyframes bkProof{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}align-items:center;gap:7px}.bk-proof b{color:#6b9e3b}
      .bk-search-card{animation:bkCardIn .8s cubic-bezier(.2,.8,.2,1) both;transform-origin:center}@keyframes bkCardIn{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:none}}background:#fff;border:1px solid #dce6d8;border-radius:22px;padding:22px;box-shadow:0 22px 55px #2d41240f}
      .bk-search-card:before{content:"";position:absolute;top:0;left:-120%;width:80%;height:2px;background:linear-gradient(90deg,transparent,#a8df65,transparent);animation:bkScan 4s linear infinite}@keyframes bkScan{0%{left:-120%}100%{left:140%}}.bk-search-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}
      .bk-search-head h2{font-size:21px;margin:0;letter-spacing:-.5px}
      .bk-search-head span{font-size:12px;font-weight:800;color:#728073}
      .bk-route-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .bk-field{border:1px solid #d9e2d5;border-radius:12px;padding:11px 13px;background:#fff}
      .bk-field small{display:block;color:#778277;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}
      .bk-field strong{font-size:14px;color:#273229}
      .bk-field{transition:border-color .2s,box-shadow .2s,transform .2s}.bk-field:focus-within{border-color:#a8df65;box-shadow:0 0 0 4px #a8df651f;transform:translateY(-1px)}.bk-field input{border:0;outline:0;width:100%;font:inherit;color:#273229;background:transparent}
      .bk-search-row{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin-top:10px}
      .bk-search-btn,.bk-offer-btn{border:0;border-radius:12px;padding:13px 17px;font-weight:900;cursor:pointer;text-align:center}
      .bk-search-btn{position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s;background:var(--bk-green);color:#17200f}
      .bk-offer-btn{background:#fff;border:1px solid #cfdacb!important;color:#29362b}
      .bk-search-note{display:flex;gap:8px;align-items:center;margin-top:14px;padding-top:13px;border-top:1px solid #edf1eb;color:#758076;font-size:11px}
      .bk-search-note b{color:#5f8f34}
      .bk-route-preview{transition:transform .25s,box-shadow .25s}.bk-route-preview:hover{transform:translateY(-2px);box-shadow:0 12px 25px #24351f0c}.bk-route-preview{margin-top:18px;border-radius:16px;background:#f5f8f2;border:1px solid #e3eadf;padding:13px 15px}
      .bk-route-preview-top{display:flex;justify-content:space-between;font-size:11px;color:#68756a;font-weight:800}
      .bk-route-line{height:38px;position:relative;margin:2px 7px}
      .bk-route-line:before{content:"";position:absolute;left:8px;right:8px;top:18px;border-top:2px dashed #91ad78;animation:bkRouteDash 2s linear infinite}@keyframes bkRouteDash{to{transform:translateX(12px)}}
      .bk-dot{position:absolute;top:12px;width:13px;height:13px;border-radius:50%;background:#fff;border:4px solid #6d9f3e}
      .bk-dot.a{left:0}.bk-dot.b{right:0}
      .bk-route-labels{display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#2c382e}
      .bk-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}.bk-reveal.is-visible{opacity:1;transform:none}.bk-quick{padding:0 7% 42px;max-width:1240px;margin:auto}
      .bk-quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .bk-quick-card{border:1px solid var(--bk-line);border-radius:17px;padding:19px;background:#fff;transition:.2s}
      .bk-quick-card{position:relative;overflow:hidden;animation:bkRise .65s both}.bk-quick-card:nth-child(2){animation-delay:.08s}.bk-quick-card:nth-child(3){animation-delay:.16s}.bk-quick-card:nth-child(4){animation-delay:.24s}@keyframes bkRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}.bk-quick-card:after{content:"";position:absolute;width:70px;height:70px;border-radius:50%;background:#a8df6515;right:-25px;bottom:-25px;transition:transform .3s}.bk-quick-card:hover:after{transform:scale(2.2)}.bk-quick-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px #24351f10}
      .bk-quick-icon{font-size:23px;margin-bottom:10px}.bk-quick-card h3{font-size:15px;margin:0 0 5px}.bk-quick-card p{font-size:12px;line-height:1.45;color:#748075;margin:0}
      .bk-rider-gallery{padding:8px 7% 64px;max-width:1240px;margin:auto}.bk-gallery-grid{display:grid;grid-template-columns:1.45fr .85fr;gap:14px}.bk-gallery-card{position:relative;min-height:310px;border-radius:24px;overflow:hidden;border:1px solid #dce7d8;background:#e8efe3;box-shadow:0 14px 35px #24351f0c}.bk-gallery-card img{width:100%;height:100%;min-height:310px;display:block;object-fit:cover;transition:transform .6s ease}.bk-gallery-card:hover img{transform:scale(1.04)}.bk-gallery-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,#102015c7 100%);pointer-events:none}.bk-gallery-copy{position:absolute;z-index:2;left:22px;right:22px;bottom:20px;color:#fff}.bk-gallery-copy small{display:block;font-size:10px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;opacity:.82;margin-bottom:5px}.bk-gallery-copy strong{font-size:20px;letter-spacing:-.5px}.bk-gallery-copy span{display:block;font-size:11px;opacity:.8;margin-top:4px}.bk-gallery-side{display:grid;gap:14px}.bk-gallery-side .bk-gallery-card{min-height:148px}.bk-gallery-side .bk-gallery-card img{min-height:148px}.bk-gallery-side .bk-gallery-copy{left:16px;right:16px;bottom:14px}.bk-gallery-side .bk-gallery-copy strong{font-size:15px}@media(max-width:600px){.bk-rider-gallery{padding:0 5% 48px}.bk-gallery-grid{grid-template-columns:1fr}.bk-gallery-card,.bk-gallery-card img{min-height:250px}.bk-gallery-side{grid-template-columns:1fr 1fr}.bk-gallery-side .bk-gallery-card,.bk-gallery-side .bk-gallery-card img{min-height:170px}.bk-gallery-side .bk-gallery-copy strong{font-size:13px}}\n      .bk-popular{padding:65px 7%;background:#fff;max-width:1240px;margin:auto}
      .bk-section-head{text-align:center;max-width:650px;margin:0 auto 30px}
      .bk-section-head small{font-size:11px;font-weight:900;letter-spacing:1.5px;color:#69953d}
      .bk-section-head h2{font-size:clamp(32px,4vw,46px);letter-spacing:-2.5px;margin:7px 0 9px}
      .bk-section-head p{color:#717d73;margin:0;line-height:1.55}
      .bk-route-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .bk-route-card{position:relative;overflow:hidden;display:flex;transition:transform .2s,box-shadow .2s;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--bk-line);border-radius:16px;padding:17px 18px;background:#fff}
      .bk-route-card strong{display:block;font-size:14px}.bk-route-card small{display:block;color:#7b857d;margin-top:4px;font-size:11px}
      .bk-route-card span{font-size:18px;color:#7ba44d;transition:transform .2s}.bk-route-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#a8df65;transform:scaleY(0);transform-origin:center;transition:transform .25s}.bk-route-card:hover:before{transform:scaleY(1)}.bk-route-card:hover{transform:translateY(-4px);box-shadow:0 14px 28px #24351f12}.bk-route-card:hover span{transform:translateX(5px)}
      .bk-split{margin:10px 7% 65px;border-radius:26px;background:#f4f8ef;padding:55px 6%;display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}
      .bk-split{overflow:hidden;position:relative}.bk-split:after{content:"";position:absolute;width:260px;height:260px;border-radius:50%;right:-130px;top:-130px;border:1px solid #a8df6544;animation:bkOrbit 9s linear infinite}@keyframes bkOrbit{to{transform:rotate(360deg)}}.bk-split h2{font-size:clamp(32px,4vw,48px);letter-spacing:-2.5px;margin:8px 0 13px}.bk-split p{color:#69756b;line-height:1.6;max-width:560px}
      .bk-split-points{display:grid;gap:13px;margin-top:22px}.bk-split-point{display:flex;gap:11px;align-items:flex-start}.bk-split-point b{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#dfeecf;color:#5c8d2f;font-size:12px;flex:none}.bk-split-point strong{font-size:13px}.bk-split-point span{display:block;color:#788278;font-size:11px;margin-top:2px}
      .bk-map-pulse{position:absolute;width:18px;height:18px;border-radius:50%;background:#a8df65;left:24%;top:32%;z-index:4;box-shadow:0 0 0 0 #a8df6566;animation:bkPulse 2.2s infinite}.bk-map-pulse:after{content:"";position:absolute;inset:-5px;border:1px solid #79a94f;border-radius:50%;animation:bkPing 2.2s infinite}@keyframes bkPulse{70%{box-shadow:0 0 0 18px #a8df6500}}@keyframes bkPing{0%{transform:scale(.7);opacity:1}100%{transform:scale(2.3);opacity:0}}.bk-visual-card{min-height:300px;border-radius:23px;background:linear-gradient(145deg,#dfead6,#f9fbf7);border:1px solid #d5e1cd;position:relative;overflow:hidden}
      .bk-road-art{position:absolute;left:-10%;right:-10%;bottom:-100px;height:270px;background:#344336;border-radius:50% 50% 0 0;transform:perspective(300px) rotateX(52deg)}
      .bk-road-art:after{content:"";position:absolute;left:50%;height:100%;border-left:5px dashed #dce7d6}
      .bk-bike-art{position:absolute;animation:bkBikeFloat 4s ease-in-out infinite;left:50%;top:54%;transform:translate(-50%,-50%);font-size:95px;filter:drop-shadow(0 15px 14px #1b2a1a22)}
      .bk-badge{position:absolute;top:18px;left:18px;background:#fff;border:1px solid #dce6d8;border-radius:13px;padding:10px 12px;box-shadow:0 10px 25px #24351f10;font-size:11px;font-weight:900}
      .bk-how2{position:relative;padding:65px 7%;background:#fff}
      .bk-steps2{max-width:1000px;margin:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:25px}
      .bk-step2{text-align:center;position:relative;transition:transform .25s}.bk-step2:hover{transform:translateY(-7px)}.bk-step2:hover .bk-num{background:#dfeecf;box-shadow:0 8px 18px #6b9e3b20}.bk-step2:not(:last-child):after{content:"→";position:absolute;right:-20px;top:19px;color:#9aaa96;font-size:22px}
      .bk-num{width:40px;height:40px;border-radius:50%;background:#eff5e9;color:#5e8e35;display:grid;place-items:center;font-weight:900;margin:0 auto 12px}
      .bk-step2 h3{font-size:14px;margin:0 0 6px}.bk-step2 p{font-size:11px;line-height:1.5;color:#7a857c;margin:0}
      .bk-safety2{transition:transform .25s,box-shadow .25s}.bk-safety2:hover{transform:translateY(-3px);box-shadow:0 15px 30px #24351f0d}.bk-safety2{margin:0 7% 65px;padding:24px 28px;border:1px solid #dce7d8;border-radius:20px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:25px}
      .bk-safe-copy{display:flex;align-items:center;gap:14px}.bk-safe-icon{width:48px;height:48px;border-radius:14px;background:#edf6e6;display:grid;place-items:center;font-size:23px}.bk-safe-copy h3{margin:0 0 4px;font-size:16px}.bk-safe-copy p{margin:0;color:#78837a;font-size:12px}
      .bk-safe-btn{background:#fff;border:1px solid #cbd8c6;border-radius:11px;padding:11px 16px;font-weight:900;cursor:pointer}
      @keyframes bkBikeFloat{0%,100%{transform:translate(-50%,-50%) rotate(-2deg)}50%{transform:translate(-50%,-56%) rotate(2deg)}}.bk-final{background:#182019;color:#fff;padding:62px 7%;text-align:center}.bk-final{position:relative;overflow:hidden}.bk-final:before,.bk-final:after{content:"";position:absolute;border:1px solid #a8df6522;border-radius:50%;pointer-events:none}.bk-final:before{width:420px;height:420px;left:-220px;top:-210px}.bk-final:after{width:560px;height:560px;right:-300px;bottom:-300px}.bk-final h2{font-size:clamp(32px,4vw,50px);letter-spacing:-2.5px;margin:0 0 10px}.bk-final h2 span{color:var(--bk-green)}.bk-final p{color:#b9c2b8;margin:0 0 22px}.bk-final a{display:inline-flex;transition:transform .2s,box-shadow .2s;background:var(--bk-green);color:#182019;padding:13px 20px;border-radius:12px;font-weight:900}.bk-final a:hover{transform:translateY(-3px);box-shadow:0 12px 25px #a8df6540}
      @media(max-width:950px){.bk-hero-grid{grid-template-columns:1fr;gap:35px}.bk-quick-grid{grid-template-columns:repeat(2,1fr)}.bk-route-grid{grid-template-columns:repeat(2,1fr)}.bk-split{grid-template-columns:1fr}.bk-steps2{grid-template-columns:repeat(2,1fr)}.bk-step2:nth-child(2):after{display:none}}
      @media(max-width:600px){.bk-mainhero{padding:42px 5% 35px}.bk-mainhero h1{letter-spacing:-3px}.bk-mainhero .lead{font-size:16px}.bk-route-fields,.bk-search-row{grid-template-columns:1fr}.bk-search-row .bk-search-btn,.bk-search-row .bk-offer-btn{width:100%}.bk-quick{padding:0 5% 30px}.bk-quick-grid,.bk-route-grid{grid-template-columns:1fr}.bk-popular{padding:48px 5%}.bk-split{margin:0 5% 48px;padding:35px 25px}.bk-how2{padding:48px 5%}.bk-steps2{grid-template-columns:1fr 1fr;gap:24px 14px}.bk-step2:after{display:none!important}.bk-safety2{margin:0 5% 48px;display:block}.bk-safe-btn{margin-top:15px;width:100%}.bk-final{padding:50px 5%}}
      .bk-intercity-wrap{padding:0 7% 64px;max-width:1240px;margin:auto}
      .bk-intercity-visual{position:relative;min-height:540px;border-radius:30px;overflow:hidden;border:1px solid #d7e5d1;background:linear-gradient(135deg,#e9f5ff 0%,#fffdf3 45%,#dcedd1 100%);box-shadow:0 24px 60px rgba(30,50,25,.12);isolation:isolate}
      .bk-intercity-sky{position:absolute;inset:0;background:radial-gradient(circle at 18% 20%,rgba(255,255,255,.95),transparent 27%),radial-gradient(circle at 82% 18%,rgba(255,255,255,.85),transparent 23%),linear-gradient(180deg,rgba(220,239,255,.4),transparent 55%);z-index:0}
      .bk-intercity-road{position:absolute;left:-8%;right:-8%;bottom:-30%;height:57%;background:linear-gradient(180deg,#536256,#27372b);border-radius:50% 50% 0 0;transform:perspective(500px) rotateX(42deg);z-index:1;box-shadow:0 -20px 50px rgba(25,40,28,.16)}
      .bk-intercity-road:after{content:"";position:absolute;left:50%;top:0;height:100%;border-left:6px dashed rgba(255,255,255,.82)}
      .bk-intercity-rider{position:absolute;z-index:4;left:13%;bottom:9%;font-size:110px;filter:drop-shadow(0 15px 14px rgba(20,30,20,.28));transform:rotate(-5deg)}
      .bk-intercity-badge{position:absolute;z-index:6;left:5%;top:6%;padding:9px 13px;border-radius:12px;background:#172019;color:#fff;font-size:10px;font-weight:900;letter-spacing:1px;box-shadow:0 10px 25px rgba(20,32,22,.2)}
      .bk-intercity-copy{position:absolute;z-index:6;right:5%;top:7%;max-width:310px;text-align:right}.bk-intercity-copy small{display:block;color:#557c31;font-size:10px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase}.bk-intercity-copy strong{display:block;margin-top:6px;color:#182019;font-size:30px;line-height:1.02;letter-spacing:-1.4px}.bk-intercity-copy strong span{color:#159447}
      .bk-city-card{position:absolute;z-index:7;display:flex;align-items:center;gap:9px;padding:10px 13px;border-radius:14px;background:rgba(255,255,255,.94);border:1px solid #d6e4d1;box-shadow:0 10px 25px rgba(30,50,25,.13);font-size:12px;font-weight:900;color:#243127;white-space:nowrap}.bk-city-card i{width:9px;height:9px;border-radius:50%;background:#159447;box-shadow:0 0 0 5px rgba(21,148,71,.12)}
      .bk-city-hyd{top:18%;left:47%}.bk-city-viz{top:36%;left:6%}.bk-city-vij{top:32%;right:6%}.bk-city-tir{top:50%;right:12%}.bk-city-bng{top:65%;right:26%}
      .bk-route-path{position:absolute;z-index:5;left:42%;top:22%;width:31%;height:43%;border-right:3px dashed rgba(21,148,71,.7);border-bottom:3px dashed rgba(21,148,71,.7);border-radius:0 0 80% 0;transform:rotate(8deg)}
      .bk-route-node{position:absolute;z-index:8;width:14px;height:14px;border-radius:50%;background:#fff;border:4px solid #159447;box-shadow:0 5px 12px rgba(20,60,35,.25)}.bk-node-a{top:21%;left:45%}.bk-node-b{top:37%;left:59%}.bk-node-c{top:51%;left:64%}.bk-node-d{top:65%;left:71%}
      .bk-intercity-sign{position:absolute;z-index:7;right:5%;bottom:9%;padding:12px 17px;border-radius:9px;background:#1d4c3a;color:#fff;font-size:13px;font-weight:900;box-shadow:0 10px 20px rgba(20,30,20,.2)}.bk-intercity-sign span{display:block;margin-top:3px;color:#b9ef83;font-size:9px}
      @media(max-width:760px){.bk-intercity-wrap{padding:0 5% 48px}.bk-intercity-visual{min-height:430px;border-radius:24px}.bk-intercity-copy{right:5%;top:10%;max-width:190px}.bk-intercity-copy strong{font-size:21px}.bk-intercity-rider{font-size:78px;left:4%;bottom:10%}.bk-city-card{font-size:9px;padding:7px 9px;gap:6px}.bk-city-hyd{top:20%;left:42%}.bk-city-viz{top:40%;left:3%}.bk-city-vij{top:35%;right:3%}.bk-city-tir{top:52%;right:6%}.bk-city-bng{top:67%;right:18%}.bk-route-path{left:31%;width:42%}.bk-intercity-sign{right:3%;bottom:7%;font-size:10px}}
    `;
    document.head.appendChild(style);

    var section=document.createElement('section');
    section.id='bikuboo-launch-home';
    section.className='bk-launch';
    section.innerHTML=`
      <div class="bk-top"><b>BIKUBOO</b> · Share everyday rides, save on travel and meet trusted riders.</div>

      <div class="bk-floating-orb orb1"></div><div class="bk-floating-orb orb2"></div><div class="bk-mainhero">
        <div class="bk-hero-grid">
          <div>
            <div class="bk-eyebrow"><i></i> Bike pooling made simple</div>
            <h1>Travel together.<br><span>Spend smarter.</span></h1>
            <p class="lead">Find a trusted rider going your way, or share your empty seat. BIKUBOO makes everyday bike pooling simple, social and safety-focused.</p>
            <div class="bk-proof"><span><b>✓</b> Verified profiles</span><span><b>✓</b> Private chat</span><span><b>✓</b> Safety tools</span></div>
          </div>

          <div class="bk-search-card" aria-label="Find a BIKUBOO ride">
            <div class="bk-search-head"><h2>Find a ride</h2><span>Go where you need to go</span></div>
            <div class="bk-route-fields">
              <label class="bk-field"><small>From</small><input id="bkHomeFrom" placeholder="City or place"></label>
              <label class="bk-field"><small>To</small><input id="bkHomeTo" placeholder="City or place"></label>
            </div>
            <div class="bk-search-row">
              <label class="bk-field"><small>Date</small><input id="bkHomeDate" type="date"></label>
              <label class="bk-field"><small>Passengers</small><input id="bkHomePassengers" type="number" min="1" max="3" value="1"></label>
              <button class="bk-search-btn" id="bkHomeSearch" type="button">Search rides</button>
            </div>
            <div class="bk-route-preview"><div class="bk-route-preview-top"><span>Popular route example</span><span id="bkRouteLive">Live</span></div><div class="bk-route-line"><i class="bk-dot a"></i><i class="bk-dot b"></i></div><div class="bk-route-labels"><span>Narasaraopet</span><span>Hyderabad</span></div></div>
            <div class="bk-search-note"><b>🛡</b> Ride with verified community members and keep conversations inside BIKUBOO.</div>
            <button class="bk-offer-btn" id="bkHomeOffer" type="button" style="width:100%;margin-top:10px">＋ Offer a ride</button>
          </div>
        </div>
      </div>

      <div class="bk-quick bk-reveal">
        <div class="bk-quick-grid">
          <article class="bk-quick-card"><div class="bk-quick-icon">🏍️</div><h3>Find a ride</h3><p>Search routes and discover riders going your way.</p></article>
          <article class="bk-quick-card"><div class="bk-quick-icon">＋</div><h3>Offer a ride</h3><p>Share an empty seat and split everyday travel costs.</p></article>
          <article class="bk-quick-card"><div class="bk-quick-icon">🛡️</div><h3>Ride with confidence</h3><p>Profiles, verification and safety tools before you ride.</p></article>
          <article class="bk-quick-card"><div class="bk-quick-icon">💬</div><h3>Stay connected</h3><p>Coordinate through private in-platform conversations.</p></article>
        </div>
      </div>

      <div class="bk-intercity-wrap bk-reveal">
        <div class="bk-section-head"><small>INTERCITY RIDE SHARING</small><h2>One ride. Many destinations.</h2><p>Connect cities, share the journey and travel farther together.</p></div>
        <div class="bk-intercity-visual" aria-label="Intercity ride sharing visual">
          <div class="bk-intercity-sky"></div>
          <div class="bk-intercity-badge">BIKUBOO · INTERCITY</div>
          <div class="bk-intercity-copy"><small>Same roads. More people.</small><strong>Greater <span>destinations.</span></strong></div>
          <div class="bk-city-card bk-city-hyd"><i></i>Hyderabad</div>
          <div class="bk-city-card bk-city-vij"><i></i>Vijayawada</div>
          <div class="bk-city-card bk-city-tir"><i></i>Tirupati</div>
          <div class="bk-city-card bk-city-bng"><i></i>Bengaluru</div>
          <div class="bk-city-card bk-city-viz"><i></i>Visakhapatnam</div>
          <div class="bk-route-path"></div>
          <i class="bk-route-node bk-node-a"></i><i class="bk-route-node bk-node-b"></i><i class="bk-route-node bk-node-c"></i><i class="bk-route-node bk-node-d"></i>
          <div class="bk-intercity-road"></div><div class="bk-intercity-rider">🏍️</div>
          <div class="bk-intercity-sign">More cities · More people<span>Travel together. Go further.</span></div>
        </div>
      </div>

      <div class="bk-popular bk-reveal">
        <div class="bk-section-head"><small>POPULAR ROUTES</small><h2>Where are people going?</h2><p>Start with a route, then choose the ride that fits your plans.</p></div>
        <div class="bk-route-grid">
          <div class="bk-route-card"><div><strong>Narasaraopet → Hyderabad</strong><small>Everyday travel</small></div><span>→</span></div>
          <div class="bk-route-card"><div><strong>Guntur → Vijayawada</strong><small>Popular local route</small></div><span>→</span></div>
          <div class="bk-route-card"><div><strong>Hyderabad → Vijayawada</strong><small>City-to-city</small></div><span>→</span></div>
          <div class="bk-route-card"><div><strong>Guntur → Hyderabad</strong><small>Shared journeys</small></div><span>→</span></div>
          <div class="bk-route-card"><div><strong>Vijayawada → Guntur</strong><small>Daily commuters</small></div><span>→</span></div>
          <div class="bk-route-card"><div><strong>Narasaraopet → Guntur</strong><small>Nearby rides</small></div><span>→</span></div>
        </div>
      </div>

      <div class="bk-split bk-reveal">
        <div>
          <div class="bk-eyebrow"><i></i> Share the journey</div>
          <h2>Turn empty seats into shared journeys.</h2>
          <p>Driving somewhere anyway? Offer your spare seat and let another rider share the journey and the cost.</p>
          <div class="bk-split-points">
            <div class="bk-split-point"><b>✓</b><div><strong>Keep your route</strong><span>You decide where and when you travel.</span></div></div>
            <div class="bk-split-point"><b>✓</b><div><strong>Choose who rides with you</strong><span>Review rider details before accepting a request.</span></div></div>
            <div class="bk-split-point"><b>✓</b><div><strong>Share travel costs</strong><span>Make everyday journeys more affordable.</span></div></div>
          </div>
        </div>
        <div class="bk-visual-card"><div class="bk-map-pulse"></div><div class="bk-badge">🛡 Verified community</div><div class="bk-bike-art">🏍️</div><div class="bk-road-art"></div></div>
      </div>

      <div class="bk-how2 bk-reveal">
        <div class="bk-section-head"><small>HOW IT WORKS</small><h2>Simple from search to ride.</h2><p>Everything you need is right inside BIKUBOO.</p></div>
        <div class="bk-steps2">
          <div class="bk-step2"><div class="bk-num">1</div><h3>Create your profile</h3><p>Add your details and build trust with other riders.</p></div>
          <div class="bk-step2"><div class="bk-num">2</div><h3>Find or offer a ride</h3><p>Search your route or publish your own journey.</p></div>
          <div class="bk-step2"><div class="bk-num">3</div><h3>Connect safely</h3><p>Request, accept and chat privately inside BIKUBOO.</p></div>
          <div class="bk-step2"><div class="bk-num">4</div><h3>Ride together</h3><p>Confirm the ride and travel with confidence.</p></div>
        </div>
      </div>

      <div class="bk-safety2 bk-reveal"><div class="bk-safe-copy"><div class="bk-safe-icon">🛡️</div><div><h3>Safety comes first</h3><p>Verification, ride-start checks, private chat and emergency tools help make every journey more comfortable.</p></div></div><button class="bk-safe-btn" id="bkSafetyBtn" type="button">Explore safety</button></div>

      <div class="bk-final bk-reveal"><h2>Ready to <span>share the ride?</span></h2><p>Find your next journey or offer a seat to someone going your way.</p><a href="#find" id="bkFinalFind">Find a ride →</a></div>
    `;
    find.parentNode.insertBefore(section,find);
    document.body.classList.add('bk-home-ready');

    function wire(){
      var live=document.getElementById('bkRouteLive');
      if(live){setInterval(function(){live.textContent=live.textContent==='Live'?'Updating':'Live'},2400)}
      var from=document.getElementById('bkHomeFrom'),to=document.getElementById('bkHomeTo'),date=document.getElementById('bkHomeDate'),pass=document.getElementById('bkHomePassengers');
      var findBtn=document.getElementById('bkHomeSearch'),offerBtn=document.getElementById('bkHomeOffer'),safetyBtn=document.getElementById('bkSafetyBtn');
      if(date && !date.value) date.value=new Date().toISOString().slice(0,10);
      if(findBtn) findBtn.onclick=function(){
        var realFrom=document.getElementById('from'),realTo=document.getElementById('to'),realDate=document.getElementById('date'),realPass=document.getElementById('passengers');
        if(realFrom && from) realFrom.value=from.value;
        if(realTo && to) realTo.value=to.value;
        if(realDate && date) realDate.value=date.value;
        if(realPass && pass) realPass.value=pass.value;
        if(typeof window.searchRides==='function') window.searchRides();
        else document.getElementById('find')?.scrollIntoView({behavior:'smooth'});
      };
      if(offerBtn) offerBtn.onclick=function(){document.getElementById('offer')?.scrollIntoView({behavior:'smooth'});};
      if(safetyBtn) safetyBtn.onclick=function(){document.getElementById('safety')?.scrollIntoView({behavior:'smooth'});};
    }
    wire();
    var revealEls=document.querySelectorAll('#bikuboo-launch-home .bk-reveal');
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:.12});
      revealEls.forEach(function(el){io.observe(el)});
    }else revealEls.forEach(function(el){el.classList.add('is-visible')});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();