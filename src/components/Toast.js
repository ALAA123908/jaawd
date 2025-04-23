import React from 'react';

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      position:'fixed',
      top:24,
      right:24,
      zIndex:9999,
      background:type==='success'?'#16a34a':'#ef4444',
      color:'#fff',
      padding:'14px 28px',
      borderRadius:'10px',
      boxShadow:'0 2px 12px #0001',
      fontWeight:'bold',
      fontSize:'1.05em',
      display:'flex',
      alignItems:'center',
      gap:'10px',
      minWidth:200
    }}>
      <span>{type==='success'?'✔️':'❌'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontWeight:'bold',fontSize:'1.2em',marginLeft:'10px',cursor:'pointer'}}>×</button>
    </div>
  );
}
