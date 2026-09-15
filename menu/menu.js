const labels={market:'MARKET',inventory:'ENVANTER',ranking:'SIRALAMA',settings:'AYARLAR'};
const title=document.querySelector('#panel-title');
document.querySelectorAll('.menu-tabs button').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('.menu-tabs button').forEach(b=>b.classList.remove('active'));
    button.classList.add('active');
    title.textContent=labels[button.dataset.section];
  });
});
document.querySelector('.menu-tabs button').classList.add('active');
