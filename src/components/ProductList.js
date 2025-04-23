import React from 'react';

export default function ProductList({ products, addToCart }) {
  if (products.length === 0) {
    return (
      <div style={{textAlign:'center',margin:'30px 0',color:'#888',fontSize:'1.2em',background:'#fff',padding:'18px',borderRadius:'12px',boxShadow:'0 1px 4px #eee'}}>
        لم يتم العثور على منتجات مطابقة لبحثك.
      </div>
    );
  }
  return (
    <div className="products-list">
      {products.map(product => (
        <div className="product-card" key={product.id}>
          <div className="product-thumb">
            {product.image ? (
              <img src={product.image} alt={product.name} className="product-img" />
            ) : (
              <span role="img" aria-label="product">🛍️</span>
            )}
          </div>
          <div className="product-title">{product.name}</div>
          <div className="product-price">{product.price} $</div>
          {product.available !== false ? (
            <button className="add-btn" onClick={() => addToCart(product)}>
              إضافة للسلة
            </button>
          ) : (
            <button className="add-btn" disabled style={{background:'#aaa',cursor:'not-allowed'}}>
              غير متوفر
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
