(function(){
function init(){
var menu=document.getElementById('mobileMenuBtn'),nav=document.getElementById('mainNav');
if(!menu||!nav||document.getElementById('bkMobileMenuPanel'))return;
var p=document.createElement('div');p.id='bkMobileMenuPanel';
p.innerHTML=Array.from(nav.querySelectorAll('.nav-main')).map(function(a){return '<a href="'+(a.getAttribute('href')||'#')+'">'+a.textContent.trim()+'</a>'}).join('')+'<hr><a href="#activity">Activity</a><a href="#payments">Payments</a><a href="#rewards">Rewards</a>';
document.body.appendChild(p);
var s=document.createElement('style');s.textContent='#bkMobileMenuPanel{display:none!important;position:fixed!important;top:74px!important;left:12px!important;right:12px!important;z-index:2147483647!important;background:#fff!important;border:1px solid #dfe8d9!important;border-radius:18px!important;padding:8px!important;box-shadow:0 20px 55px rgba(15,35,20,.22)!important;max-height:calc(100vh - 88px)!important;overflow:auto!important}#bkMobileMenuPanel.open{display:block!important}#bkMobileMenuPanel a{display:flex!important;align-items:center!important;min-height:46px!important;padding:0 14px!important;color:#172019!important;background:#fff!important;text-decoration:none!important;font:700 15px/1.2 Arial,sans-serif!important;border-radius:11px!important}#bkMobileMenuPanel hr{border:0;border-top:1px solid #edf2ea;margin:6px 4px}@media(min-width:701px){#bkMobileMenuPanel{display:none!important}}';document.head.appendChild(s);
menu.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();var o=!p.classList.contains('open');p.classList.toggle('open',o);menu.setAttribute('aria-expanded',String(o));menu.textContent=o?'×':'☰'},true);
p.addEventListener('click',function(e){if(e.target.closest('a')){p.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();setTimeout(init,500);
})();