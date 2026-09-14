(function(){
  const style=document.createElement('style');
  style.textContent=`
    .auth-launcher{margin:0 auto 18px;max-width:1180px;padding:0 20px}
    .auth-launcher-card{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border-radius:20px;background:linear-gradient(135deg,#17102d,#32146b 55%,#7b3ff2);color:#fff;box-shadow:0 16px 40px rgba(53,22,105,.22)}
    .auth-launcher-copy{display:flex;align-items:center;gap:12px;min-width:0}.auth-launcher-icon{font-size:28px}.auth-launcher-copy b{display:block;font-size:16px}.auth-launcher-copy small{display:block;opacity:.82;margin-top:3px}
    .auth-launcher-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.auth-launcher-actions button{border:0;border-radius:12px;padding:11px 16px;font-weight:800;cursor:pointer}.auth-login-btn{background:#fff;color:#28104f}.auth-signup-btn{background:#b7f36b;color:#08120b}.auth-logout-btn{background:#fff;color:#28104f}
    .auth-launcher.logged-in{background:linear-gradient(135deg,#12351d,#176b35 55%,#37b66a)}
    @media(max-width:700px){.auth-launcher{padding:0 12px;margin-bottom:12px}.auth-launcher-card{align-items:flex-start;padding:14px;flex-direction:column}.auth-launcher-actions{width:100%;justify-content:stretch}.auth-launcher-actions button{flex:1;min-width:0}}
  `;
  document.head.appendChild(style);

  function ensureLauncher(){
    let wrap=document.getElementById('authLauncher');
    if(wrap)return wrap;
    wrap=document.createElement('section');
    wrap.id='authLauncher';
    wrap.className='auth-launcher';
    const main=document.querySelector('main');
    if(main) main.parentNode.insertBefore(wrap,main);
    else document.body.prepend(wrap);
    return wrap;
  }

  function render(user){
    const wrap=ensureLauncher();
    if(user){
      const name=user.user_metadata?.full_name||user.email?.split('@')[0]||'Rider';
      wrap.innerHTML=`<div class="auth-launcher-card logged-in"><div class="auth-launcher-copy"><span class="auth-launcher-icon">👋</span><div><b>Welcome, ${String(name).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}</b><small>You are logged in to BIKUBOO.</small></div></div><div class="auth-launcher-actions"><button class="auth-logout-btn" id="authLauncherLogout">Log out</button></div></div>`;
      const btn=document.getElementById('authLauncherLogout');
      if(btn)btn.onclick=async()=>{const {error}=await supabaseClient.auth.signOut();if(error)alert(error.message);};
    }else{
      wrap.innerHTML=`<div class="auth-launcher-card"><div class="auth-launcher-copy"><span class="auth-launcher-icon">🏍️</span><div><b>Welcome to BIKUBOO</b><small>Log in or create your account to find, offer and request rides.</small></div></div><div class="auth-launcher-actions"><button class="auth-login-btn" id="authLauncherLogin">Log in</button><button class="auth-signup-btn" id="authLauncherSignup">Create account</button></div></div>`;
      document.getElementById('authLauncherLogin')?.addEventListener('click',()=>window.openModal?.('login'));
      document.getElementById('authLauncherSignup')?.addEventListener('click',()=>window.openModal?.('signup'));
    }
  }

  async function boot(){
    if(typeof supabaseClient==='undefined')return;
    try{const {data}=await supabaseClient.auth.getSession();render(data.session?.user||null);}catch(e){render(null);}
    supabaseClient.auth.onAuthStateChange((_event,session)=>render(session?.user||null));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
