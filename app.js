const SUPABASE_URL = 'https://ywowulcaqsmrbkdvcqcw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_p0num0a5GJJCBbGFPi-FTg_Flma1Ex3';
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function escapeHtml(value){return String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatTime(t){ if(!t) return ''; const [h,m]=String(t).split(':').map(Number); const ap=h>=12?'PM':'AM'; const hh=(h%12)||12; return `${hh}:${String(m).padStart(2,'0')} ${ap}`; }
function formatDate(d){ if(!d) return ''; const x=new Date(`${d}T00:00:00`); return x.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }
function setAuthMessage(id,message,type='success'){const el=document.getElementById(id);if(!el)return;el.textContent=message;el.className=`authmsg ${type}`;}
function clearAuthMessage(id){setAuthMessage(id,'','');}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
window.openModal=openModal;window.closeModal=closeModal;
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

async function ensureProfile(user){
  if(!user) return {error:null};
  const full_name=user.user_metadata?.full_name || user.email?.split('@')[0] || 'Rider';
  const role=(user.user_metadata?.role || 'Passenger').toLowerCase();
  const normalized=role==='both'?'both':role==='driver'?'driver':'passenger';
  const referralCode='BIKU'+user.id.replaceAll('-','').slice(0,8).toUpperCase();
  return await supabaseClient.from('profiles').upsert({id:user.id,full_name,role:normalized,referral_code:referralCode},{onConflict:'id'});
}

function updateAuthArea(user){
  const area=document.getElementById('authArea');
  if(!user){area.innerHTML='<button class="outline" onclick="openModal(\'login\')">Log in</button>';return;}
  const name=user.user_metadata?.full_name||user.email?.split('@')[0]||'Rider';
  area.innerHTML=`<span style="margin-right:10px;font-weight:600">Hi, ${escapeHtml(name)}</span><button class="outline" id="logoutBtn">Log out</button>`;
  document.getElementById('logoutBtn').onclick=async()=>{const {error}=await supabaseClient.auth.signOut();if(error)alert(error.message);};
}

async function getSession(){return (await supabaseClient.auth.getSession()).data.session;}

function render(list){
  const results=document.getElementById('results');
  results.innerHTML=list.length?list.map((r,i)=>{
    const driver=r.profiles?.full_name||'BIKUBOO rider';
    const from=r.from_location||r.from_place||'';
    const to=r.to_location||r.to_place||'';
    const initials=driver.split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'B';
    const tags=[];
    if(r.verified_only)tags.push('✓ Verified');
    if(r.women_only)tags.push('Women only');
    else if(r.women_preferred)tags.push('Women preferred');
    if(!tags.length)tags.push('Community ride');
    const seats=Number(r.seats||0);
    const amount=Number(r.price ?? r.contribution ?? 0);
    const hasCoords=[r.from_lat,r.from_lng,r.to_lat,r.to_lng].every(v=>Number.isFinite(Number(v)));
    return `<article class="ride result-ride" style="animation-delay:${Math.min(i*70,420)}ms">
      <div class="ride-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
      <div class="ride-main">
        <div class="ride-route">${escapeHtml(from)} <span aria-hidden="true">→</span> ${escapeHtml(to)}</div>
        <div class="ride-meta">
          <span>📅 ${escapeHtml(formatDate(r.ride_date))}</span>
          <span>🕐 ${escapeHtml(formatTime(r.ride_time))}</span>
          <span>👤 ${seats} seat${seats===1?'':'s'}</span>
        </div>
        <div class="verify-badge">${tags.map(escapeHtml).join(' · ')}</div>
        <div class="muted" style="margin-top:8px;font-size:12px">Rider: <strong>${escapeHtml(driver)}</strong></div>
      </div>
      <div class="ride-price">
        ${amount>0?'₹'+escapeHtml(amount):'Free'}
        <small>${amount>0?'per seat':'ride contribution'}</small>
        ${hasCoords?`<button class="map-route-btn" type="button" onclick="showRideRoute(${JSON.stringify(r.id)})">🗺️ Route</button>`:''}
        ${seats>0?`<button class="primary" onclick="requestRide('${r.id}')">Request seat</button>`:`<span class="status-badge status-rejected">Full</span>`}
      </div>
    </article>`;
  }).join(''):'<div class="ride"><b>No matching rides found.</b><small>Try another route/date or offer the first ride.</small></div>';
}

let rideMap=null, rideRouteLayer=null, rideFromMarker=null, rideToMarker=null;
function ensureRideMap(){
  if(rideMap) return rideMap;
  rideMap=L.map('rideMap',{zoomControl:true,scrollWheelZoom:true});
  L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`,{maxZoom:20,attribution:'© OpenStreetMap contributors · © Geoapify'}).addTo(rideMap);
  return rideMap;
}
function clearRideMap(){
  if(!rideMap) return;
  if(rideRouteLayer){rideMap.removeLayer(rideRouteLayer);rideRouteLayer=null;}
  if(rideFromMarker){rideMap.removeLayer(rideFromMarker);rideFromMarker=null;}
  if(rideToMarker){rideMap.removeLayer(rideToMarker);rideToMarker=null;}
}
function fmtDistance(m){const n=Number(m||0);return n>=1000?(n/1000).toFixed(1)+' km':Math.round(n)+' m';}
function fmtDuration(sec){const n=Math.max(0,Math.round(Number(sec||0)/60));if(n<60)return n+' min';const h=Math.floor(n/60),m=n%60;return h+' hr'+(m?' '+m+' min':'');}
window.showRideRoute=async function(rideId){
  const {data:r,error}=await supabaseClient.from('rides').select('id,from_location,from_place,to_location,to_place,from_lat,from_lng,to_lat,to_lng,ride_date,ride_time').eq('id',rideId).single();
  if(error||!r){alert(error?.message||'Ride details unavailable.');return;}
  const coords=[r.from_lat,r.from_lng,r.to_lat,r.to_lng].map(Number);
  if(coords.some(v=>!Number.isFinite(v))){alert('This ride does not have map coordinates yet.');return;}
  const panel=document.getElementById('rideMapPanel');panel.hidden=false;
  document.getElementById('mapRouteTitle').textContent=`${r.from_location||r.from_place} → ${r.to_location||r.to_place}`;
  document.getElementById('mapRouteMeta').textContent=`${formatDate(r.ride_date)} · ${formatTime(r.ride_time)} · Motorcycle route`;
  const map=ensureRideMap(); clearRideMap(); map.invalidateSize();
  const from=[coords[0],coords[1]],to=[coords[2],coords[3]];
  rideFromMarker=L.marker(from).addTo(map).bindPopup('<b>Pickup</b>');
  rideToMarker=L.marker(to).addTo(map).bindPopup('<b>Destination</b>');
  map.fitBounds(L.latLngBounds([from,to]).pad(0.25));
  const params=new URLSearchParams({waypoints:`${coords[0]},${coords[1]}|${coords[2]},${coords[3]}`,mode:'motorcycle',format:'geojson',units:'metric',apiKey:GEOAPIFY_API_KEY});
  try{
    const res=await fetch('https://api.geoapify.com/v1/routing?'+params.toString());
    const json=await res.json();
    if(!res.ok)throw new Error(json.message||'Route service unavailable');
    rideRouteLayer=L.geoJSON(json,{style:{color:'#7bdc43',weight:6,opacity:.9,lineCap:'round',lineJoin:'round'}}).addTo(map);
    map.fitBounds(rideRouteLayer.getBounds().pad(0.18));
    const feature=json.features?.[0]; const props=feature?.properties||{};
    document.getElementById('mapRouteMeta').textContent=`${formatDate(r.ride_date)} · ${formatTime(r.ride_time)} · ${fmtDistance(props.distance)} · ${fmtDuration(props.time)}`;
  }catch(err){
    console.warn('Route calculation failed:',err);
    document.getElementById('mapRouteMeta').textContent='Route preview · Exact road route is temporarily unavailable';
  }
  panel.scrollIntoView({behavior:'smooth',block:'center'});
};
document.getElementById('closeRideMap').onclick=()=>{document.getElementById('rideMapPanel').hidden=true;};

async function loadRides(){
  const {data,error}=await supabaseClient.from('rides').select('id,driver_id,from_location,to_location,from_lat,from_lng,to_lat,to_lng,ride_date,ride_time,seats,price,status,women_only,women_preferred,verified_only,profiles(full_name)').eq('status','open').order('ride_date',{ascending:true}).order('ride_time',{ascending:true});
  if(error){console.error(error);render([]);return [];} render(data||[]); return data||[];
}

let pendingRideRequestId=null;
window.requestRide=async function(rideId){
  const session=await getSession();
  if(!session){openModal('login');setAuthMessage('loginMsg','Please log in before requesting a ride.','error');return;}
  const {error:profileError}=await ensureProfile(session.user);
  if(profileError){alert(profileError.message);return;}
  const {data:ride,error:rideError}=await supabaseClient.from('rides').select('id,seats,driver_id,status,from_location,from_place,to_location,to_place,ride_date,ride_time,price,contribution,women_only,women_preferred,verified_only,profiles(full_name)').eq('id',rideId).single();
  if(rideError){alert(rideError.message);return;}
  if(ride.driver_id===session.user.id){alert('You cannot request your own ride.');return;}
  if(Number(ride.seats)<=0){alert('This ride is already full.');await loadRides();return;}
  const {data:existing}=await supabaseClient.from('ride_requests').select('id,status').eq('ride_id',rideId).eq('passenger_id',session.user.id).maybeSingle();
  if(existing){alert(existing.status==='rejected'?'Your earlier request was rejected. Please choose another ride.':'You already requested this ride.');return;}
  pendingRideRequestId=ride.id;
  const driver=ride.profiles?.full_name||'BIKUBOO rider';
  const amount=Number(ride.price ?? ride.contribution ?? 0);
  const tags=[ride.verified_only?'✓ Verified riders':'Community ride',ride.women_only?'Women only':ride.women_preferred?'Women preferred':null].filter(Boolean);
  const summary=document.getElementById('rideRequestSummary');
  summary.innerHTML=`<div class="request-route"><div><small>FROM</small><strong>${escapeHtml(ride.from_location||ride.from_place||'')}</strong></div><span>→</span><div><small>TO</small><strong>${escapeHtml(ride.to_location||ride.to_place||'')}</strong></div></div><div class="request-detail-grid"><div><small>DATE</small><b>${escapeHtml(formatDate(ride.ride_date))}</b></div><div><small>TIME</small><b>${escapeHtml(formatTime(ride.ride_time))}</b></div><div><small>RIDER</small><b>${escapeHtml(driver)}</b></div><div><small>SEATS</small><b>${escapeHtml(ride.seats)} available</b></div></div><div class="request-tags">${tags.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="request-price"><span>Contribution</span><strong>${amount>0?'₹'+escapeHtml(amount):'Free'}</strong></div>`;
  const btn=document.getElementById('confirmRideRequestBtn');
  btn.disabled=false;btn.textContent='Request seat';clearAuthMessage('rideRequestMsg');
  openModal('rideRequestModal');
};
document.getElementById('confirmRideRequestBtn').onclick=async function(){
  if(!pendingRideRequestId)return;
  const btn=this;btn.disabled=true;btn.textContent='Sending…';clearAuthMessage('rideRequestMsg');
  const session=await getSession();
  if(!session){closeModal('rideRequestModal');openModal('login');return;}
  const {error}=await supabaseClient.from('ride_requests').insert({ride_id:pendingRideRequestId,passenger_id:session.user.id,status:'pending'});
  if(error){btn.disabled=false;btn.textContent='Request seat';setAuthMessage('rideRequestMsg',error.code==='23505'?'You already requested this ride.':error.message,'error');return;}
  btn.textContent='✓ Request sent';setAuthMessage('rideRequestMsg','Your request has been sent to the rider.','success');
  await loadMyRequests();
  setTimeout(()=>{closeModal('rideRequestModal');btn.disabled=false;btn.textContent='Request seat';pendingRideRequestId=null;},850);
};

let lastRideSearch=[];
function sortRideResults(list){const mode=document.getElementById('rideSort')?.value||'soonest';return [...list].sort((a,b)=>mode==='price'?Number(a.price??a.contribution??0)-Number(b.price??b.contribution??0):mode==='seats'?Number(b.seats||0)-Number(a.seats||0):(String(a.ride_date)+'T'+String(a.ride_time||'')).localeCompare(String(b.ride_date)+'T'+String(b.ride_time||'')));}
document.getElementById('search').onsubmit=async e=>{
e.preventDefault();const session=await getSession();if(!session){openModal('login');setAuthMessage('loginMsg','Please log in to find and request rides.','error');return;}
const f=document.getElementById('from').value.trim().toLowerCase(),t=document.getElementById('to').value.trim().toLowerCase(),date=document.getElementById('searchDate').value,pref=document.getElementById('pref').value,summary=document.getElementById('searchSummary');
if(summary)summary.innerHTML='<span class="bk-search-pulse"></span> Finding matching rides…';
const {data,error}=await supabaseClient.from('rides').select('id,driver_id,from_place,to_place,from_location,to_location,from_lat,from_lng,to_lat,to_lng,ride_date,ride_time,seats,price,contribution,status,women_only,women_preferred,verified_only,profiles(full_name,rating_avg,rating_count,verification_status)').eq('status','open').order('ride_date',{ascending:true}).order('ride_time',{ascending:true});
if(error){if(summary)summary.textContent='Could not load rides right now';document.getElementById('results').innerHTML='<div class="ride"><b>Could not search rides.</b><small>'+escapeHtml(error.message)+'</small></div>';return;}
const norm=v=>String(v||'').trim().toLowerCase();let x=(data||[]).filter(r=>{const rf=norm(r.from_location||r.from_place),rt=norm(r.to_location||r.to_place);return (!f||rf.includes(f)||norm(r.from_place).includes(f))&&(!t||rt.includes(t)||norm(r.to_place).includes(t))&&(!date||r.ride_date===date);});
if(pref==='Women only')x=x.filter(r=>r.women_only);if(pref==='Women preferred')x=x.filter(r=>r.women_only||r.women_preferred);if(pref==='Verified riders only')x=x.filter(r=>r.verified_only||r.profiles?.verification_status==='verified');
if(document.getElementById('verifiedFilter')?.checked)x=x.filter(r=>r.verified_only||r.profiles?.verification_status==='verified');if(document.getElementById('womenFilter')?.checked)x=x.filter(r=>r.women_only||r.women_preferred);
lastRideSearch=sortRideResults(x);render(lastRideSearch);if(summary)summary.textContent=lastRideSearch.length+' ride'+(lastRideSearch.length===1?'':'s')+' found';
};
document.getElementById('rideSort')?.addEventListener('change',()=>{lastRideSearch=sortRideResults(lastRideSearch);render(lastRideSearch);});document.getElementById('verifiedFilter')?.addEventListener('change',()=>document.getElementById('search').requestSubmit());document.getElementById('womenFilter')?.addEventListener('change',()=>document.getElementById('search').requestSubmit());

function initOfferPreview(){
  const pairs=[['ofrom','bkOfferPreviewFrom','Your starting point'],['oto','bkOfferPreviewTo','Your destination']];
  pairs.forEach(([src,dst,empty])=>{const a=document.getElementById(src),b=document.getElementById(dst);if(a&&b){const sync=()=>b.textContent=a.value.trim()||empty;a.addEventListener('input',sync);a.addEventListener('change',sync);sync();}});
  const date=document.getElementById('offerDate'),time=document.getElementById('offerTime'),seats=document.getElementById('offerSeats'),price=document.getElementById('contribution');
  if(date){date.addEventListener('input',()=>document.getElementById('bkOfferPreviewDate').textContent=date.value?formatDate(date.value):'Choose a date');}
  if(time){time.addEventListener('input',()=>document.getElementById('bkOfferPreviewTime').textContent=time.value?formatTime(time.value):'Choose a time');}
  if(seats){seats.addEventListener('input',()=>document.getElementById('bkOfferPreviewSeats').textContent=(seats.value||1)+' seat'+(Number(seats.value||1)===1?'':'s'));}
  if(price){price.addEventListener('input',()=>document.getElementById('bkOfferPreviewPrice').textContent=Number(price.value||0)>0?'₹'+Number(price.value):'Free');}
}
initOfferPreview();

document.getElementById('offerForm').onsubmit=async e=>{
  e.preventDefault();
  const session=await getSession();
  if(!session){openModal('login');setAuthMessage('loginMsg','Please log in before publishing a ride.','error');return;}
  const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Publishing...';
  const {error:profileError}=await ensureProfile(session.user);
  if(profileError){btn.disabled=false;btn.textContent='Publish ride';alert(profileError.message);return;}
  const fromInput=document.getElementById('ofrom'),toInput=document.getElementById('oto'); const fromPlace=fromInput.value.trim(), toPlace=toInput.value.trim(); const contribution=Number(document.getElementById('contribution').value||0); const payload={driver_id:session.user.id,from_place:fromPlace,to_place:toPlace,from_location:fromPlace,to_location:toPlace,from_place_id:fromInput.dataset.placeId||null,to_place_id:toInput.dataset.placeId||null,from_lat:fromInput.dataset.lat?Number(fromInput.dataset.lat):null,from_lng:fromInput.dataset.lng?Number(fromInput.dataset.lng):null,to_lat:toInput.dataset.lat?Number(toInput.dataset.lat):null,to_lng:toInput.dataset.lng?Number(toInput.dataset.lng):null,ride_date:document.getElementById('offerDate').value,ride_time:document.getElementById('offerTime').value,seats:Number(document.getElementById('offerSeats').value),contribution:contribution,price:contribution,status:'open',women_only:document.getElementById('womenOnly').checked,women_preferred:document.getElementById('womenPreferred').checked,verified_only:document.getElementById('verifiedOnly').checked};
  const {error}=await supabaseClient.from('rides').insert(payload);
  btn.disabled=false;btn.textContent='Publish ride';
  if(error){alert('Could not publish ride: '+error.message);return;}
  const publishedFrom=fromPlace, publishedTo=toPlace, publishedDate=document.getElementById('offerDate').value, publishedTime=document.getElementById('offerTime').value, publishedSeats=Number(document.getElementById('offerSeats').value||1), publishedContribution=contribution;
  const successSummary=document.getElementById('bkPublishSuccessSummary');
  if(successSummary){successSummary.innerHTML='<div class="bk-summary-route"><span>FROM</span>'+escapeHtml(publishedFrom)+' <span>→</span> '+escapeHtml(publishedTo)+'</div><div class="bk-summary-item"><small>DATE</small><b>'+escapeHtml(formatDate(publishedDate))+'</b></div><div class="bk-summary-item"><small>TIME</small><b>'+escapeHtml(formatTime(publishedTime))+'</b></div><div class="bk-summary-item"><small>SEATS</small><b>'+publishedSeats+' seat'+(publishedSeats===1?'':'s')+'</b></div><div class="bk-summary-item"><small>CONTRIBUTION</small><b>'+(publishedContribution>0?'₹'+publishedContribution:'Free')+'</b></div>';}
  e.target.reset();document.getElementById('offerSeats').value=1;document.getElementById('verifiedOnly').checked=true;initOfferPreview();await loadRides();
  if(window.loadMyRides)await window.loadMyRides();
  openModal('ridePublishSuccessModal');
};

document.getElementById('signupForm').onsubmit=async e=>{
  e.preventDefault();clearAuthMessage('signupMsg');const button=e.target.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Creating...';
  const name=document.getElementById('signupName').value.trim(),email=document.getElementById('signupEmail').value.trim(),password=document.getElementById('signupPassword').value,role=document.getElementById('signupRole').value,referralCode=document.getElementById('signupReferral')?.value.trim()||'';
  const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{full_name:name,role,referral_code:referralCode||null}}});button.disabled=false;button.textContent='Create account';
  if(error){setAuthMessage('signupMsg',error.message,'error');return;}
  if(data.user && data.session){const p=await ensureProfile(data.user);if(!p.error && referralCode){await supabaseClient.rpc('bikuboo_claim_referral',{p_code:referralCode});}if(p.error){setAuthMessage('signupMsg','Account created, but profile setup failed: '+p.error.message,'error');return;}updateAuthArea(data.user);setAuthMessage('signupMsg','Account created successfully! You are now logged in.','success');setTimeout(()=>closeModal('signup'),800);}else{setAuthMessage('signupMsg','Account created. Check your email if confirmation is required.','success');}
};

document.getElementById('loginForm').onsubmit=async e=>{
  e.preventDefault();clearAuthMessage('loginMsg');const button=e.target.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Logging in...';
  const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value;const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});button.disabled=false;button.textContent='Log in';
  if(error){setAuthMessage('loginMsg',error.message,'error');return;}await ensureProfile(data.user);updateAuthArea(data.user);setAuthMessage('loginMsg','Login successful!','success');setTimeout(()=>closeModal('login'),600);
};



// ---------------- Live location autocomplete (Geoapify) ----------------
// Geoapify is used for live city, area, road, landmark and address suggestions.
// The key is intended for browser use; restrict it in the Geoapify dashboard when deploying.
const GEOAPIFY_API_KEY = 'f3d4632b17eb4a3ba4510a5187864d99';
const locationFields = [
  ['from','fromSuggestions'], ['to','toSuggestions'],
  ['ofrom','ofromSuggestions'], ['oto','otoSuggestions']
];

const popularLocations = [
  ['Narasaraopet, Andhra Pradesh','City'], ['Guntur, Andhra Pradesh','City'],
  ['Vijayawada, Andhra Pradesh','City'], ['Hyderabad, Telangana','City'],
  ['Amaravati, Andhra Pradesh','City'], ['Sattenapalle, Andhra Pradesh','Town'],
  ['Chilakaluripet, Andhra Pradesh','Town'], ['Vinukonda, Andhra Pradesh','Town'],
  ['Mangalagiri, Andhra Pradesh','Town'], ['Tenali, Andhra Pradesh','Town'],
  ['Brodipet, Guntur, Andhra Pradesh','Area'], ['Arundelpet, Guntur, Andhra Pradesh','Area'],
  ['Lakshmipuram, Guntur, Andhra Pradesh','Area'], ['Bharat Nagar, Vijayawada, Andhra Pradesh','Area'],
  ['Moghalrajpuram, Vijayawada, Andhra Pradesh','Area'], ['Governorpet, Vijayawada, Andhra Pradesh','Area'],
  ['RTC Bus Stand, Narasaraopet, Andhra Pradesh','Landmark'], ['Vinukonda Road, Narasaraopet, Andhra Pradesh','Road'],
  ['Guntur Road, Narasaraopet, Andhra Pradesh','Road'], ['Sattenapalle Road, Narasaraopet, Andhra Pradesh','Road']
];

function clearPlaceData(input){
  ['placeId','lat','lng','resultType','city','state','country'].forEach(k=>delete input.dataset[k]);
}
function closeLocationMenus(exceptId){
  document.querySelectorAll('.place-suggestions').forEach(el=>{if(el.id!==exceptId)el.classList.remove('open');});
}
function showLocalSuggestions(input, box){
  const q=input.value.trim().toLowerCase();
  if(!q){box.classList.remove('open');box.innerHTML='';return;}
  const matches=popularLocations.filter(x=>x[0].toLowerCase().includes(q)).slice(0,8);
  box.innerHTML=matches.map(x=>`<button type="button" class="place-suggestion" data-value="${escapeHtml(x[0])}">📍 ${escapeHtml(x[0])}<small>${escapeHtml(x[1])}</small></button>`).join('');
  if(matches.length){box.innerHTML += '<div class="place-brand">BIKUBOO suggestions</div>';box.classList.add('open');}else box.classList.remove('open');
  box.querySelectorAll('.place-suggestion').forEach(btn=>btn.onclick=()=>{
    clearPlaceData(input); input.value=btn.dataset.value; box.classList.remove('open');
  });
}

let locationTimers = new WeakMap();

// Use the device's current GPS position and reverse-geocode it into a readable address.
// The browser asks the user for location permission the first time this is used.
async function useCurrentLocation(input){
  if(!navigator.geolocation){
    alert('Current location is not supported by this browser.');
    return;
  }
  const box=document.getElementById(input.id+'Suggestions');
  const buttons=document.querySelectorAll('.current-location-btn');
  buttons.forEach(b=>{if(b.dataset.target===input.id){b.disabled=true;b.textContent='Locating…';}});
  try{
    const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:60000}));
    const lat=position.coords.latitude, lon=position.coords.longitude;
    const params=new URLSearchParams({lat:String(lat),lon:String(lon),format:'json',limit:'1',apiKey:GEOAPIFY_API_KEY});
    const res=await fetch('https://api.geoapify.com/v1/geocode/reverse?'+params,{mode:'cors'});
    if(!res.ok) throw new Error('Location address lookup failed ('+res.status+').');
    const json=await res.json();
    const p=(json.results||[])[0];
    if(!p) throw new Error('Could not find an address for your current location.');

    clearPlaceData(input);
    input.value=p.formatted || [p.name,p.street,p.city,p.state,p.postcode].filter(Boolean).join(', ');
    input.dataset.placeId=p.place_id||'';
    input.dataset.lat=String(lat);
    input.dataset.lng=String(lon);
    input.dataset.resultType=p.result_type||'';
    input.dataset.city=p.city||'';
    input.dataset.state=p.state||'';
    input.dataset.country=p.country||'';
    if(box){box.classList.remove('open');box.innerHTML='';}
  }catch(err){
    if(err && err.code===1) alert('Location permission was denied. Please allow location access in Chrome and try again.');
    else if(err && err.code===2) alert('Your current location could not be determined. Please try again or search for a place.');
    else if(err && err.code===3) alert('Location request timed out. Please try again.');
    else alert(err?.message || 'Unable to get your current location.');
  }finally{
    buttons.forEach(b=>{if(b.dataset.target===input.id){b.disabled=false;b.textContent='⌖ Use current location';}});
  }
}

document.querySelectorAll('.current-location-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const input=document.getElementById(btn.dataset.target);
    if(input) useCurrentLocation(input);
  });
});


// Query several Geoapify result types in parallel so BIKUBOO does not get
// dominated by city-level matches. We then merge, de-duplicate and rank the
// results so localities, streets and landmarks can appear alongside cities.
async function geoapifyQuery(text, type, limit=6){
  const params = new URLSearchParams({
    text,
    type,
    filter:'countrycode:in',
    limit:String(limit),
    apiKey:GEOAPIFY_API_KEY
  });
  const res = await fetch('https://api.geoapify.com/v1/geocode/autocomplete?'+params,{mode:'cors'});
  if(!res.ok) throw new Error('Location service returned '+res.status);
  const json = await res.json();
  return (json.features||[]).map(f=>f.properties).filter(p=>p && (p.formatted||p.name));
}

function locationKey(p){
  return String(p.place_id||p.formatted||p.name||'').toLowerCase();
}

function locationTypeLabel(p){
  const t=String(p.result_type||'').toLowerCase();
  if(['suburb','district','locality'].includes(t)) return 'Area';
  if(t==='street') return 'Road / Street';
  if(t==='amenity') return 'Place / Landmark';
  if(t==='postcode') return 'PIN / Postcode';
  if(t==='city') return 'City / Town';
  if(t==='state') return 'State';
  return t ? t.charAt(0).toUpperCase()+t.slice(1) : 'Place';
}

function locationScore(p, q){
  const query=q.toLowerCase().trim();
  const name=String(p.name||'').toLowerCase();
  const formatted=String(p.formatted||'').toLowerCase();
  const type=String(p.result_type||'').toLowerCase();
  let score=0;
  if(name===query) score+=100;
  else if(name.startsWith(query)) score+=70;
  else if(name.includes(query)) score+=35;
  if(formatted.startsWith(query)) score+=20;
  if(['suburb','district','locality'].includes(type)) score+=28;
  if(type==='amenity') score+=24;
  if(type==='street') score+=20;
  if(type==='city') score+=12;
  if(type==='postcode') score+=8;
  if(String(p.country_code||'').toLowerCase()==='in') score+=10;
  return score;
}

async function fetchGeoapifySuggestions(input, box){
  const q=input.value.trim();
  if(q.length < 2){box.classList.remove('open');box.innerHTML='';return;}
  const timer=locationTimers.get(input); if(timer)clearTimeout(timer);
  locationTimers.set(input,setTimeout(async()=>{
    const queryAtRequest=input.value.trim();
    if(queryAtRequest.length<2)return;
    try{
      // Search broad autocomplete plus targeted types. Geoapify supports city,
      // street, amenity and locality result types; combining them gives much
      // better coverage for Indian neighbourhoods such as Ameerpet/Kukatpally.
      const types=['locality','amenity','street','city'];
      const results=await Promise.allSettled(types.map(t=>geoapifyQuery(queryAtRequest,t,6)));
      if(input.value.trim()!==queryAtRequest)return;

      const merged=new Map();
      results.forEach(r=>{
        if(r.status!=='fulfilled')return;
        r.value.forEach(p=>{
          const k=locationKey(p);
          if(!k)return;
          const existing=merged.get(k);
          if(!existing || locationScore(p,queryAtRequest)>locationScore(existing,queryAtRequest)) merged.set(k,p);
        });
      });

      let features=[...merged.values()]
        .filter(p=>p.formatted||p.name)
        .sort((a,b)=>locationScore(b,queryAtRequest)-locationScore(a,queryAtRequest));

      // Keep the dropdown useful: prefer diversity across locality/amenity/street/city
      // while still allowing exact matches to dominate.
      const chosen=[];
      const seenTypes=new Set();
      for(const p of features){
        const t=String(p.result_type||'').toLowerCase();
        const group=['suburb','district','locality'].includes(t)?'area':t;
        if(!seenTypes.has(group) || chosen.length>=5){
          chosen.push(p); seenTypes.add(group);
        }
        if(chosen.length>=8)break;
      }
      for(const p of features){
        if(chosen.length>=8)break;
        if(!chosen.includes(p))chosen.push(p);
      }
      features=chosen.slice(0,8);

      if(!features.length){showLocalSuggestions(input,box);return;}
      box.innerHTML=features.map((p,i)=>{
        const label=p.formatted||p.name;
        return `<button type="button" class="place-suggestion" data-index="${i}">📍 ${escapeHtml(label)}<small>${escapeHtml(locationTypeLabel(p))}</small></button>`;
      }).join('');
      box.innerHTML += '<div class="place-brand">Powered by Geoapify</div>';
      box.classList.add('open');

      box.querySelectorAll('.place-suggestion').forEach(btn=>btn.onclick=()=>{
        const p=features[Number(btn.dataset.index)];
        clearPlaceData(input);
        input.value=p.formatted||p.name||queryAtRequest;
        input.dataset.placeId=p.place_id||'';
        if(Number.isFinite(Number(p.lat)))input.dataset.lat=p.lat;
        if(Number.isFinite(Number(p.lon)))input.dataset.lng=p.lon;
        input.dataset.resultType=p.result_type||'';
        input.dataset.city=p.city||'';
        input.dataset.state=p.state||'';
        input.dataset.country=p.country||'';
        input.dataset.street=p.street||'';
        input.dataset.postcode=p.postcode||'';
        box.classList.remove('open');
      });
    }catch(err){
      console.warn('Geoapify autocomplete unavailable:',err);
      showLocalSuggestions(input,box);
    }
  },250));
}

function setupLocationAutocomplete(){
  locationFields.forEach(([inputId,boxId])=>{
    const input=document.getElementById(inputId),box=document.getElementById(boxId);if(!input||!box)return;
    input.addEventListener('input',()=>{
      clearPlaceData(input);
      closeLocationMenus(boxId);
      fetchGeoapifySuggestions(input,box);
    });
    input.addEventListener('focus',()=>{
      if(input.value.trim().length>=2)fetchGeoapifySuggestions(input,box);
    });
  });
}

document.addEventListener('click',e=>{
  if(!e.target.closest('.place-field'))closeLocationMenus();
});

supabaseClient.auth.onAuthStateChange((_event,session)=>updateAuthArea(session?.user||null));
setupLocationAutocomplete();
(async()=>{const session=await getSession();updateAuthArea(session?.user||null);if(session)await ensureProfile(session.user);await loadRides();})();


// ---------- BIKUBOO PAYMENTS ----------
let paymentContext=null;
function closePaymentModal(){const m=document.getElementById('paymentModal');if(m)m.classList.remove('open');paymentContext=null;}
window.closePaymentModal=closePaymentModal;
function paymentMoney(paise){return '₹'+(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});}
async function loadPaymentHistory(){
  const box=document.getElementById('paymentHistory'); if(!box)return;
  const session=await getSession(); if(!session){box.innerHTML='<div class="ride"><small>Log in to see your payment history.</small></div>';return;}
  const {data,error}=await supabaseClient.from('payment_transactions').select('id,ride_id,request_id,amount_paise,currency,status,payment_method,razorpay_payment_id,created_at,paid_at,rides(from_location,to_location,ride_date,ride_time)').eq('passenger_id',session.user.id).order('created_at',{ascending:false}).limit(30);
  if(error){box.innerHTML='<div class="ride"><small>Payment history unavailable: '+escapeHtml(error.message)+'</small></div>';return;}
  if(!data?.length){box.innerHTML='<div class="ride"><b>No payments yet.</b><small>Accepted paid rides will appear here.</small></div>';return;}
  box.innerHTML='<div class="payment-history-grid">'+data.map(t=>{const r=t.rides||{};const st=t.status||'pending';const method=t.payment_method==='cash'?'💵 Cash':'📱 UPI';const label=st==='paid'?'✓ Paid':st==='failed'?'Failed':st==='refunded'?'Refunded':st==='cash_pending'?'Cash — pay driver':'Pending';return `<div class="payment-history-card"><div><b>${escapeHtml(r.from_location||'Ride')} → ${escapeHtml(r.to_location||'')}</b><small>${escapeHtml(formatDate(r.ride_date))} · ${escapeHtml(formatTime(r.ride_time))} · ${method}</small></div><div class="payment-history-right"><strong>${paymentMoney(t.amount_paise)}</strong><span class="payment-status ${escapeHtml(st)}">${label}</span></div></div>`}).join('')+'</div>';
}
async function getPaymentForRequests(requestIds){
  if(!requestIds.length)return {};
  const {data}=await supabaseClient.from('payment_transactions').select('id,request_id,status,amount_paise,payment_method,razorpay_payment_id').in('request_id',requestIds);
  return Object.fromEntries((data||[]).map(x=>[x.request_id,x]));
}
window.openPayment=async function(requestId){
  const session=await getSession(); if(!session){openModal('login');return;}
  const {data:req,error}=await supabaseClient.from('ride_requests').select('id,status,passenger_id,rides(id,from_location,to_location,ride_date,ride_time,price,contribution)').eq('id',requestId).eq('passenger_id',session.user.id).single();
  if(error||!req){alert(error?.message||'Request not found.');return;}
  if(req.status!=='accepted'){alert('Payment is available only after the driver accepts your request.');return;}
  const ride=req.rides||{}; const amount=Number(ride.price ?? ride.contribution ?? 0); if(amount<=0){alert('This ride is free — no payment is required.');return;}
  paymentContext={requestId,ride};
  document.getElementById('paymentTitle').textContent='Pay for this ride';
  document.getElementById('paymentRoute').textContent=`${ride.from_location||'Pickup'} → ${ride.to_location||'Destination'}`;
  document.getElementById('paymentAmount').textContent='₹'+amount.toLocaleString('en-IN');
  document.getElementById('paymentStatus').textContent='Ready to pay';
  document.getElementById('paymentMsg').textContent='';
  document.getElementById('paymentPayBtn').disabled=false;
  const upi=document.querySelector('input[name=paymentMethod][value=upi]'); if(upi) upi.checked=true;
  document.querySelectorAll('.payment-method-card').forEach(x=>x.classList.remove('selected')); document.getElementById('upiMethodCard')?.classList.add('selected');
  document.getElementById('paymentPayBtn').textContent='Pay with UPI';
  document.getElementById('paymentMethodNote').textContent='UPI is the primary payment method. Razorpay securely handles the payment and BIKUBOO confirms the booking only after server-side verification.';
  document.getElementById('paymentModal').classList.add('open');
};
async function startCashPayment(){
  if(!paymentContext)return; const btn=document.getElementById('paymentPayBtn');btn.disabled=true;setAuthMessage('paymentMsg','Saving your cash payment choice securely…','');
  try{const {data,error}=await supabaseClient.functions.invoke('choose-cash-payment',{body:{request_id:paymentContext.requestId}});
    if(error||data?.error)throw(error||new Error(data.error));
    document.getElementById('paymentStatus').textContent='Cash selected';setAuthMessage('paymentMsg','Booking confirmed. Pay the driver ₹'+Number(paymentContext.ride.price ?? paymentContext.ride.contribution ?? 0).toLocaleString('en-IN')+' directly. The driver will confirm when cash is received.','success');
    await loadMyRequests(); await loadPaymentHistory(); setTimeout(closePaymentModal,1800);
  }catch(e){btn.disabled=false;setAuthMessage('paymentMsg',e.message||'Cash option could not be saved.','error');}
}
async function startRazorpayPayment(){
  if(!paymentContext)return; const btn=document.getElementById('paymentPayBtn');btn.disabled=true;setAuthMessage('paymentMsg','Creating secure payment order…','');
  try{
    const {data,error}=await supabaseClient.functions.invoke('create-payment-order',{body:{request_id:paymentContext.requestId}});
    if(error)throw error; if(data?.error)throw new Error(data.error); if(!data?.order?.id)throw new Error('Could not create payment order.');
    if(!window.Razorpay)throw new Error('Razorpay Checkout could not load.');
    const session=await getSession(); const user=session?.user;
    const r=paymentContext.ride;
    const options={key:data.key_id,amount:data.order.amount,currency:data.order.currency,order_id:data.order.id,name:'BIKUBOO',description:'Bike pooling booking contribution',prefill:{name:user?.user_metadata?.full_name||user?.email?.split('@')[0]||'',email:user?.email||'',contact:''},theme:{color:'#8bd84a'},config:{display:{blocks:{upi_primary:{name:'Pay via UPI',instruments:[{method:'upi'}]}},sequence:['block.upi_primary'],preferences:{show_default_blocks:false}}},handler:async function(response){
      setAuthMessage('paymentMsg','Verifying payment securely…','');
      const {data:v,error:vErr}=await supabaseClient.functions.invoke('verify-payment',{body:{transaction_id:data.transaction.id,razorpay_payment_id:response.razorpay_payment_id,razorpay_order_id:response.razorpay_order_id,razorpay_signature:response.razorpay_signature}});
      if(vErr||v?.error)throw (vErr||new Error(v.error));
      document.getElementById('paymentStatus').textContent='Paid ✓';setAuthMessage('paymentMsg','Payment confirmed successfully.','success');
      await loadMyRequests(); await loadPaymentHistory();
      setTimeout(closePaymentModal,1200);
    },modal:{ondismiss:function(){btn.disabled=false;setAuthMessage('paymentMsg','Payment window closed. You can try again.','error');}}};
    const rzp=new Razorpay(options); rzp.on('payment.failed',function(resp){btn.disabled=false;setAuthMessage('paymentMsg',resp?.error?.description||'Payment failed. Please try again.','error');loadPaymentHistory();}); rzp.open();
  }catch(e){btn.disabled=false;setAuthMessage('paymentMsg',e.message||'Payment could not start.','error');}
}
document.getElementById('paymentPayBtn').addEventListener('click',()=>{const method=document.querySelector('input[name=paymentMethod]:checked')?.value||'upi'; if(method==='cash')startCashPayment(); else startRazorpayPayment();});
document.querySelectorAll('input[name=paymentMethod]').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.payment-method-card').forEach(x=>x.classList.remove('selected'));input.closest('.payment-method-card')?.classList.add('selected');const cash=input.value==='cash';document.getElementById('paymentPayBtn').textContent=cash?'Choose Cash & Confirm':'Pay with UPI';document.getElementById('paymentMethodNote').textContent=cash?'Choose cash if you will pay the driver directly. Your booking will be marked cash pending until the driver confirms receipt.':'UPI is the primary payment method. Razorpay securely handles the payment and BIKUBOO confirms the booking only after server-side verification.';}));

async function loadMyRequests(){
  const box=document.getElementById('myRequestResults'); if(!box)return;
  const session=await getSession();
  if(!session){box.innerHTML='<div class="ride"><small>Log in to view your ride requests.</small></div>';await loadPaymentHistory();return;}
  const {data,error}=await supabaseClient.from('ride_requests').select('id,status,created_at,rides(from_location,to_location,ride_date,ride_time,price,contribution)').eq('passenger_id',session.user.id).order('created_at',{ascending:false});
  if(error){box.innerHTML='<div class="ride"><small>Could not load requests: '+escapeHtml(error.message)+'</small></div>';return;}
  if(!data?.length){box.innerHTML='<div class="ride request-empty"><div>🏍️</div><b>No ride requests yet.</b><small>Find a ride and request a seat to see it here.</small></div>';await loadPaymentHistory();return;}
  const payments=await getPaymentForRequests(data.map(x=>x.id));
  box.innerHTML=data.map((r,i)=>{
    const ride=r.rides||{}; const amount=Number(ride.price ?? ride.contribution ?? 0); const payment=payments[r.id];
    const paid=payment?.status==='paid'; const cashPending=payment?.status==='cash_pending';
    const status=String(r.status||'pending').toLowerCase();
    const label=status==='accepted'?'Accepted':status==='rejected'?'Not accepted':'Waiting for rider';
    const cls=status==='accepted'?'accepted':status==='rejected'?'rejected':'pending';
    const payBtn=status==='accepted'&&amount>0&&!paid&&!cashPending?'<button class="payment-mini-btn" onclick="openPayment(\''+r.id+'\')">📱 Pay ₹'+escapeHtml(amount)+'</button>':'';
    const booking=paid?'<span class="booking-confirmed">✓ Booking confirmed · '+(payment?.payment_method==='cash'?'Cash paid':'UPI paid')+'</span>':cashPending?'<span class="booking-pending payment-cash-badge">💵 Cash selected · Pay driver</span>':(status==='accepted'&&amount>0?'<span class="booking-pending">Payment pending</span>':'');
    const step=status==='rejected'?2:status==='accepted'?3:2;
    return '<article class="request-card request-'+cls+'" style="animation-delay:'+Math.min(i*70,350)+'ms"><div class="request-card-top"><div><span class="request-status-dot '+cls+'"></span><span class="request-status-label">'+label+'</span></div><small>'+escapeHtml(formatDate(ride.ride_date))+'</small></div><div class="request-card-route"><strong>'+escapeHtml(ride.from_location||'')+'</strong><span>→</span><strong>'+escapeHtml(ride.to_location||'')+'</strong></div><div class="request-card-meta"><span>🕐 '+escapeHtml(formatTime(ride.ride_time))+'</span><span>💺 Seat requested</span><span>'+(amount>0?'₹'+escapeHtml(amount):'Free')+'</span></div><div class="request-progress"><span class="'+(step>=1?'done':'')+'"></span><span class="'+(step>=2?'done':'')+'"></span><span class="'+(step>=3?'done':'')+'"></span></div><div class="request-card-foot"><small>'+(status==='pending'?'Waiting for the rider to respond':status==='accepted'?'Your seat is reserved. Complete payment if required.':'This request was not accepted.')+'</small><div class="request-actions">'+payBtn+booking+'</div></div></article>';
  }).join('');
  await loadPaymentHistory();
}
async function loadDriverRequests(){
  const box=document.getElementById('driverRequestResults');
  if(!box)return;
  const session=await getSession();
  if(!session){box.innerHTML='<div class="bk-driver-empty"><div class="bk-empty-icon">🔐</div><b>Log in to manage requests</b><small>Passenger requests for your rides will appear here.</small></div>';return;}
  const {data,error}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,status,created_at,profiles(full_name),rides(from_location,to_location,ride_date,ride_time,seats,price,contribution,driver_id)').eq('rides.driver_id',session.user.id).order('created_at',{ascending:false});
  if(error){box.innerHTML='<div class="bk-driver-empty"><div class="bk-empty-icon">⚠️</div><b>Could not load requests</b><small>'+escapeHtml(error.message)+'</small></div>';return;}
  if(!data?.length){box.innerHTML='<div class="bk-driver-empty"><div class="bk-empty-icon">🏍️</div><b>No incoming requests yet</b><small>When a passenger requests one of your rides, their request will appear here.</small></div>';return;}

  const acceptedIds=data.filter(r=>(r.status||'').toLowerCase()==='accepted').map(r=>r.id);
  const cashPayments=acceptedIds.length?(await supabaseClient.from('payment_transactions').select('id,request_id,status,payment_method,amount_paise').in('request_id',acceptedIds)).data||[]:[];
  const cashByRequest=Object.fromEntries(cashPayments.map(x=>[x.request_id,x]));
  const pendingCount=data.filter(r=String(r.status||'pending').toLowerCase()==='pending').length;
  const acceptedCount=data.filter(r=>String(r.status||'').toLowerCase()==='accepted').length;

  box.innerHTML='<div class="bk-request-summary"><div><span>NEW REQUESTS</span><strong>'+pendingCount+'</strong></div><div><span>ACCEPTED</span><strong>'+acceptedCount+'</strong></div><div><span>TOTAL</span><strong>'+data.length+'</strong></div></div><div class="bk-driver-request-list">'+data.map((r,i)=>{
    const ride=r.rides||{}, passenger=r.profiles?.full_name||'BIKUBOO rider';
    const status=(r.status||'pending').toLowerCase();
    const payment=cashByRequest[r.id];
    const seats=Number(ride.seats||0);
    const amount=Number(ride.price ?? ride.contribution ?? 0);
    const cashButton=payment?.payment_method==='cash'&&payment.status==='cash_pending'?'<button class="bk-cash-confirm" onclick="confirmCashPayment(\''+payment.id+'\')">💵 Confirm cash received</button>':'';
    const actions=status==='pending'
      ? '<div class="bk-request-actions"><button class="bk-accept-btn" onclick="acceptRideRequest(\''+r.id+'\',\''+r.ride_id+'\')">✓ Accept request</button><button class="bk-reject-btn" onclick="rejectRideRequest(\''+r.id+'\')">Decline</button></div>'
      : status==='accepted'
        ? '<div class="bk-request-actions">'+cashButton+'</div>'
        : '<div class="bk-request-closed">Request '+escapeHtml(status)+'</div>';
    const payInfo=payment?.payment_method==='cash'?(payment.status==='cash_pending'?'<span class="bk-payment-pill pending">💵 Cash selected</span>':'<span class="bk-payment-pill paid">✓ Cash received</span>'):'';
    return '<article class="bk-driver-request-card" style="animation-delay:'+Math.min(i*60,360)+'ms"><div class="bk-request-card-head"><div class="bk-passenger"><div class="bk-passenger-avatar">'+escapeHtml(passenger.split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'B')+'</div><div><b>'+escapeHtml(passenger)+'</b><small>Passenger · Request received '+escapeHtml(new Date(r.created_at).toLocaleDateString(undefined,{day:'numeric',month:'short'}))+'</small></div></div><span class="bk-request-status '+(status==='accepted'?'accepted':status==='rejected'?'rejected':'pending')+'">'+(status==='accepted'?'Accepted':status==='rejected'?'Declined':'New request')+'</span></div><div class="bk-request-route"><div><small>FROM</small><strong>'+escapeHtml(ride.from_location||'Pickup')+'</strong></div><span>→</span><div><small>TO</small><strong>'+escapeHtml(ride.to_location||'Destination')+'</strong></div></div><div class="bk-request-meta"><span>📅 '+escapeHtml(formatDate(ride.ride_date))+'</span><span>🕐 '+escapeHtml(formatTime(ride.ride_time))+'</span><span>💺 '+seats+' seat'+(seats===1?'':'s')+' available</span><span>💰 '+(amount>0?'₹'+escapeHtml(amount):'Free')+'</span></div>'+payInfo+actions+'</article>';
  }).join('')+'</div>';
}
let driverActionContext=null;

function openDriverRequestAction(action,requestId,rideId){
  driverActionContext={action,requestId,rideId};
  const title=document.getElementById('driverActionTitle');
  const copy=document.getElementById('driverActionCopy');
  const icon=document.getElementById('driverActionIcon');
  const confirmBtn=document.getElementById('driverActionConfirm');
  const eyebrow=document.getElementById('driverActionEyebrow');
  if(action==='accept'){
    eyebrow.textContent='ACCEPT RIDER';
    icon.textContent='✓'; icon.className='bk-driver-action-icon accept';
    title.textContent='Accept this rider?';
    copy.textContent='Confirming will reserve one available seat for this passenger.';
    confirmBtn.textContent='Accept request';
    confirmBtn.className='primary';
  }else{
    eyebrow.textContent='DECLINE REQUEST';
    icon.textContent='×'; icon.className='bk-driver-action-icon reject';
    title.textContent='Decline this request?';
    copy.textContent='The passenger will be notified that their request was not accepted.';
    confirmBtn.textContent='Decline request';
    confirmBtn.className='bk-danger-action';
  }
  document.getElementById('driverActionSummary').innerHTML='<div><span>REQUEST</span><b>Review the passenger details in the card behind this dialog.</b></div>';
  clearAuthMessage('driverActionMsg');
  confirmBtn.disabled=false;
  openModal('driverRequestActionModal');
}

document.getElementById('driverActionConfirm')?.addEventListener('click',async function(){
  if(!driverActionContext)return;
  const ctx=driverActionContext,btn=this;
  btn.disabled=true;btn.textContent=ctx.action==='accept'?'Accepting…':'Declining…';
  clearAuthMessage('driverActionMsg');
  const session=await getSession();
  if(!session){closeModal('driverRequestActionModal');openModal('login');return;}
  if(ctx.action==='accept'){
    const {data:ride,error:rideError}=await supabaseClient.from('rides').select('id,seats,driver_id,status').eq('id',ctx.rideId).eq('driver_id',session.user.id).single();
    if(rideError){setAuthMessage('driverActionMsg',rideError.message,'error');btn.disabled=false;btn.textContent='Accept request';return;}
    if(Number(ride.seats)<=0){setAuthMessage('driverActionMsg','No available seats remain on this ride.','error');btn.disabled=false;btn.textContent='Accept request';await loadDriverRequests();return;}
    const {data:req,error:reqError}=await supabaseClient.from('ride_requests').select('id,status').eq('id',ctx.requestId).eq('ride_id',ctx.rideId).single();
    if(reqError){setAuthMessage('driverActionMsg',reqError.message,'error');btn.disabled=false;btn.textContent='Accept request';return;}
    if(req.status!=='pending'){setAuthMessage('This request has already been processed.','error');btn.disabled=false;btn.textContent='Accept request';await loadDriverRequests();return;}
    const {error:updateError}=await supabaseClient.from('ride_requests').update({status:'accepted'}).eq('id',ctx.requestId).eq('ride_id',ctx.rideId);
    if(updateError){setAuthMessage('driverActionMsg','Could not accept request: '+updateError.message,'error');btn.disabled=false;btn.textContent='Accept request';return;}
    const newSeats=Math.max(0,Number(ride.seats)-1);
    const {error:seatError}=await supabaseClient.from('rides').update({seats:newSeats}).eq('id',ctx.rideId).eq('driver_id',session.user.id);
    if(seatError){await supabaseClient.from('ride_requests').update({status:'pending'}).eq('id',ctx.requestId);setAuthMessage('driverActionMsg','The request was not finalized because the seat update failed.','error');btn.disabled=false;btn.textContent='Accept request';return;}
    closeModal('driverRequestActionModal');
    document.getElementById('driverSuccessTitle').textContent='Rider accepted ✓';
    document.getElementById('driverSuccessCopy').textContent=newSeats===0?'The passenger is confirmed and your ride is now full.':'The passenger is confirmed and one seat has been reserved.';
    document.getElementById('driverSuccessSummary').innerHTML='<span>SEATS REMAINING</span><strong>'+newSeats+'</strong>';
    openModal('driverActionSuccessModal');
    await loadDriverRequests();await loadRides();await loadMyRequests();
  }else{
    const {data:req,error:reqError}=await supabaseClient.from('ride_requests').select('id,status').eq('id',ctx.requestId).single();
    if(reqError){setAuthMessage('driverActionMsg',reqError.message,'error');btn.disabled=false;btn.textContent='Decline request';return;}
    if(req.status!=='pending'){setAuthMessage('This request has already been processed.','error');btn.disabled=false;btn.textContent='Decline request';await loadDriverRequests();return;}
    const {error}=await supabaseClient.from('ride_requests').update({status:'rejected'}).eq('id',ctx.requestId);
    if(error){setAuthMessage('driverActionMsg','Could not decline request: '+error.message,'error');btn.disabled=false;btn.textContent='Decline request';return;}
    closeModal('driverRequestActionModal');
    document.getElementById('driverSuccessTitle').textContent='Request declined';
    document.getElementById('driverSuccessCopy').textContent='The passenger request has been closed and they will see the updated status.';
    document.getElementById('driverSuccessSummary').innerHTML='<span>STATUS</span><strong>Declined</strong>';
    openModal('driverActionSuccessModal');
    await loadDriverRequests();await loadMyRequests();
  }
  driverActionContext=null;
});

window.acceptRideRequest=async function(requestId,rideId){openDriverRequestAction('accept',requestId,rideId);};
window.rejectRideRequest=async function(requestId){openDriverRequestAction('reject',requestId,null);};

window.confirmCashPayment=async function(transactionId){
  const session=await getSession(); if(!session)return;
  if(!window.confirm('Confirm that you received the cash payment from this passenger?'))return;
  const {data,error}=await supabaseClient.functions.invoke('confirm-cash-payment',{body:{transaction_id:transactionId}});
  if(error||data?.error){alert(error?.message||data?.error||'Could not confirm cash payment.');return;}
  alert('Cash payment confirmed.'); await loadDriverRequests(); await loadMyRequests(); await loadPaymentHistory();
};

const originalUpdateAuthArea=updateAuthArea;
updateAuthArea=function(user){originalUpdateAuthArea(user);setTimeout(()=>{loadMyRequests();loadDriverRequests();loadPaymentHistory();},0);};

// My Rides + Ride Details + Cancellation
let myRidesTab='driver';
window.showMyRidesTab=function(tab){
  myRidesTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  loadMyRides();
};
document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>showMyRidesTab(b.dataset.tab)));

function rideStatusLabel(status){
  const s=String(status||'open').toLowerCase();
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function rideDetailMarkup(ride, extra=''){
  const amount=Number(ride.price ?? ride.contribution ?? 0);
  const seats=Number(ride.seats ?? 0);
  return `<div class="detail-grid"><span>Date <strong>${escapeHtml(formatDate(ride.ride_date))}</strong></span><span>Time <strong>${escapeHtml(formatTime(ride.ride_time))}</strong></span><span>Seats <strong>${seats}</strong></span><span>Contribution <strong>${amount>0?'₹'+escapeHtml(amount):'Free'}</strong></span></div>${extra}`;
}

async function loadMyRides(){
  const box=document.getElementById('myRidesResults');
  if(!box)return;
  const session=await getSession();
  if(!session){box.innerHTML='<div class="ride"><small>Log in to see your rides.</small></div>';return;}
  if(myRidesTab==='driver'){
    const {data,error}=await supabaseClient.from('rides').select('id,driver_id,from_place,to_place,from_location,to_location,ride_date,ride_time,seats,price,contribution,status,women_only,women_preferred,verified_only').eq('driver_id',session.user.id).order('ride_date',{ascending:true}).order('ride_time',{ascending:true});
    if(error){box.innerHTML='<div class="ride"><b>Could not load your rides.</b><small>'+escapeHtml(error.message)+'</small></div>';return;}
    if(!data?.length){box.innerHTML='<div class="ride"><b>No rides offered yet.</b><small>Publish a ride from the Offer a Ride section.</small></div>';return;}
    box.innerHTML=data.map(r=>{
      const status=String(r.status||'open').toLowerCase();
      const cancel=status!=='cancelled'&&status!=='completed'&&status!=='started';
      const start=status==='open' ? `<button class="secondary" onclick="startRideLifecycle('${r.id}')">▶ Start ride</button>` : '';
      const complete=status==='started' ? `<button class="primary" onclick="completeRideLifecycle('${r.id}')">✓ Complete ride</button>` : '';
      return `<article class="bk-myride-card" data-ride-id="${escapeHtml(r.id)}">
  <div class="bk-myride-top"><div class="bk-myride-kicker">OFFERED RIDE</div><span class="status-badge status-${escapeHtml(status)}">${escapeHtml(rideStatusLabel(status))}</span></div>
  <div class="bk-myride-route"><span class="bk-route-dot"></span><strong>${escapeHtml(r.from_location||r.from_place||'')}</strong><span class="bk-route-arrow">→</span><strong>${escapeHtml(r.to_location||r.to_place||'')}</strong></div>
  <div class="bk-myride-meta"><span>📅 ${escapeHtml(formatDate(r.ride_date))}</span><span>🕐 ${escapeHtml(formatTime(r.ride_time))}</span><span>👤 ${Number(r.seats||0)} seat${Number(r.seats||0)===1?'':'s'}</span><span>💰 ${Number(r.price??r.contribution??0)>0?'₹'+Number(r.price??r.contribution):'Free'}</span></div>
  <div class="bk-myride-preferences">${r.verified_only?'<span>✓ Verified</span>':''}${r.women_only?'<span>Women only</span>':r.women_preferred?'<span>Women preferred</span>':''}</div>
  <div class="bk-myride-actions"><button class="secondary" onclick="viewRideDetails('${r.id}','driver')">View details</button>${start}${complete}${cancel?`<button class="danger" onclick="cancelRide('${r.id}')">Cancel ride</button>`:''}</div>
</article>`;
    }).join('');
  } else {
    const {data,error}=await supabaseClient.from('ride_requests').select('id,status,created_at,ride_id,rides(id,driver_id,from_place,to_place,from_location,to_location,ride_date,ride_time,seats,price,contribution,status,profiles(full_name))').eq('passenger_id',session.user.id).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="ride"><b>Could not load joined rides.</b><small>'+escapeHtml(error.message)+'</small></div>';return;}
    const joined=(data||[]).filter(r=>r.status==='accepted');
    if(!joined.length){box.innerHTML='<div class="ride"><b>No joined rides yet.</b><small>Accepted ride requests will appear here.</small></div>';return;}
    box.innerHTML=joined.map(r=>{const ride=r.rides||{};return `<article class="bk-myride-card bk-joined-card">
  <div class="bk-myride-top"><div class="bk-myride-kicker">JOINED RIDE</div><span class="status-badge status-${escapeHtml(String(ride.status||'open').toLowerCase())}">${escapeHtml(rideStatusLabel(ride.status||'open'))}</span></div>
  <div class="bk-myride-route"><span class="bk-route-dot"></span><strong>${escapeHtml(ride.from_location||ride.from_place||'')}</strong><span class="bk-route-arrow">→</span><strong>${escapeHtml(ride.to_location||ride.to_place||'')}</strong></div>
  <div class="bk-myride-meta"><span>📅 ${escapeHtml(formatDate(ride.ride_date))}</span><span>🕐 ${escapeHtml(formatTime(ride.ride_time))}</span><span>👤 ${Number(ride.seats||0)} seats</span><span>💰 ${Number(ride.price??ride.contribution??0)>0?'₹'+Number(ride.price??ride.contribution):'Free'}</span></div>
  <div class="bk-myride-driver">Driver <strong>${escapeHtml(ride.profiles?.full_name||'BIKUBOO rider')}</strong></div>
  <div class="bk-myride-actions"><button class="secondary" onclick="viewRideDetails('${r.ride_id}','passenger')">View details</button>${!['started','completed','cancelled'].includes(String(ride.status||'open').toLowerCase())?`<button class="danger" onclick="cancelRideRequest('${r.id}')">Cancel request</button>`:''}${ride.status==='started'?'<span class="booking-confirmed">🏍️ Ride in progress</span>':''}${ride.status==='completed'?'<span class="booking-confirmed">✓ Ride completed</span>':''}${new Date(`${ride.ride_date}T${ride.ride_time||'00:00:00'}`)<Date.now()?`<button class="secondary" onclick="openRating('${r.ride_id}','${ride.driver_id}','Rate ${escapeHtml(ride.profiles?.full_name||'your driver')}')">⭐ Rate driver</button>`:''}</div>
</article>`;}).join('');
  }
}

window.viewRideDetails=async function(rideId,mode){
  const session=await getSession();if(!session){openModal('login');return;}
  const {data:ride,error}=await supabaseClient.from('rides').select('id,driver_id,from_place,to_place,from_location,to_location,from_lat,from_lng,to_lat,to_lng,ride_date,ride_time,seats,price,contribution,status,women_only,women_preferred,verified_only,profiles(full_name)').eq('id',rideId).single();
  if(error){alert(error.message);return;}
  const driver=ride.profiles?.full_name||'BIKUBOO rider';
  const msg=`${ride.from_location||ride.from_place} → ${ride.to_location||ride.to_place}\nDate: ${formatDate(ride.ride_date)}\nTime: ${formatTime(ride.ride_time)}\nAvailable seats: ${ride.seats}\nContribution: ${Number(ride.price??ride.contribution??0)>0?'₹'+Number(ride.price??ride.contribution):'Free'}\nDriver: ${driver}\nStatus: ${rideStatusLabel(ride.status)}`;
  alert(msg);
};

window.cancelRide=async function(rideId){
  if(!confirm('Cancel this ride? Pending and accepted requests will be cancelled.'))return;
  const {error}=await supabaseClient.rpc('bikuboo_set_ride_status',{p_ride_id:rideId,p_status:'cancelled'});
  if(error){alert('Could not cancel ride: '+error.message);return;}
  alert('Ride cancelled.'); await loadMyRides(); await loadRides(); await loadDriverRequests(); await loadMyRequests();
};

window.cancelRideRequest=async function(requestId){
  const session=await getSession();if(!session)return;
  if(!confirm('Cancel your ride request?'))return;
  const {data:req,error:reqError}=await supabaseClient.from('ride_requests').select('id,status,ride_id').eq('id',requestId).eq('passenger_id',session.user.id).single();
  if(reqError){alert(reqError.message);return;}
  if(req.status==='cancelled'||req.status==='rejected'){alert('This request is already closed.');return;}
  const {error}=await supabaseClient.rpc('cancel_my_ride_request',{request_id:requestId});
  if(error){alert('Could not cancel request: '+error.message);return;}
  alert('Ride request cancelled.');
  await loadMyRequests();await loadMyRides();await loadDriverRequests();await loadRides();
};

const _oldUpdateAuthArea=updateAuthArea;
updateAuthArea=function(user){_oldUpdateAuthArea(user);setTimeout(()=>{loadMyRequests();loadDriverRequests();loadMyRides();loadPaymentHistory();},0);};

setTimeout(()=>{loadMyRides();},0);


// ---------- BIKUBOO REAL-TIME NOTIFICATIONS ----------
let notificationChannel=null;
function notificationTime(ts){if(!ts)return '';return new Date(ts).toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}

let lifecycleContext=null;

async function openRideLifecycle(action,rideId){
  const session=await getSession();if(!session){openModal('login');return;}
  const {data:ride,error}=await supabaseClient.from('rides').select('id,from_location,to_location,from_place,to_place,ride_date,ride_time,seats,status').eq('id',rideId).eq('driver_id',session.user.id).single();
  if(error){alert(error.message);return;}
  lifecycleContext={action,rideId,ride};
  const starting=action==='start';
  document.getElementById('lifecycleIcon').textContent=starting?'🏍️':'🏁';
  document.getElementById('lifecycleEyebrow').textContent=starting?'START JOURNEY':'COMPLETE JOURNEY';
  document.getElementById('lifecycleTitle').textContent=starting?'Ready to start this ride?':'Complete this ride?';
  document.getElementById('lifecycleCopy').textContent=starting?'Start only when you and your accepted passenger are ready. Complete the ride-start OTP check for each passenger.':'Mark the journey completed after you have safely reached the destination.';
  document.getElementById('lifecycleSummary').innerHTML='<div class="bk-life-route"><strong>'+escapeHtml(ride.from_location||ride.from_place||'Pickup')+'</strong><span>→</span><strong>'+escapeHtml(ride.to_location||ride.to_place||'Destination')+'</strong></div><div class="bk-life-meta"><span>📅 '+escapeHtml(formatDate(ride.ride_date))+'</span><span>🕐 '+escapeHtml(formatTime(ride.ride_time))+'</span></div>'+(starting?'<div class="bk-life-note">🔐 After starting, use the Safety Center to generate the 4-digit OTP for your passenger.</div>':'<div class="bk-life-note">⭐ Completing the ride unlocks ratings and closes the active journey.</div>');
  clearAuthMessage('lifecycleMsg');
  const btn=document.getElementById('lifecycleConfirm');btn.disabled=false;btn.textContent=starting?'Start ride':'Complete ride';
  openModal('rideLifecycleModal');
}

document.getElementById('lifecycleConfirm')?.addEventListener('click',async function(){
  if(!lifecycleContext)return;
  const {action,rideId}=lifecycleContext,btn=this;
  btn.disabled=true;btn.textContent=action==='start'?'Starting…':'Completing…';
  clearAuthMessage('lifecycleMsg');
  if(action==='start'){
    const {error}=await supabaseClient.rpc('bikuboo_set_ride_status',{p_ride_id:rideId,p_status:'started'});
    if(error){setAuthMessage('lifecycleMsg',error.message,'error');btn.disabled=false;btn.textContent='Start ride';return;}
    closeModal('rideLifecycleModal');
    document.getElementById('lifecycleSuccessIcon').textContent='🏍️';
    document.getElementById('lifecycleSuccessEyebrow').textContent='RIDE STARTED';
    document.getElementById('lifecycleSuccessTitle').textContent='You’re on your way';
    document.getElementById('lifecycleSuccessCopy').textContent='The ride is now in progress. Verify each accepted passenger with the ride-start OTP.';
    document.getElementById('lifecycleSuccessSummary').innerHTML='<div><span>NEXT STEP</span><strong>Generate ride OTP in Safety Center</strong></div>';
    openModal('rideLifecycleSuccessModal');
    await loadMyRides();await loadSafetyCenter();
  }else{
    const session=await getSession();if(!session)return;
    const {data:reqs,error:reqErr}=await supabaseClient.from('ride_requests').select('id').eq('ride_id',rideId).eq('status','accepted').limit(1);
    if(reqErr||!reqs?.length){setAuthMessage('lifecycleMsg','No accepted passenger request was found for this ride.','error');btn.disabled=false;btn.textContent='Complete ride';return;}
    const {error}=await supabaseClient.rpc('bikuboo_mark_ride_completed',{p_request_id:reqs[0].id});
    if(error){setAuthMessage('lifecycleMsg',error.message,'error');btn.disabled=false;btn.textContent='Complete ride';return;}
    closeModal('rideLifecycleModal');
    document.getElementById('lifecycleSuccessIcon').textContent='🏁';
    document.getElementById('lifecycleSuccessEyebrow').textContent='RIDE COMPLETED';
    document.getElementById('lifecycleSuccessTitle').textContent='Journey completed ✓';
    document.getElementById('lifecycleSuccessCopy').textContent='The ride has been completed successfully. Ratings are now available for the journey.';
    document.getElementById('lifecycleSuccessSummary').innerHTML='<div><span>STATUS</span><strong>Completed</strong></div>';
    openModal('rideLifecycleSuccessModal');
    await loadMyRides();await loadMyRequests();await loadSafetyCenter();
  }
  lifecycleContext=null;
});

window.startRideLifecycle=async function(rideId){openRideLifecycle('start',rideId);};
window.completeRideLifecycle=async function(rideId){openRideLifecycle('complete',rideId);};

function notificationIcon(type){return ({ride_request:'📩',request_accepted:'✅',request_rejected:'❌',ride_full:'💺',payment_paid:'💳',payment_failed:'⚠️',cash_payment_selected:'💵',cash_payment_confirmed:'✅',chat_message:'💬',ride_started:'🏁',ride_completed:'🏆',ride_cancelled:'❌',safety_alert:'🚨',verification_approved:'🛡️',verification_rejected:'⚠️'})[type]||'🔔';}
function notificationCategory(type){const t=String(type||'').toLowerCase();if(t.includes('payment')||t.includes('cash'))return 'payments';if(t.includes('chat')||t.includes('message'))return 'chat';if(t.includes('safety')||t.includes('sos')||t.includes('report')||t.includes('verification'))return 'safety';return 'rides';}
function notificationTarget(n){if(n.ride_id){if(n.type&&String(n.type).includes('chat'))return '#chat';if(n.type&&String(n.type).includes('payment'))return '#payments';if(n.type&&String(n.type).includes('safety'))return '#safety';return '#myRides';}return '#activity';}

async function loadNotifications(){
  const wrap=document.getElementById('notificationWrap'),list=document.getElementById('notificationList'),count=document.getElementById('notificationCount');
  if(!wrap||!list||!count)return;
  const session=await getSession();if(!session){wrap.hidden=true;return;}wrap.hidden=false;
  const {data,error}=await supabaseClient.from('notifications').select('id,type,title,message,ride_id,request_id,is_read,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(100);
  if(error){console.warn('Notifications load failed:',error.message);list.innerHTML='<div class="notification-empty">Notifications are temporarily unavailable.</div>';renderActivity([]);return;}
  const rows=data||[],unread=rows.filter(n=>!n.is_read).length;
  count.textContent=unread>99?'99+':String(unread);count.hidden=unread===0;
  list.innerHTML=rows.slice(0,12).map(n=>`<button type="button" class="notification-item ${n.is_read?'status-read':'unread'}" data-id="${escapeHtml(n.id)}" data-target="${escapeHtml(notificationTarget(n))}">
    <span class="notification-icon">${notificationIcon(n.type)}</span><span class="notification-copy"><b>${escapeHtml(n.title)}</b><p>${escapeHtml(n.message)}</p><small>${escapeHtml(notificationTime(n.created_at))} · ${escapeHtml(notificationCategory(n.type))}</small></span>${n.is_read?'':'<i class="notification-dot" aria-label="Unread"></i>'}</button>`).join('')||'<div class="notification-empty"><div class="notification-empty-icon">✨</div><b>You’re all caught up</b><span>Ride, payment and safety updates will appear here.</span></div>';
  list.querySelectorAll('.notification-item').forEach(el=>el.addEventListener('click',async()=>{
    await supabaseClient.from('notifications').update({is_read:true}).eq('id',el.dataset.id);
    document.querySelector(el.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});
    await loadNotifications();
  }));
  renderActivity(rows);
}
function renderActivity(data){
  const box=document.getElementById('activityList'); if(!box)return;
  const filter=window.bikubooActivityFilter||'all';
  const rows=(data||[]).filter(n=>filter==='all'||notificationCategory(n.type)===filter);
  if(!rows.length){box.innerHTML='<div class="activity-empty card"><div class="activity-empty-icon">✨</div><h3>No updates here</h3><p>New ride, payment, chat and safety updates will appear here.</p></div>';return;}
  box.innerHTML=rows.map(n=>`<article class="activity-item ${n.is_read?'read':'unread'}" data-id="${escapeHtml(n.id)}"><div class="activity-icon">${notificationIcon(n.type)}</div><div class="activity-content"><div class="activity-title-row"><h3>${escapeHtml(n.title)}</h3><span>${escapeHtml(notificationTime(n.created_at))}</span></div><p>${escapeHtml(n.message)}</p><div class="activity-bottom"><span class="activity-chip">${escapeHtml(notificationCategory(n.type))}</span>${n.ride_id?`<button class="textbtn activity-open" data-target="${escapeHtml(notificationTarget(n))}" type="button">Open related ride →</button>`:''}</div></div><button class="activity-read-btn" type="button" title="Mark as read">${n.is_read?'✓':'●'}</button></article>`).join('');
  box.querySelectorAll('.activity-item').forEach(el=>el.addEventListener('click',async(e)=>{if(e.target.closest('.activity-open'))return;await supabaseClient.from('notifications').update({is_read:true}).eq('id',el.dataset.id);await loadNotifications();}));
  box.querySelectorAll('.activity-open').forEach(btn=>btn.addEventListener('click',async()=>{const item=btn.closest('.activity-item');await supabaseClient.from('notifications').update({is_read:true}).eq('id',item.dataset.id);document.querySelector(btn.dataset.target)?.scrollIntoView({behavior:'smooth'});await loadNotifications();}));
}
function setupActivityCenter(){
  window.bikubooActivityFilter='all';
  document.querySelectorAll('.activity-filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.activity-filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');window.bikubooActivityFilter=btn.dataset.activityFilter;loadNotifications();}));
  document.getElementById('activityMarkAll')?.addEventListener('click',markAllNotificationsRead);
  document.getElementById('enableBrowserNotificationsBtn')?.addEventListener('click',async()=>{await enableBrowserNotifications();alert(Notification?.permission==='granted'?'Browser alerts enabled.':'Browser alerts were not enabled.');});
}

async function markAllNotificationsRead(){const s=await getSession();if(!s)return;await supabaseClient.from('notifications').update({is_read:true}).eq('user_id',s.user.id).eq('is_read',false);await loadNotifications();}
function stopNotificationRealtime(){if(notificationChannel){supabaseClient.removeChannel(notificationChannel);notificationChannel=null;}}
async function startNotificationRealtime(){
  stopNotificationRealtime();const s=await getSession();if(!s)return;
  notificationChannel=supabaseClient.channel('bikuboo-notifications-'+s.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${s.user.id}`},async payload=>{
    await loadNotifications();
    showNotificationToast(payload.new);
    if(document.hidden && 'Notification' in window && Notification.permission==='granted'){try{new Notification('BIKUBOO · '+payload.new.title,{body:payload.new.message});}catch(_) {}}
  }).subscribe(status=>console.log('BIKUBOO realtime notifications:',status));
}
async function enableBrowserNotifications(){if('Notification' in window && Notification.permission==='default'){try{await Notification.requestPermission();}catch(_){}}}
function showNotificationToast(n){
  let toast=document.getElementById('bkNotificationToast');
  if(!toast){toast=document.createElement('div');toast.id='bkNotificationToast';toast.className='bk-notification-toast';document.body.appendChild(toast);}
  toast.innerHTML=`<span class="bk-toast-icon">${notificationIcon(n.type)}</span><span><b>${escapeHtml(n.title||'New BIKUBOO update')}</b><small>${escapeHtml(n.message||'You have a new update.')}</small></span><button type="button" aria-label="Dismiss">×</button>`;
  toast.classList.add('show');toast.querySelector('button').onclick=()=>toast.classList.remove('show');
  clearTimeout(window.bikubooToastTimer);window.bikubooToastTimer=setTimeout(()=>toast.classList.remove('show'),5200);
}
function setupNotificationUI(){
  const btn=document.getElementById('notificationBtn'),panel=document.getElementById('notificationPanel'),mark=document.getElementById('markNotificationsRead');
  if(btn)btn.onclick=async()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))await loadNotifications();};
  if(mark)mark.onclick=markAllNotificationsRead;
  document.addEventListener('click',e=>{if(!e.target.closest('.notification-wrap'))panel?.classList.remove('open');});
}
setupNotificationUI();
setupActivityCenter();
supabaseClient.auth.onAuthStateChange(async(event,session)=>{if(session){await loadNotifications();await startNotificationRealtime();if(event==='SIGNED_IN')enableBrowserNotifications();}else{stopNotificationRealtime();const w=document.getElementById('notificationWrap');if(w)w.hidden=true;}});
(async()=>{const s=await getSession();if(s){await loadNotifications();await startNotificationRealtime();}})();

