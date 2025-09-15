
function showMsg(el, type, text){
  const target = (typeof el === 'string') ? document.getElementById(el) : el;
  if(!target) return;
  target.className = `toast ${type}`;
  target.textContent = text;
  clearTimeout(target.__t);
  target.__t = setTimeout(()=>{
    target.className = 'toast';
    target.textContent = '';
  }, 5000);
}
function askConfirm(text){ return window.confirm(text); }
function formatErr(action, e){
  const reason = e?.message || e || 'motivo desconocido';
  return `Ocurrió un error al ${action} debido a: ${reason}`;
}
