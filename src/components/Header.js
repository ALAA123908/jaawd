import React from 'react';

export default function Header({ cartCount, onCartClick, onAdminClick }) {
  return (
    <header style={{
      background:'#fff',
      boxShadow:'0 2px 12px #0001',
      padding:'0 0',
      position:'sticky',
      top:0,
      zIndex:100,
      marginBottom:'20px'
    }}>
      <div style={{
        maxWidth:900,
        margin:'0 auto',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        height:62,
        padding:'0 18px'
      }}>
        <div style={{fontWeight:'bold',fontSize:'1.5em',color:'#0ea5e9',letterSpacing:'1px'}}>متجر أنقاد</div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button onClick={onCartClick} style={{position:'relative',background:'none',border:'none',cursor:'pointer'}}>
            <span style={{fontSize:'1.6em'}}>🛒</span>
            {cartCount > 0 && (
              <span style={{position:'absolute',top:-6,right:-8,background:'#ef4444',color:'#fff',borderRadius:'50%',padding:'3px 8px',fontSize:'0.9em',fontWeight:'bold'}}>{cartCount}</span>
            )}
          </button>
          <button onClick={onAdminClick} style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'7px',padding:'7px 18px',fontWeight:'bold',fontSize:'1em',cursor:'pointer'}}>لوحة التحكم</button>
        </div>
      </div>
    </header>
  );
}
