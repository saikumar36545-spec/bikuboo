/* BIKUBOO Admin Payments UI v1 — injected into the existing Admin panel. */
(function(){
  'use strict';
  function money(paise,currency){ const n=Number(paise||0)/100; return `${currency==='INR'?'₹':currency||'₹'}${n.toLocaleString('en-IN',{maximumFractionDigits:2})}`; }
  function esc(v){ return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])); }
  async function load(){
    const root=document.getElementById('adminPayments'); if(!root || !window.supabaseClient) return;
    root.innerHTML='<div class="admin-loading">Loading payment data…</div>';
    const {data,error}=await window.supabaseClient.rpc('bikuboo_admin_payments');
    if(error){ root.innerHTML=`<div class="admin-notice">${esc(error.message)}</div>`; return; }
    const rows=Array.isArray(data)?data:[];
    const range=(document.getElementById('adminPaymentRange')||{}).value||'all';
    const now=Date.now(), days=range==='7'?7:range==='30'?30:null;
    const filtered=days?rows.filter(r=>now-new Date(r.created_at).getTime()<=days*86400000):rows;
    const paid=filtered.filter(r=>r.status==='paid');
    const gross=paid.reduce((s,r)=>s+Number(r.amount_paise||0),0);
    const upi=paid.filter(r=>r.payment_method==='upi').reduce((s,r)=>s+Number(r.amount_paise||0),0);
    const cash=paid.filter(r=>r.payment_method==='cash').reduce((s,r)=>s+Number(r.amount_paise||0),0);
    const pending=filtered.filter(r=>['pending','cash_pending'].includes(r.status)).reduce((s,r)=>s+Number(r.amount_paise||0),0);
    const refunded=filtered.filter(r=>['refunded','cancelled','failed'].includes(r.status)).reduce((s,r)=>s+Number(r.amount_paise||0),0);
    const rate=Number(document.getElementById('adminCommissionRate')?.value||10)/100;
    const commission=Math.round(gross*rate);
    root.innerHTML=`<div class="admin-payment-toolbar"><div><h3>Revenue & Payments</h3><p>Business view of completed payment transactions.</p></div><div class="admin-payment-controls"><select id="adminPaymentRange"><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><label>Commission <input id="adminCommissionRate" type="number" min="0" max="100" step="0.5" value="${rate*100}">%</label><button class="secondary" id="adminPaymentsRefresh">Refresh</button></div></div>
    <div class="admin-payment-stats"><div class="admin-card"><span>GROSS PAID</span><h3>${money(gross,'INR')}</h3><p>${paid.length} paid transaction${paid.length===1?'':'s'}</p></div><div class="admin-card"><span>EST. COMMISSION</span><h3>${money(commission,'INR')}</h3><p>${rate*100}% planning rate</p></div><div class="admin-card"><span>UPI</span><h3>${money(upi,'INR')}</h3><p>Paid online</p></div><div class="admin-card"><span>CASH</span><h3>${money(cash,'INR')}</h3><p>Confirmed cash</p></div><div class="admin-card"><span>PENDING</span><h3>${money(pending,'INR')}</h3><p>Awaiting completion</p></div><div class="admin-card"><span>REFUNDED / FAILED</span><h3>${money(refunded,'INR')}</h3><p>Non-paid transactions</p></div></div>
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Date</th><th>Passenger</th><th>Driver</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>${filtered.length?filtered.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('en-IN')}</td><td>${esc(r.passenger_name)}</td><td>${esc(r.driver_name)}</td><td>${esc((r.payment_method||'—').toUpperCase())}</td><td><b>${money(r.amount_paise,r.currency)}</b></td><td><span class="admin-status">${esc(r.status)}</span></td></tr>`).join(''):'<tr><td colspan="6">No payment transactions found.</td></tr>'}</tbody></table></div>`;
    root.querySelector('#adminPaymentRange').value=range;
    root.querySelector('#adminPaymentRange').onchange=load;
    root.querySelector('#adminCommissionRate').onchange=load;
    root.querySelector('#adminPaymentsRefresh').onclick=load;
  }
  function install(){
    const tabs=document.querySelector('.admin-tabs'), rides=document.getElementById('adminRides');
    if(!tabs || !rides || document.getElementById('adminPaymentsTab')) return;
    const b=document.createElement('button'); b.id='adminPaymentsTab'; b.className='admin-tab'; b.dataset.adminTab='payments'; b.textContent='Payments'; tabs.appendChild(b);
    const panel=document.createElement('div'); panel.id='adminPayments'; panel.className='admin-panel'; panel.hidden=true; rides.parentNode.appendChild(panel);
    b.addEventListener('click',()=>{ if(typeof window.switchAdminTab==='function') window.switchAdminTab('payments'); document.querySelectorAll('.admin-panel').forEach(p=>{if(p.id!=='adminPayments')p.hidden=true}); document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); panel.hidden=false; load(); });
  }
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(install,300);});
})();
