import React from 'react';

export default function CategoryFilter({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div style={{display:'flex',gap:'12px',marginBottom:'18px',flexWrap:'wrap'}}>
      <button
        onClick={() => setSelectedCategory('')}
        style={{
          padding:'8px 16px',
          borderRadius:'8px',
          border:'none',
          background:!selectedCategory?'#0ea5e9':'#e0e7ef',
          color:!selectedCategory?'#fff':'#0ea5e9',
          fontWeight:'bold',
          cursor:'pointer'
        }}
      >كل الأقسام</button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.name)}
          style={{
            padding:'8px 16px',
            borderRadius:'8px',
            border:'none',
            background:selectedCategory===cat.name?'#0ea5e9':'#e0e7ef',
            color:selectedCategory===cat.name?'#fff':'#0ea5e9',
            fontWeight:'bold',
            cursor:'pointer'
          }}
        >{cat.name}</button>
      ))}
    </div>
  );
}
