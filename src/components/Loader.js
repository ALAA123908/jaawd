import React from 'react';

export default function Loader({ text = 'جاري التحميل...' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 0'}}>
      <div className="loader-spinner" style={{width:38,height:38,border:'5px solid #eee',borderTop:'5px solid #0ea5e9',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div>
      <div style={{marginTop:12,fontWeight:'bold',color:'#0ea5e9',fontSize:'1.1em'}}>{text}</div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