// ---------- BIKUBOO PROFILE / VERIFICATION / RATINGS ----------
function profileInitials(name){return String(name||'B').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'B';}
function profileStars(avg){const n=Math.round(Number(avg)||0);return '★'.repeat(n)+'☆'.repeat(5-n);}
async function loadProfilePage(){
  const form=document.getElementById('profileForm'); if(!form)return;
  const session=await getSession();
  if(!session){form.hidden=true;document.getElementById('profileDisplayName').textContent='Your profile';document.getElementById('profileTrustLine').textContent='Log in to manage your profile';document.getElementById('profileAvatar').textContent='B';return;}
  const {data,error}=await supabaseClient.from('profiles').select('id,full_name,role,phone,bio,bike_model,bike_number,avatar_url,verification_status,verified_at,rating_avg,rating_count').eq('id',session.user.id).single();
  if(error){console.warn('Profile load failed:',error.message);return;}
  form.hidden=false;
  document.getElementById('profileName').value=data.full_name||'';document.getElementById('profilePhone').value=data.phone||'';document.getElementById('profileBike').value=data.bike_model||'';document.getElementById('profileBikeNumber').value=data.bike_number||'';document.getElementById('profileBio').value=data.bio||'';
  document.getElementById('profileDisplayName').textContent=data.full_name||'BIKUBOO rider';
  document.getElementById('profileTrustLine').innerHTML=`${escapeHtml(data.role||'passenger')} · <span class="profile-rating-inline">${Number(data.rating_count||0)?profileStars(data.rating_avg):'☆☆☆☆☆'}</span> ${Number(data.rating_count||0)?Number(data.rating_avg).toFixed(1)+' · '+data.rating_count+' rating'+(Number(data.rating_count)===1?'':'s'): 'No ratings yet'}`;
  const av=document.getElementById('profileAvatar');av.innerHTML=data.avatar_url?`<img src="${escapeHtml(data.avatar_url)}" alt="Profile photo">`:escapeHtml(profileInitials(data.full_name));
  const st=data.verification_status||'unverified', badge=document.getElementById('verificationBadge'),txt=document.getElementById('verificationText'),btn=document.getElementById('requestVerificationBtn');
  badge.className='verify-badge '+(st==='verified'?'verified':st==='pending'?'pending':'');badge.textContent=st==='verified'?'✓ Verified':st==='pending'?'Pending review':'Unverified';txt.textContent=st==='verified'?'Identity/profile details have been verified.':st==='pending'?'Your verification request is waiting for review.':'Complete your profile and request verification.';btn.hidden=st!=='unverified';
  await loadProfileReviews(data.id);
}
async function loadProfileReviews(userId){
  const summary=document.getElementById('profileRatingSummary'),reviews=document.getElementById('profileReviews');
  const {data,error}=await supabaseClient.from('ride_ratings').select('rating,review,created_at,rater_id,profiles!ride_ratings_rater_id_fkey(full_name)').eq('ratee_id',userId).order('created_at',{ascending:false}).limit(10);
  if(error){console.warn('Reviews load failed:',error.message);summary.hidden=true;reviews.hidden=true;return;}
  const avg=data?.length?(data.reduce((a,r)=>a+Number(r.rating||0),0)/data.length):0;
  summary.hidden=false;summary.innerHTML=`<div><b>Community rating</b><div class="rating-stars">${profileStars(avg)}</div><strong>${avg?avg.toFixed(1):'—'}</strong> · ${data?.length||0} review${data?.length===1?'':'s'}</div>`;
  reviews.hidden=!data?.length;reviews.innerHTML=(data||[]).map(r=>`<div class="review"><b>${escapeHtml(r.profiles?.full_name||'BIKUBOO rider')} · ${profileStars(r.rating)}</b>${r.review?`<p>${escapeHtml(r.review)}</p>`:''}<small>${escapeHtml(new Date(r.created_at).toLocaleDateString())}</small></div>`).join('');
}
async function uploadProfilePhoto(file,userId){
  if(!file)return null;if(file.size>3*1024*1024)throw new Error('Profile photo must be 3 MB or smaller.');
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Please choose a JPG, PNG or WebP image.');
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`${userId}/avatar.${ext}`;
  const {error}=await supabaseClient.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});if(error)throw error;
  const {data}=supabaseClient.storage.from('avatars').getPublicUrl(path);return data.publicUrl+`?v=${Date.now()}`;
}
document.getElementById('profileForm')?.addEventListener('submit',async e=>{
  e.preventDefault();const session=await getSession();if(!session){openModal('login');return;}const btn=e.target.querySelector('button[type="submit"]'),msg=document.getElementById('profileSaveMsg');btn.disabled=true;btn.textContent='Saving...';msg.textContent='';
  try{let avatarUrl=null;const file=document.getElementById('profilePhoto').files[0];if(file)avatarUrl=await uploadProfilePhoto(file,session.user.id);
    const payload={full_name:document.getElementById('profileName').value.trim(),phone:document.getElementById('profilePhone').value.trim()||null,bio:document.getElementById('profileBio').value.trim()||null,bike_model:document.getElementById('profileBike').value.trim()||null,bike_number:document.getElementById('profileBikeNumber').value.trim().toUpperCase()||null};if(avatarUrl)payload.avatar_url=avatarUrl;
    const {error}=await supabaseClient.from('profiles').update(payload).eq('id',session.user.id);if(error)throw error;msg.textContent='Profile saved ✓';msg.className='authmsg success';await loadProfilePage();
  }catch(err){msg.textContent=err.message||'Could not save profile.';msg.className='authmsg error';}finally{btn.disabled=false;btn.textContent='Save profile';}
});
document.getElementById('requestVerificationBtn')?.addEventListener('click',async()=>{const btn=document.getElementById('requestVerificationBtn');btn.disabled=true;btn.textContent='Requesting...';const {error}=await supabaseClient.rpc('bikuboo_request_verification');if(error)alert(error.message);else alert('Verification request submitted.');await loadProfilePage();});

