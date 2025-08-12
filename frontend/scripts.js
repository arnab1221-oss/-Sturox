// Frontend script - interacts with backend endpoints /upload and /submit-order
const OWNER_EMAIL = 'sturox528@gmail.com';
const WHATSAPP_NUMBERS = ['8972548589','6289278035','7044111285'];

document.addEventListener('DOMContentLoaded', ()=>{
  // Upload form
  const uploadForm = document.getElementById('upload-form');
  if(uploadForm){
    uploadForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const files = document.getElementById('file-input').files;
      const name = document.getElementById('student-name').value || '';
      const roll = document.getElementById('student-roll').value || '';
      const res = document.getElementById('upload-result');
      if(!files || files.length===0){ res.textContent='Please choose at least one file.'; return; }
      res.textContent = 'Uploading...';

      const fd = new FormData();
      fd.append('name', name);
      fd.append('roll', roll);
      for(let i=0;i<files.length;i++) fd.append('files', files[i]);

      try{
        const resp = await fetch('/upload', {method:'POST', body:fd});
        const json = await resp.json();
        if(resp.ok){
          res.textContent = 'Upload successful. We have emailed and notified the owner.';
          // Save uploaded file names locally for order page
          localStorage.setItem('campusprint_uploaded', JSON.stringify({name,roll,files:Array.from(files).map(f=>f.name)}));
          setTimeout(()=> location.href='print.html', 1200);
        } else {
          res.textContent = 'Upload failed: ' + (json.error || JSON.stringify(json));
        }
      }catch(err){
        console.error(err);
        res.textContent = 'Upload error: ' + err.message;
      }
    });
  }

  // Order form
  const orderForm = document.getElementById('order-form');
  if(orderForm){
    const bwInput = document.getElementById('bw-pages');
    const colorInput = document.getElementById('color-pages');
    const totalSpan = document.getElementById('total-amount');
    function updateTotal(){
      const bw = Number(bwInput.value||0);
      const col = Number(colorInput.value||0);
      totalSpan.textContent = bw*1 + col*3; // prices: 1 and 3
    }
    bwInput.addEventListener('input', updateTotal);
    colorInput.addEventListener('input', updateTotal);
    updateTotal();

    orderForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('order-name').value || '';
      const roll = document.getElementById('order-roll').value || '';
      const bw = Number(document.getElementById('bw-pages').value||0);
      const col = Number(document.getElementById('color-pages').value||0);
      const total = bw*1 + col*3;
      const addr = JSON.parse(localStorage.getItem('campusprint_address')||'null') || {};
      const uploaded = JSON.parse(localStorage.getItem('campusprint_uploaded')||'null')?.files || [];
      const payload = {name, roll, bw, col, total, address: addr, files: uploaded};

      const resEl = document.getElementById('order-result');
      resEl.textContent = 'Submitting order...';
      try{
        const resp = await fetch('/submit-order', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        const json = await resp.json();
        if(resp.ok){
          resEl.textContent = 'Order submitted: ' + json.orderId;
          localStorage.setItem('campusprint_lastorder', JSON.stringify({order:json.order, status:'ordered'}));
          document.getElementById('order-status').textContent = json.orderId + ' — ordered';
        } else {
          resEl.textContent = 'Order failed: ' + (json.error || JSON.stringify(json));
        }
      }catch(err){
        console.error(err);
        resEl.textContent = 'Order error: ' + err.message;
      }
    });
  }

  // Delivery address form
  const addrForm = document.getElementById('addressForm');
  if(addrForm){
    addrForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('addr-name').value;
      const phone = document.getElementById('addr-phone').value;
      const address = document.getElementById('addr-address').value;
      const pincode = document.getElementById('addr-pincode').value;
      localStorage.setItem('campusprint_address', JSON.stringify({name,phone,address,pincode}));
      alert('Delivery address saved locally (demo).');
    });
    const saved = JSON.parse(localStorage.getItem('campusprint_address')||'null');
    if(saved){
      document.getElementById('addr-name').value = saved.name||'';
      document.getElementById('addr-phone').value = saved.phone||'';
      document.getElementById('addr-address').value = saved.address||'';
      document.getElementById('addr-pincode').value = saved.pincode||'';
    }
  }

  // Payment page copy UPI and notify
  const copyBtn = document.getElementById('copy-upi');
  if(copyBtn){
    copyBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const upi = document.getElementById('upi-id').textContent.trim();
      navigator.clipboard.writeText(upi).then(()=> alert('UPI copied: ' + upi)).catch(()=> prompt('Copy UPI', upi));
    });
  }
});
