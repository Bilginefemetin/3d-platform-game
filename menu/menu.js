const labels={market:'MARKET',inventory:'ENVANTER',ranking:'SIRALAMA',settings:'AYARLAR'};
const title=document.querySelector('#panel-title');
const content=document.querySelector('#panel-content');
const coinCount=document.querySelector('#coin-count');
const nameInput=document.querySelector('#character-name');
const panel=document.querySelector('#menu-panel');

let coins=Number(localStorage.getItem('arenaCoins')||0);
coinCount.textContent=coins.toLocaleString('tr-TR');
nameInput.value=localStorage.getItem('arenaCharacterName')||'İsimsiz Karakter';
nameInput.addEventListener('input',()=>localStorage.setItem('arenaCharacterName',nameInput.value.trim()||'İsimsiz Karakter'));

const skinBundles=[
  {type:'SKİN KASASI',name:'UCUZ SKİN KASASI',price:1000,desc:'Karakter kozmetiği'},
  {type:'SKİN KASASI',name:'ORTA SKİN KASASI',price:20000,desc:'Karakter kozmetiği'},
  {type:'SKİN KASASI',name:'PAHALI SKİN KASASI',price:30000,desc:'Karakter kozmetiği'}
];
const eliminationBundles=[
  {type:'ELEME EFEKTİ KASASI',name:'UCUZ ELEME EFEKTİ KASASI',price:1000,desc:'Eleme effekti kozmetiği'},
  {type:'ELEME EFEKTİ KASASI',name:'ORTA ELEME EFEKTİ KASASI',price:20000,desc:'Eleme effekti kozmetiği'},
  {type:'ELEME EFEKTİ KASASI',name:'PAHALI ELEME EFEKTİ KASASI',price:30000,desc:'Eleme effekti kozmetiği'}
];

function market(){
  title.textContent='MARKET';
  content.innerHTML=`
    <div class="market-section"><div class="section-title">SKİN KASALARI</div><div class="market-row">${skinBundles.map(card).join('')}</div></div>
    <div class="market-section"><div class="section-title">ELEME EFEKTLERİ KASALARI</div><div class="market-row">${eliminationBundles.map(card).join('')}</div></div>
    <p class="market-note">Kasa sistemi şimdilik sabit kozmetik paketler olarak hazır. İçerik ve efektleri sen daha sonra ekleyebilirsin.</p>`;
  content.querySelectorAll('.buy-card').forEach(btn=>btn.addEventListener('click',()=>{
    const price=Number(btn.dataset.price);
    if(coins<price){btn.classList.add('shake');setTimeout(()=>btn.classList.remove('shake'),300);return;}
    coins-=price; localStorage.setItem('arenaCoins',coins); coinCount.textContent=coins.toLocaleString('tr-TR');
    btn.querySelector('.buy-text').textContent='ALINDI';
  }));
}
function card(x){return `<button class="buy-card" data-price="${x.price}"><span class="crate-icon"></span><strong>${x.name}</strong><small>${x.desc}</small><span class="price"><span class="coin"></span>${x.price.toLocaleString('tr-TR')}</span><span class="buy-text">SATIN AL</span></button>`}
function simple(section){
  title.textContent=labels[section];
  if(section==='inventory') content.innerHTML='<p>Karakterlerin, skinlerin ve eleme efektlerin burada görünecek.</p>';
  else if(section==='ranking') content.innerHTML='<p>Sıralama sistemi daha sonra eklenecek.</p>';
  else content.innerHTML='<p>Ayarlar burada olacak.</p>';
}

function closePanel(){
  panel.style.display='none';
  document.querySelectorAll('.menu-tabs button').forEach(b=>b.classList.remove('active'));
}

function openPanel(section,button){
  document.querySelectorAll('.menu-tabs button').forEach(b=>b.classList.remove('active'));
  button.classList.add('active');
  panel.style.display='block';
  section==='market'?market():simple(section);
}

document.querySelectorAll('.menu-tabs button').forEach(button=>{
  button.addEventListener('click',()=>{
    if(panel.style.display==='block' && button.classList.contains('active')){
      closePanel();
      return;
    }
    openPanel(button.dataset.section,button);
  });
});

// Ana menü ilk açıldığında hiçbir panel görünmez.
closePanel();