// Rating modal for completed/older accepted trips.
function ensureRatingModal(){
  if(document.getElementById('ratingModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="ratingModal" class="modal"><div class="modalbox bk-rating-modal">
  <button class="close" type="button" onclick="closeModal('ratingModal')">×</button>
  <div class="bk-rating-icon">★</div><small class="bk-rating-eyebrow">RIDE FEEDBACK</small>
  <h2>How was your ride?</h2><p id="ratingRideLabel">Share your experience with this rider.</p>
  <form id="ratingForm"><div id="ratingStars" class="bk-rating-stars" role="radiogroup" aria-label="Ride rating">${[1,2,3,4,5].map(n=>`<button type="button" data-rating="${n}" aria-label="${n} stars">★</button>`).join('')}</div>
  <div id="ratingScoreHint" class="bk-rating-score-hint">Tap a star to rate</div>
  <div class="bk-rating-tags" id="ratingTags">${['Friendly','On time','Safe ride','Good communication','Comfortable'].map(x=>`<button type="button" data-tag="${x}">${x}</button>`).join('')}</div>
  <textarea id="ratingReview" maxlength="500" rows="4" placeholder="Add an optional note about your experience…"></textarea>
  <button id="ratingSubmitBtn" class="primary" type="submit">Submit rating</button><div id="ratingMsg" class="authmsg"></div></form>
  </div></div>`);
  const stars=[...document.querySelectorAll('#ratingStars button')],form=document.getElementById('ratingForm'),hint=document.getElementById('ratingScoreHint');
  const labels=['','Not great','Could be better','Good ride','Great ride','Excellent ride'];
  stars.forEach(b=>b.onclick=()=>{const n=Number(b.dataset.rating);stars.forEach(x=>x.classList.toggle('selected',Number(x.dataset.rating)<=n));form.dataset.rating=n;hint.textContent=n+' / 5 · '+labels[n];});
  document.querySelectorAll('#ratingTags button').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
  form.onsubmit=async e=>{
    e.preventDefault();const rating=Number(form.dataset.rating||0),rideId=form.dataset.rideId,ratee=form.dataset.ratee;
    if(!rating){setAuthMessage('ratingMsg','Choose a star rating first.','error');return;}
    const btn=document.getElementById('ratingSubmitBtn');btn.disabled=true;btn.textContent='Submitting…';
    const tags=[...document.querySelectorAll('#ratingTags button.selected')].map(x=>x.dataset.tag);
    let review=document.getElementById('ratingReview').value.trim();if(tags.length)review=tags.join(' · ')+(review?' — '+review:'');
    const {error}=await supabaseClient.rpc('bikuboo_submit_rating',{p_ride_id:rideId,p_ratee_id:ratee,p_rating:rating,p_review:review});
    if(error){setAuthMessage('ratingMsg',error.message,'error');btn.disabled=false;btn.textContent='Submit rating';return;}
    document.querySelector('.bk-rating-modal').innerHTML='<div class="bk-rating-success"><div class="bk-rating-success-icon">✓</div><small>FEEDBACK RECEIVED</small><h2>Thanks for rating!</h2><p>Your feedback helps make BIKUBOO better for every rider.</p><div class="bk-rating-success-stars">'+('★'.repeat(rating))+'</div></div>';
    setTimeout(()=>{closeModal('ratingModal');loadMyRides();loadProfilePage();},1200);
  };
}
window.openRating=async function(rideId,rateeId,label){ensureRatingModal();const f=document.getElementById('ratingForm');f.dataset.rideId=rideId;f.dataset.ratee=rateeId;f.dataset.rating='';document.getElementById('ratingRideLabel').textContent=label||'Share your experience with this rider.';document.getElementById('ratingReview').value='';document.querySelectorAll('#ratingStars button').forEach(x=>x.classList.remove('selected'));document.querySelectorAll('#ratingTags button').forEach(x=>x.classList.remove('selected'));document.getElementById('ratingScoreHint').textContent='Tap a star to rate';clearAuthMessage('ratingMsg');const btn=document.getElementById('ratingSubmitBtn');btn.disabled=false;btn.textContent='Submit rating';openModal('ratingModal');};
// Add a rate action to joined rides once the scheduled ride time has passed.
const _loadMyRidesProfileHook=loadMyRides;
loadMyRides=async function(){await _loadMyRidesProfileHook();const session=await getSession();if(!session)return;const box=document.getElementById('myRidesResults');if(!box)return;if(myRidesTab==='driver'){const ids=[...box.querySelectorAll('[data-ride-id]')].map(x=>x.dataset.rideId);if(!ids.length)return;const {data}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,profiles!ride_requests_passenger_id_fkey(full_name)').in('ride_id',ids).eq('status','accepted');for(const req of (data||[])){const card=box.querySelector(`[data-ride-id="${req.ride_id}"]`),actions=card?.querySelector('.ride-actions');if(!actions)continue;const {data:already}=await supabaseClient.from('ride_ratings').select('id').eq('ride_id',req.ride_id).eq('rater_id',session.user.id).maybeSingle();if(!already&&!actions.querySelector(`[data-rate-passenger="${req.passenger_id}"]`))actions.insertAdjacentHTML('beforeend',`<button class="secondary" data-rate-passenger="${escapeHtml(req.passenger_id)}" onclick="openRating('${req.ride_id}','${req.passenger_id}','Rate ${escapeHtml(req.profiles?.full_name||'your passenger')}')">⭐ Rate passenger</button>`);}}};

const _oldAuthProfileHook=updateAuthArea;
updateAuthArea=function(user){_oldAuthProfileHook(user);setTimeout(()=>loadProfilePage(),0);};
setTimeout(()=>loadProfilePage(),0);

// ---------- BIKUBOO PRIVATE CHAT ----------
let activeChatRequestId=null;
let activeChatRideId=null;
let activeChatChannel=null;
let activeChatSession=null;

function chatParticipantInitial(name){const s=String(name||'B').trim().split(/\s+/).filter(Boolean);return ((s[0]?.[0]||'B')+(s[1]?.[0]||'')).toUpperCase().slice(0,2);}
function stopChatRealtime(){
  if(activeChatChannel){try{supabaseClient.removeChannel(activeChatChannel);}catch(e){} activeChatChannel=null;}
}
function chatParticipantLabel(name){return String(name||'BIKUBOO rider').trim()||'BIKUBOO rider';}
function chatTime(value){try{return new Date(value).toLocaleString([], {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}

async function loadChatMessages(){
  if(!activeChatRequestId||!activeChatSession)return;
  const box=document.getElementById('chatMessages');
  const {data,error}=await supabaseClient.from('ride_messages')
    .select('id,sender_id,message,created_at')
    .eq('request_id',activeChatRequestId)
    .order('created_at',{ascending:false})
    .limit(100);
  if(error){box.innerHTML=`<div class="chat-empty">Could not load messages.<br><small>${escapeHtml(error.message)}</small></div>`;return;}
  const rows=(data||[]).reverse();
  if(!rows.length){box.innerHTML='<div class="chat-empty">No messages yet.<br>Say hello and coordinate your pickup safely.</div>';return;}
  const senderIds=[...new Set(rows.map(m=>m.sender_id).filter(Boolean))];
  let names={};
  if(senderIds.length){
    const {data:profiles}=await supabaseClient.from('profiles').select('id,full_name').in('id',senderIds);
    names=Object.fromEntries((profiles||[]).map(p=>[p.id,p.full_name]));
  }
  box.innerHTML=rows.map(m=>{
    const mine=m.sender_id===activeChatSession.user.id;
    return `<div class="chat-bubble ${mine?'mine':'theirs'}"><b>${escapeHtml(mine?'You':chatParticipantLabel(names[m.sender_id]))}</b><p>${escapeHtml(m.message)}</p><small>${escapeHtml(chatTime(m.created_at))}</small></div>`;
  }).join('');
  box.scrollTop=box.scrollHeight;
}

window.openChat=async function(requestId){
  const session=await getSession();
  if(!session){openModal('login');return;}
  const {data:req,error}=await supabaseClient.from('ride_requests')
    .select('id,ride_id,passenger_id,status,rides(driver_id,from_location,to_location,from_place,to_place,profiles(full_name)),profiles!ride_requests_passenger_id_fkey(full_name)')
    .eq('id',requestId).single();
  if(error||!req){alert(error?.message||'Chat details unavailable.');return;}
  if(req.status!=='accepted'){alert('Chat is available only after the ride request is accepted.');return;}
  const ride=req.rides||{};
  const isDriver=ride.driver_id===session.user.id;
  const isPassenger=req.passenger_id===session.user.id;
  if(!isDriver&&!isPassenger){alert('You are not a participant in this ride chat.');return;}
  activeChatSession=session;activeChatRequestId=req.id;activeChatRideId=req.ride_id;
  stopChatRealtime();
  const otherName=isDriver?chatParticipantLabel(req.profiles?.full_name):chatParticipantLabel(ride.profiles?.full_name);
  document.getElementById('chatTitle').textContent=`Chat with ${otherName}`;
  document.getElementById('chatSubtitle').textContent=`${ride.from_location||ride.from_place||'Pickup'} → ${ride.to_location||ride.to_place||'Destination'}`;
  document.getElementById('chatRouteText').textContent=`${ride.from_location||ride.from_place||'Pickup'} → ${ride.to_location||ride.to_place||'Destination'}`;
  document.getElementById('chatAvatar').textContent=chatParticipantInitial(otherName);
  document.getElementById('chatStatus').textContent='🔒 Secure';
  document.getElementById('chatInput').value='';
  clearAuthMessage('chatMsg');
  openModal('chatModal');
  await loadChatMessages();
  activeChatChannel=supabaseClient.channel('bikuboo-chat-'+req.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'ride_messages',filter:`request_id=eq.${req.id}`},async()=>{await loadChatMessages();})
    .subscribe(status=>console.log('BIKUBOO realtime chat:',status));
};

window.closeChat=function(){stopChatRealtime();activeChatRequestId=null;activeChatRideId=null;activeChatSession=null;closeModal('chatModal');};

document.querySelectorAll('#chatQuick button').forEach(b=>b.addEventListener('click',()=>{const input=document.getElementById('chatInput');input.value=b.dataset.message||'';input.focus();}));

document.getElementById('chatForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!activeChatRequestId||!activeChatRideId||!activeChatSession)return;
  const input=document.getElementById('chatInput'),button=e.target.querySelector('button[type="submit"]');
  const message=input.value.trim();if(!message)return;
  button.disabled=true;button.textContent='Sending…';clearAuthMessage('chatMsg');
  try{
    const {error}=await supabaseClient.from('ride_messages').insert({ride_id:activeChatRideId,request_id:activeChatRequestId,sender_id:activeChatSession.user.id,message});
    if(error)throw error;
    input.value='';await loadChatMessages();input.focus();
  }catch(err){setAuthMessage('chatMsg',err.message||'Could not send message.','error');}
  finally{button.disabled=false;button.textContent='Send';}
});

// Add Chat buttons to accepted driver requests.
const _chatLoadDriverRequests=loadDriverRequests;
loadDriverRequests=async function(){
  await _chatLoadDriverRequests();
  const session=await getSession();if(!session)return;
  const box=document.getElementById('driverRequestResults');if(!box)return;
  const {data:requests}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,status,created_at,profiles(full_name),rides(from_location,to_location,from_place,to_place,ride_date,ride_time,seats,price,contribution,driver_id)').eq('rides.driver_id',session.user.id).order('created_at',{ascending:false});
  if(!requests?.length)return;
  box.innerHTML=requests.map(r=>{
    const ride=r.rides||{}, passenger=r.profiles?.full_name||'BIKUBOO rider', status=(r.status||'pending').toLowerCase();
    const buttons=status==='pending'?`<div class="request-actions"><button class="accept" onclick="acceptRideRequest('${r.id}','${r.ride_id}')">✓ Accept</button><button class="reject" onclick="rejectRideRequest('${r.id}')">Reject</button></div>`:status==='accepted'?`<div class="request-actions"><button class="chat-button" onclick="openChat('${r.id}')">💬 Chat with ${escapeHtml(passenger)}</button></div>`:'';
    return `<div class="ride"><b>${escapeHtml(ride.from_location||ride.from_place||'')} → ${escapeHtml(ride.to_location||ride.to_place||'')}</b><div class="request-meta"><span>Passenger: <strong>${escapeHtml(passenger)}</strong></span><span>${escapeHtml(formatDate(ride.ride_date))} · ${escapeHtml(formatTime(ride.ride_time))}</span><span>${Number(ride.seats||0)} available seat${Number(ride.seats||0)===1?'':'s'}${Number(ride.price ?? ride.contribution)>0?' · ₹'+escapeHtml(Number(ride.price ?? ride.contribution)):''}</span></div><span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status.charAt(0).toUpperCase()+status.slice(1))}</span>${buttons}</div>`;
  }).join('');
};

// Add Chat buttons to accepted rides in My Rides for passengers.
const _chatLoadMyRides=loadMyRides;
loadMyRides=async function(){
  await _chatLoadMyRides();
  const session=await getSession();if(!session)return;
  const box=document.getElementById('myRidesResults');if(!box)return;
  if(myRidesTab==='passenger'){
    const {data}=await supabaseClient.from('ride_requests').select('id,ride_id').eq('passenger_id',session.user.id).eq('status','accepted');
    for(const req of (data||[])){
      const card=box.querySelector(`[data-ride-id="${req.ride_id}"]`),actions=card?.querySelector('.ride-actions');
      if(actions&&!actions.querySelector(`[data-chat-request="${req.id}"]`))actions.insertAdjacentHTML('beforeend',`<button class="chat-button" data-chat-request="${escapeHtml(req.id)}" onclick="openChat('${req.id}')">💬 Chat driver</button>`);
    }
  }
};

// Driver-side My Rides: add Chat beside the existing Rate passenger action.
const _chatProfileHook=loadMyRides;
loadMyRides=async function(){
  await _chatProfileHook();
  const session=await getSession();if(!session||myRidesTab!=='driver')return;
  const box=document.getElementById('myRidesResults');if(!box)return;
  const ids=[...box.querySelectorAll('[data-ride-id]')].map(x=>x.dataset.rideId);if(!ids.length)return;
  const {data}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,profiles!ride_requests_passenger_id_fkey(full_name)').in('ride_id',ids).eq('status','accepted');
  for(const req of (data||[])){
    const actions=box.querySelector(`[data-ride-id="${req.ride_id}"] .ride-actions`);if(!actions)continue;
    if(!actions.querySelector(`[data-chat-request="${req.id}"]`))actions.insertAdjacentHTML('beforeend',`<button class="chat-button" data-chat-request="${escapeHtml(req.id)}" onclick="openChat('${req.id}')">💬 Chat ${escapeHtml(req.profiles?.full_name||'passenger')}</button>`);
  }
};

// BIKUBOO Safety Center: accepted-ride OTP, SOS, emergency contact, report & block.
let safetyUserProfile=null;
let safetyActiveRequestId=null;
let safetyActiveOtherUserId=null;
let safetyActiveRideId=null;

async function loadSafetyCenter(){
  const box=document.getElementById('safetyRides'), contact=document.getElementById('emergencyContactView');
  if(!box)return;
  const session=await getSession();
  if(!session){box.innerHTML='<div class="safety-empty">Log in to see your accepted rides.</div>';contact.textContent='Add an emergency contact in your Profile.';return;}
  const {data:profile}=await supabaseClient.from('emergency_contacts').select('contact_name,contact_phone').eq('user_id',session.user.id).maybeSingle();
  safetyUserProfile=profile||{};
  contact.innerHTML=profile?.contact_name&&profile?.contact_phone?`<div><b>${escapeHtml(profile.contact_name)}</b><br><span>${escapeHtml(profile.contact_phone)}</span></div>`:'Add an emergency contact in your Profile.';
  const {data:driverReqs}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,status,rides(id,driver_id,from_location,to_location,from_place,to_place,ride_date,ride_time,profiles(full_name))').eq('status','accepted').eq('rides.driver_id',session.user.id).order('created_at',{ascending:false}).limit(20);
  const {data:passengerReqs}=await supabaseClient.from('ride_requests').select('id,ride_id,passenger_id,status,rides(id,driver_id,from_location,to_location,from_place,to_place,ride_date,ride_time,profiles(full_name))').eq('status','accepted').eq('passenger_id',session.user.id).order('created_at',{ascending:false}).limit(20);
  const rows=[];
  for(const r of (driverReqs||[]))rows.push({...r,role:'driver'});
  for(const r of (passengerReqs||[]))rows.push({...r,role:'passenger'});
  if(!rows.length){box.innerHTML='<div class="safety-empty">No accepted rides yet. Once a request is accepted, ride verification tools will appear here.</div>';return;}
  const ids=rows.map(r=>r.id);
  const {data:safety}=await supabaseClient.from('ride_safety').select('request_id,started_at,completed_at,last_sos_at').in('request_id',ids);
  const safetyMap=Object.fromEntries((safety||[]).map(x=>[x.request_id,x]));
  box.innerHTML=rows.map(r=>{
    const ride=r.rides||{}, s=safetyMap[r.id], started=!!s?.started_at, other=r.role==='driver'?(ride.profiles?.full_name||'Passenger'):(ride.profiles?.full_name||'Driver');
    const when=`${formatDate(ride.ride_date)} · ${formatTime(ride.ride_time)}`;
    let actions='';
    if(r.role==='driver') actions=started?`<button onclick="completeSafetyRide('${r.id}')">✓ Mark completed</button>`:`<button class="safety-primary" onclick="startSafetyRide('${r.id}')">🔢 Generate ride OTP</button>`;
    else actions=started?`<span class="safety-status started">Ride verified ✓</span>`:`<button class="safety-primary" onclick="verifySafetyRide('${r.id}')">🔐 Verify ride OTP</button>`;
    actions+=`<button onclick="openSafetyReport('${r.id}','${r.ride_id}','${r.role==='driver'?escapeHtml(r.passenger_id):escapeHtml(ride.driver_id)}','${escapeHtml(other)}')">⚠️ Report</button><button class="sos-btn" onclick="sendSafetySOS('${r.id}')">🚨 SOS</button>`;
    return `<div class="safety-ride"><div class="safety-ride-top"><div><b>${escapeHtml(ride.from_location||ride.from_place||'Pickup')} → ${escapeHtml(ride.to_location||ride.to_place||'Destination')}</b><small>${escapeHtml(when)} · ${escapeHtml(r.role==='driver'?'Passenger: ':'Driver: ')}${escapeHtml(other)}</small></div><span class="safety-status ${started?'started':'waiting'}">${started?'Ride started':'Not verified'}</span></div><div class="safety-ride-actions">${actions}</div></div>`;
  }).join('');
}

let safetyOtpTimer=null;
function startSafetyOtpCountdown(expiresAt){
  clearInterval(safetyOtpTimer);
  const el=document.getElementById('safetyOtpCountdown'); if(!el)return;
  const tick=()=>{const left=Math.max(0,new Date(expiresAt)-Date.now()),mins=Math.floor(left/60000),secs=Math.floor(left/1000)%60;el.textContent=left?('Expires in '+mins+':'+String(secs).padStart(2,'0')):'OTP expired';el.classList.toggle('expired',!left);if(!left)clearInterval(safetyOtpTimer);};
  tick();safetyOtpTimer=setInterval(tick,1000);
}
window.startSafetyRide=async function(requestId){
  const {data,error}=await supabaseClient.rpc('bikuboo_start_ride',{p_request_id:requestId});
  if(error){alert(error.message);return;}
  const row=data?.[0]||data;
  safetyActiveRequestId=requestId;
  const expiresAt=row?.expires_at||new Date(Date.now()+30*60000).toISOString();
  document.getElementById('safetyModalTitle').textContent='Share your ride OTP';
  document.getElementById('safetyModalSubtitle').textContent='Show this code privately to your accepted passenger. Never post it publicly.';
  document.getElementById('safetyModalBody').innerHTML=`<div class="bk-safety-otp-panel"><div class="bk-safety-otp-label">RIDE-START CODE</div><div class="bk-safety-otp">${escapeHtml(row?.otp_code||'----').split('').map(d=>'<span>'+d+'</span>').join('')}</div><div id="safetyOtpCountdown" class="bk-safety-otp-countdown"></div><div class="bk-safety-otp-tip">🔐 This code is for this ride only. Ask your passenger to enter it before departure.</div></div><div class="safety-modal-actions"><button class="secondary" onclick="closeModal('safetyModal');loadSafetyCenter()">Done</button><button class="safety-danger" onclick="sendSafetySOS('${requestId}')">🚨 SOS</button></div>`;
  openModal('safetyModal');startSafetyOtpCountdown(expiresAt);await loadSafetyCenter();
};

window.verifySafetyRide=async function(requestId){
  safetyActiveRequestId=requestId;
  document.getElementById('safetyModalTitle').textContent='Verify your ride';
  document.getElementById('safetyModalSubtitle').textContent='Enter the 4-digit code shared by your driver before you leave.';
  document.getElementById('safetyModalBody').innerHTML=`<form id="safetyOtpForm" class="bk-safety-verify-form"><div class="bk-safety-verify-badge">🔐 SECURE RIDE CHECK</div><p class="bk-safety-verify-help">Your driver should show you the code in person. Never accept an OTP sent publicly.</p><div class="bk-otp-inputs" id="bkOtpInputs"><input class="bk-otp-input" maxlength="1" inputmode="numeric" autocomplete="one-time-code" aria-label="OTP digit 1"><input class="bk-otp-input" maxlength="1" inputmode="numeric" aria-label="OTP digit 2"><input class="bk-otp-input" maxlength="1" inputmode="numeric" aria-label="OTP digit 3"><input class="bk-otp-input" maxlength="1" inputmode="numeric" aria-label="OTP digit 4"></div><div id="safetyOtpMsg" class="authmsg"></div><div class="safety-modal-actions"><button type="button" class="secondary" onclick="closeModal('safetyModal')">Cancel</button><button id="bkVerifyOtpBtn" class="primary" type="submit">Verify ride</button></div></form>`;
  openModal('safetyModal');
  const inputs=[...document.querySelectorAll('.bk-otp-input')];inputs[0]?.focus();
  inputs.forEach((input,i)=>{input.addEventListener('input',()=>{input.value=input.value.replace(/\\D/g,'').slice(0,1);if(input.value&&inputs[i+1])inputs[i+1].focus();});input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&inputs[i-1])inputs[i-1].focus();});});
  document.getElementById('safetyOtpForm').onsubmit=async e=>{e.preventDefault();const code=inputs.map(x=>x.value).join('');const btn=document.getElementById('bkVerifyOtpBtn');if(code.length!==4){setAuthMessage('safetyOtpMsg','Enter all 4 digits to verify the ride.','error');return;}btn.disabled=true;btn.textContent='Verifying…';try{const {error}=await supabaseClient.rpc('bikuboo_verify_ride_otp',{p_request_id:requestId,p_otp:code});if(error)throw error;document.getElementById('safetyModalBody').innerHTML='<div class="bk-otp-success"><div class="bk-otp-success-icon">✓</div><b>Ride verified</b><p>You’re verified and ready to go. Have a safe journey!</p></div>';await loadSafetyCenter();setTimeout(()=>closeModal('safetyModal'),1100);}catch(err){setAuthMessage('safetyOtpMsg',err.message||'Could not verify OTP. Check the code and try again.','error');btn.disabled=false;btn.textContent='Verify ride';inputs.forEach(x=>x.classList.remove('error'));inputs.forEach(x=>x.classList.add('shake'));setTimeout(()=>inputs.forEach(x=>x.classList.remove('shake')),450);}};
};

window.completeSafetyRide=async function(requestId){
  const {data:req,error:reqErr}=await supabaseClient.from('ride_requests').select('ride_id').eq('id',requestId).single();
  if(reqErr||!req?.ride_id){alert(reqErr?.message||'Ride not found.');return;}
  openRideLifecycle('complete',req.ride_id);
};

window.sendSafetySOS=async function(requestId){
  const session=await getSession();if(!session){openModal('login');return;}
  if(!confirm('Send an SOS safety alert to the other accepted rider?'))return;
  const message=prompt('Optional message for the other rider:','I need help. Please contact me immediately.')||'Emergency assistance requested';
  const {error}=await supabaseClient.rpc('bikuboo_sos',{p_request_id:requestId,p_message:message});
  if(error){alert(error.message);return;}
  alert('SOS alert sent. If you are in immediate danger, contact local emergency services now.');
  await loadSafetyCenter();
};

window.openSafetyReport=async function(requestId,rideId,reportedUserId,reportedName){
  safetyActiveRequestId=requestId;safetyActiveRideId=rideId;safetyActiveOtherUserId=reportedUserId;
  document.getElementById('safetyModalTitle').textContent='Report a rider';
  document.getElementById('safetyModalSubtitle').textContent=`Report ${reportedName||'this rider'} if something felt unsafe or inappropriate.`;
  document.getElementById('safetyModalBody').innerHTML=`<form id="safetyReportForm"><div class="safety-report-grid"><label>Reason<select id="safetyReportReason"><option>Unsafe behavior</option><option>Harassment</option><option>Wrong vehicle or identity</option><option>Abusive communication</option><option>Other</option></select></label><label>Block this rider?<select id="safetyBlockChoice"><option value="no">No</option><option value="yes">Yes — block future contact</option></select></label><label class="full">Details<textarea id="safetyReportDetails" rows="4" maxlength="1000" placeholder="Tell us what happened..."></textarea></label></div><div class="safety-report-actions"><button class="primary" type="submit">Submit report</button></div><div id="safetyReportMsg" class="authmsg"></div></form>`;
  openModal('safetyModal');
  document.getElementById('safetyReportForm').onsubmit=async e=>{e.preventDefault();const reason=document.getElementById('safetyReportReason').value,details=document.getElementById('safetyReportDetails').value.trim(),btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;try{const {error}=await supabaseClient.rpc('bikuboo_submit_safety_report',{p_reported_user:reportedUserId,p_ride_id:rideId,p_reason:reason,p_details:details});if(error)throw error;if(document.getElementById('safetyBlockChoice').value==='yes'){const b=await supabaseClient.rpc('bikuboo_block_user',{p_blocked_user:reportedUserId});if(b.error)throw b.error;}setAuthMessage('safetyReportMsg','Report submitted. Thank you for helping keep BIKUBOO safe.','success');setTimeout(()=>closeModal('safetyModal'),800);}catch(err){setAuthMessage('safetyReportMsg',err.message||'Could not submit report.','error');}finally{btn.disabled=false;}};
};

const _loadProfileBeforeSafety=loadProfilePage;
loadProfilePage=async function(){await _loadProfileBeforeSafety();const session=await getSession();if(!session)return;const {data}=await supabaseClient.from('emergency_contacts').select('contact_name,contact_phone').eq('user_id',session.user.id).maybeSingle();if(document.getElementById('profileEmergencyName'))document.getElementById('profileEmergencyName').value=data?.contact_name||'';if(document.getElementById('profileEmergencyPhone'))document.getElementById('profileEmergencyPhone').value=data?.contact_phone||'';};

// Extend profile save with private emergency-contact fields.
const _profileFormSafetyHandler=document.getElementById('profileForm');
_profileFormSafetyHandler?.addEventListener('submit',async e=>{
  const session=await getSession();if(!session)return;
  const name=document.getElementById('profileEmergencyName')?.value.trim()||'', phone=document.getElementById('profileEmergencyPhone')?.value.trim()||'';
  let error=null;
  if(name&&phone){const r=await supabaseClient.from('emergency_contacts').upsert({user_id:session.user.id,contact_name:name,contact_phone:phone},{onConflict:'user_id'});error=r.error;}else{const r=await supabaseClient.from('emergency_contacts').delete().eq('user_id',session.user.id);error=r.error;}
  if(error)console.warn('Emergency contact save failed:',error.message); else setTimeout(loadSafetyCenter,250);
});

// Refresh safety tools after auth changes and keep the section current.
const _safetyOriginalUpdate=updateAuthArea;
updateAuthArea=function(user){_safetyOriginalUpdate(user);setTimeout(()=>{loadSafetyCenter();},250);};
setTimeout(()=>{loadSafetyCenter();},600);

// ---------- BIKUBOO ADMIN DASHBOARD ----------
let bikubooIsAdmin=false;
function adminEscape(v){return escapeHtml(v);}
function adminDate(v){try{return v?new Date(v).toLocaleString([], {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';}catch(e){return '—';}}
function adminSetVisible(visible){const sec=document.getElementById('admin');const nav=document.getElementById('adminNavLink');if(sec)sec.hidden=!visible;if(nav)nav.hidden=!visible;}
async function checkAdminAccess(){
  const session=await getSession();
  if(!session){bikubooIsAdmin=false;adminSetVisible(false);return false;}
  const {data,error}=await supabaseClient.rpc('bikuboo_is_admin');
  bikubooIsAdmin=!error&&data===true; adminSetVisible(bikubooIsAdmin);
  if(bikubooIsAdmin) await loadAdminDashboard();
  return bikubooIsAdmin;
}
function adminLoading(id){const el=document.getElementById(id);if(el)el.innerHTML='<div class="admin-loading">Loading…</div>';}
async function loadAdminDashboard(){
  if(!bikubooIsAdmin)return;
  const {data,error}=await supabaseClient.rpc('bikuboo_admin_dashboard');
  if(error){document.getElementById('adminSetupNotice').hidden=false;document.getElementById('adminSetupNotice').textContent='Admin setup is incomplete. Run ADMIN_SETUP.sql, then add your account to bikuboo_admins using your Supabase Auth user ID.';return;}
  const s=data||{}; document.getElementById('adminStats').innerHTML=[['USERS',s.users],['ACTIVE RIDES',s.active_rides],['COMPLETED',s.completed_rides],['PENDING VERIFICATION',s.pending_verification],['OPEN REPORTS',s.open_reports],['RATINGS',s.ratings]].map(x=>`<div class="admin-stat"><span>${x[0]}</span><strong>${Number(x[1]||0)}</strong></div>`).join('');
}
function switchAdminTab(tab){
  if(!bikubooIsAdmin)return;
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));
  ['overview','users','verification','reports','rides'].forEach(x=>{const e=document.getElementById('admin'+x.charAt(0).toUpperCase()+x.slice(1));if(e)e.hidden=x!==tab;});
  if(tab==='users')loadAdminUsers(); if(tab==='verification')loadAdminVerifications(); if(tab==='reports')loadAdminReports(); if(tab==='rides')loadAdminRides();
}
window.switchAdminTab=switchAdminTab;
document.querySelectorAll('.admin-tab').forEach(b=>b.addEventListener('click',()=>switchAdminTab(b.dataset.adminTab)));
async function loadAdminUsers(){
  if(!bikubooIsAdmin)return;adminLoading('adminUsersList');const q=document.getElementById('adminUserSearch')?.value.trim()||'';const {data,error}=await supabaseClient.rpc('bikuboo_admin_users',{p_search:q});const box=document.getElementById('adminUsersList');if(error){box.innerHTML=`<div class="admin-empty">${adminEscape(error.message)}</div>`;return;}if(!data?.length){box.innerHTML='<div class="admin-empty">No users found.</div>';return;}
  box.innerHTML=`<table class="admin-table"><thead><tr><th>User</th><th>Role</th><th>Bike</th><th>Trust</th><th>Status</th><th>Actions</th></tr></thead><tbody>${data.map(u=>`<tr><td><strong>${adminEscape(u.full_name||'BIKUBOO rider')}</strong><div class="admin-muted">${adminEscape(u.phone||'No phone')} · joined ${adminEscape(adminDate(u.created_at))}</div></td><td>${adminEscape(u.role||'Passenger')}</td><td>${adminEscape(u.bike_model||'—')}<div class="admin-muted">${adminEscape(u.bike_number||'')}</div></td><td>${u.rating_count?`⭐ ${Number(u.rating_avg||0).toFixed(1)} · ${u.rating_count}`:'No ratings'}</td><td>${u.suspended?'<span class="admin-pill suspended">Suspended</span>':u.verification_status==='verified'?'<span class="admin-pill verified">✓ Verified</span>':u.verification_status==='pending'?'<span class="admin-pill pending">Pending</span>':'<span class="admin-pill">Unverified</span>'}</td><td><div class="admin-actions">${u.suspended?`<button onclick="adminSuspendUser('${u.id}',false)">Restore</button>`:`<button class="danger" onclick="adminSuspendUser('${u.id}',true)">Suspend</button>`}</div></td></tr>`).join('')}</tbody></table>`;
}
window.loadAdminUsers=loadAdminUsers;
window.adminSuspendUser=async function(id,suspended){if(!confirm(suspended?'Suspend this account?':'Restore this account?'))return;const {error}=await supabaseClient.rpc('bikuboo_admin_set_suspended',{p_user:id,p_suspended:suspended});if(error){alert(error.message);return;}await loadAdminUsers();await loadAdminDashboard();};
async function loadAdminVerifications(){
  if(!bikubooIsAdmin)return;adminLoading('adminVerificationList');const {data,error}=await supabaseClient.rpc('bikuboo_admin_verifications');const box=document.getElementById('adminVerificationList');if(error){box.innerHTML=`<div class="admin-empty">${adminEscape(error.message)}</div>`;return;}if(!data?.length){box.innerHTML='<div class="admin-empty">No pending verification requests. 🎉</div>';return;}
  box.innerHTML=`<table class="admin-table"><thead><tr><th>Rider</th><th>Bike</th><th>About</th><th>Requested</th><th>Action</th></tr></thead><tbody>${data.map(u=>`<tr><td><strong>${adminEscape(u.full_name||'BIKUBOO rider')}</strong><div class="admin-muted">${adminEscape(u.phone||'No phone')}</div></td><td>${adminEscape(u.bike_model||'—')}<div class="admin-muted">${adminEscape(u.bike_number||'')}</div></td><td class="admin-review">${adminEscape(u.bio||'No bio added.')}</td><td>${adminEscape(adminDate(u.created_at))}</td><td><div class="admin-actions"><button onclick="adminVerifyUser('${u.id}',true)">✓ Approve</button><button class="danger" onclick="adminVerifyUser('${u.id}',false)">Reject</button></div></td></tr>`).join('')}</tbody></table>`;
}
window.loadAdminVerifications=loadAdminVerifications;
window.adminVerifyUser=async function(id,approved){if(!confirm(approved?'Approve this verification request?':'Reject this verification request?'))return;const {error}=await supabaseClient.rpc('bikuboo_admin_set_verification',{p_user:id,p_approved:approved});if(error){alert(error.message);return;}await loadAdminVerifications();await loadAdminDashboard();};
async function loadAdminReports(){
  if(!bikubooIsAdmin)return;adminLoading('adminReportsList');const {data,error}=await supabaseClient.rpc('bikuboo_admin_reports');const box=document.getElementById('adminReportsList');if(error){box.innerHTML=`<div class="admin-empty">${adminEscape(error.message)}</div>`;return;}if(!data?.length){box.innerHTML='<div class="admin-empty">No safety reports yet.</div>';return;}
  box.innerHTML=`<table class="admin-table"><thead><tr><th>Report</th><th>Reported rider</th><th>Ride</th><th>Details</th><th>Status</th><th>Action</th></tr></thead><tbody>${data.map(r=>`<tr><td><strong>${adminEscape(r.reason)}</strong><div class="admin-muted">By ${adminEscape(r.reporter_name)} · ${adminEscape(adminDate(r.created_at))}</div></td><td>${adminEscape(r.reported_name)}</td><td>${adminEscape(r.ride_id||'—')}</td><td class="admin-review">${adminEscape(r.details||'No additional details.')}${r.admin_note?`<div class="admin-muted">Admin: ${adminEscape(r.admin_note)}</div>`:''}</td><td>${r.status==='open'?'<span class="admin-pill pending">Open</span>':`<span class="admin-pill">${adminEscape(r.status)}</span>`}</td><td><div class="admin-actions">${r.status==='open'?`<button onclick="adminResolveReport('${r.id}','resolved')">Resolve</button><button class="danger" onclick="adminResolveReport('${r.id}','dismissed')">Dismiss</button>`:'<span class="admin-muted">Closed</span>'}</div></td></tr>`).join('')}</tbody></table>`;
}
window.loadAdminReports=loadAdminReports;
window.adminResolveReport=async function(id,status){const note=prompt(status==='resolved'?'Resolution note (optional):':'Dismissal note (optional):','')??'';const {error}=await supabaseClient.rpc('bikuboo_admin_resolve_report',{p_report:id,p_status:status,p_note:note});if(error){alert(error.message);return;}await loadAdminReports();await loadAdminDashboard();};
async function loadAdminRides(){
  if(!bikubooIsAdmin)return;adminLoading('adminRidesList');const {data,error}=await supabaseClient.rpc('bikuboo_admin_rides');const box=document.getElementById('adminRidesList');if(error){box.innerHTML=`<div class="admin-empty">${adminEscape(error.message)}</div>`;return;}if(!data?.length){box.innerHTML='<div class="admin-empty">No rides found.</div>';return;}
  box.innerHTML=`<table class="admin-table"><thead><tr><th>Route</th><th>Driver</th><th>Date / time</th><th>Seats</th><th>Price</th><th>Status</th></tr></thead><tbody>${data.map(r=>`<tr><td><strong>${adminEscape(r.from_location||'Pickup')}</strong><div class="admin-muted">→ ${adminEscape(r.to_location||'Destination')}</div></td><td>${adminEscape(r.driver_name)}</td><td>${adminEscape(formatDate(r.ride_date))}<div class="admin-muted">${adminEscape(formatTime(r.ride_time))}</div></td><td>${adminEscape(r.seats)}</td><td>₹${adminEscape(r.price??r.contribution??0)}</td><td><span class="admin-pill">${adminEscape(r.status||'open')}</span></td></tr>`).join('')}</tbody></table>`;
}
window.loadAdminRides=loadAdminRides;


async function loadRewards(){
  const session=await getSession(); const codeEl=document.getElementById('referralCode');
  if(!codeEl)return;
  if(!session){codeEl.textContent='Log in to view'; document.getElementById('rewardBalance').textContent='₹0'; document.getElementById('rewardHistory').innerHTML='<div class="ride"><small>Log in to see your rewards.</small></div>';return;}
  const {data:p}=await supabaseClient.from('profiles').select('referral_code').eq('id',session.user.id).single();
  codeEl.textContent=p?.referral_code||('BIKU'+session.user.id.replaceAll('-','').slice(0,8).toUpperCase());
  const {data:b}=await supabaseClient.rpc('bikuboo_reward_balance'); document.getElementById('rewardBalance').textContent='₹'+Number(b||0).toFixed(0);
  const {data:h,error}=await supabaseClient.rpc('bikuboo_reward_history'); const box=document.getElementById('rewardHistory');
  if(error){box.innerHTML='<div class="ride"><small>Run REFERRALS_REWARDS_SETUP.sql to enable rewards.</small></div>';return;}
  box.innerHTML=h?.length?'<h3>Reward history</h3>'+h.map(x=>`<div class="reward-row"><div><b>${escapeHtml(x.description)}</b><small>${escapeHtml(new Date(x.created_at).toLocaleString())}</small></div><strong>${Number(x.amount)>=0?'+':''}₹${Number(x.amount).toFixed(0)}</strong></div>`).join(''):'<div class="ride"><small>No rewards yet. Invite a friend to get started.</small></div>';
}
window.loadRewards=loadRewards;
document.getElementById('copyReferralBtn')?.addEventListener('click',async()=>{const code=document.getElementById('referralCode')?.textContent;if(!code||code==='—'||code==='Log in to view')return;if(navigator.clipboard)await navigator.clipboard.writeText(code);setAuthMessage('referralMsg','Referral code copied!','success');});
document.getElementById('shareReferralBtn')?.addEventListener('click',async()=>{const code=document.getElementById('referralCode')?.textContent;if(!code||code==='—'||code==='Log in to view')return;const text=`Join me on BIKUBOO 🏍️ Use my referral code ${code} when you create your account.`;if(navigator.share){try{await navigator.share({title:'Join BIKUBOO',text})}catch(e){}}else{if(navigator.clipboard)await navigator.clipboard.writeText(text);setAuthMessage('referralMsg','Invite copied to clipboard!','success');}});
document.getElementById('claimReferralBtn')?.addEventListener('click',async()=>{const code=document.getElementById('referralInput').value.trim();clearAuthMessage('referralMsg');if(!code){setAuthMessage('referralMsg','Enter a referral code.','error');return;}const {error}=await supabaseClient.rpc('bikuboo_claim_referral',{p_code:code});if(error){setAuthMessage('referralMsg',error.message,'error');return;}setAuthMessage('referralMsg','Referral linked! You will earn ₹50 after your first completed ride.','success');document.getElementById('referralInput').value='';});
loadRewards();
supabaseClient.auth.onAuthStateChange(()=>setTimeout(loadRewards,300));

const _adminAuthHook=updateAuthArea;
updateAuthArea=function(user){_adminAuthHook(user);setTimeout(()=>checkAdminAccess(),200);};
setTimeout(()=>checkAdminAccess(),700);

// Vibrant navigation: compact mobile menu without changing app navigation behavior.
document.addEventListener('DOMContentLoaded', () => {
  const moreBtn = document.getElementById('moreNavBtn');
  const moreMenu = document.getElementById('moreNavMenu');
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener('click', (e) => { e.stopPropagation(); moreMenu.classList.toggle('open'); });
    moreMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => moreMenu.classList.remove('open')));
    document.addEventListener('click', (e) => { if (!moreMenu.contains(e.target) && e.target !== moreBtn) moreMenu.classList.remove('open'); });
  }
  const menu = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mainNav');
  if (!menu || !nav) return;
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = '☰';
  }));
});
