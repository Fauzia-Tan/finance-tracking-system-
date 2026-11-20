
(function(){
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  var tabs = {login:$('#tab-login'), signup:$('#tab-signup')};
  var forms = {login:$('#login-form'), signup:$('#signup-form')};
  var done = $('#done');
  var guestOption = $('#guest-option');
  var segEl = $('.seg');

  function show(which){
    done.classList.remove('show');
    guestOption.style.display = '';
    segEl.style.display = '';
    Object.keys(tabs).forEach(function(k){
      var on = k === which;
      tabs[k].setAttribute('aria-selected', on);
      tabs[k].tabIndex = on ? 0 : -1;
      forms[k].classList.toggle('active', on);
    });
    try{ history.replaceState(null,'', '#'+which); }catch(e){}
  }
  Object.keys(tabs).forEach(function(k){
    tabs[k].addEventListener('click', function(){ show(k); });
    tabs[k].addEventListener('keydown', function(e){
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        var other = k==='login'?'signup':'login'; show(other); tabs[other].focus();
      }
    });
  });
  $$('[data-go]').forEach(function(b){ b.addEventListener('click', function(){ show(b.dataset.go); }); });
  $('#guest').addEventListener('click', function(){
    sessionStorage.removeItem('hayag-demo-session');
    window.location.replace('asset.html');
  });
  show(location.hash === '#signup' ? 'signup' : 'login');

  // show / hide password
  $$('[data-toggle]').forEach(function(b){
    b.addEventListener('click', function(){
      var i = document.getElementById(b.dataset.toggle);
      var showing = i.type === 'text';
      i.type = showing ? 'password' : 'text';
      b.textContent = showing ? 'Show' : 'Hide';
      b.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  // password strength
  var meter = $('#meter'), meterLabel = $('#pw-label');
  var words = ['Use 8+ characters with letters and numbers.','Weak','Fair','Good','Strong'];
  $('#su-pass').addEventListener('input', function(e){
    var v = e.target.value, s = 0;
    if(v.length >= 8) s++;
    if(/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if(/\d/.test(v)) s++;
    if(/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    if(!v) s = 0;
    meter.dataset.level = s;
    meterLabel.textContent = words[s];
  });

  // validation helpers
  function setErr(input, msg){
    var f = input.closest('[data-field]'), e = $('.err', f);
    f.classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    e.textContent = msg || '';
    return !msg;
  }
  var gmail = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

  function vEmail(i){
    var v = i.value.trim();
    if(!v) return setErr(i,'Enter your Gmail address.');
    if(!gmail.test(v)) return setErr(i,'Use a valid Gmail address ending in @gmail.com.');
    return setErr(i,'');
  }
  function vName(i){
    var v = i.value.trim();
    if(v.length < 2) return setErr(i,'Enter your full name.');
    return setErr(i,'');
  }
  function vPassNew(i){
    var v = i.value;
    if(v.length < 8) return setErr(i,'Password must be at least 8 characters.');
    if(!/[A-Za-z]/.test(v) || !/\d/.test(v)) return setErr(i,'Include at least one letter and one number.');
    return setErr(i,'');
  }
  function vPassLogin(i){
    if(!i.value) return setErr(i,'Enter your password.');
    return setErr(i,'');
  }
  function vBday(i){
    if(!i.value) return setErr(i,'Select your birthdate.');
    var d = new Date(i.value + 'T00:00:00'), now = new Date();
    if(isNaN(d) || d > now) return setErr(i,'Birthdate cannot be in the future.');
    if(d.getFullYear() < 1900) return setErr(i,'Enter a valid birthdate.');
    return setErr(i,'');
  }

  // live re-validate once a field has been flagged
  $$('input').forEach(function(i){
    i.addEventListener('blur', function(){
      if(!i.value) return;
      var map = {'li-email':vEmail,'su-email':vEmail,'su-name':vName,'su-pass':vPassNew,'su-bday':vBday};
      if(map[i.id]) map[i.id](i);
    });
    i.addEventListener('input', function(){
      if(i.closest('[data-field]') && i.closest('[data-field]').classList.contains('bad')){
        var map = {'li-email':vEmail,'su-email':vEmail,'su-name':vName,'su-pass':vPassNew,'su-bday':vBday,'li-pass':vPassLogin};
        if(map[i.id]) map[i.id](i);
      }
    });
  });

  // max date = today
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $('#su-bday').max = today.toISOString().slice(0,10);

  function finish(title, msg){
    forms.login.classList.remove('active');
    forms.signup.classList.remove('active');
    guestOption.style.display = 'none';
    segEl.style.display = 'none';
    $('#done-title').textContent = title;
    $('#done-msg').textContent = msg;
    done.classList.add('show');
    $('#done-back').focus();
  }

  // Demo-only session flag; connect a real authentication service before production use.
  forms.login.addEventListener('submit', function(e){
    e.preventDefault();
    var email = $('#li-email'), pass = $('#li-pass');
    var ok = [vEmail(email), vPassLogin(pass)].every(Boolean);
    if(!ok){ ($('[aria-invalid="true"]', forms.login)||{focus:function(){}}).focus(); return; }
    sessionStorage.setItem('hayag-demo-session', 'active');
    window.location.replace('asset.html');
  });

  forms.signup.addEventListener('submit', function(e){
    e.preventDefault();
    var n = $('#su-name'), em = $('#su-email'), p = $('#su-pass'), b = $('#su-bday');
    var ok = [vName(n), vEmail(em), vPassNew(p), vBday(b)].every(Boolean);
    if(!ok){ ($('[aria-invalid="true"]', forms.signup)||{focus:function(){}}).focus(); return; }
    sessionStorage.setItem('hayag-demo-session', 'active');
    window.location.replace('asset.html');
  });

  $('#done-back').addEventListener('click', function(){
    forms.login.reset(); forms.signup.reset();
    meter.dataset.level = 0; meterLabel.textContent = words[0];
    show('login');
  });

  $('#forgot').addEventListener('click', function(){
    var em = $('#li-email');
    if(!vEmail(em)) { em.focus(); return; }
    finish('Check your inbox', 'If ' + em.value.trim() + ' has an account, a reset link would be sent. (Demo only.)');
  });
})();