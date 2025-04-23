import React, { useState } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function AdminPanel({ products }) {
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'products', id));
  };
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');
  const [available, setAvailable] = useState(true);

  // States for editing
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editAvailable, setEditAvailable] = useState(true);

  const startEdit = (product) => {
    setEditId(product.id);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditImage(product.image || null);
    setEditAvailable(product.available !== false);
  };

  const handleEditSave = async (e, id) => {
    e.preventDefault();
    const prodRef = doc(db, 'products', id);
    await updateDoc(prodRef, {
      name: editName,
      price: parseFloat(editPrice),
      image: editImage || '',
      available: editAvailable
    });
    setEditId(null);
    setEditName('');
    setEditPrice('');
    setEditImage(null);
    setEditAvailable(true);
    setMsg('تم تعديل المنتج بنجاح!');
    setTimeout(() => setMsg(''), 1500);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditPrice('');
    setEditImage(null);
    setEditAvailable(true);
  };


  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setMsg('يرجى إدخال اسم وسعر المنتج');
      return;
    }
    await addDoc(collection(db, 'products'), {
      name,
      price: parseFloat(price),
      image: image || '',
      available
    });
    setName('');
    setPrice('');
    setImage(null);
    setAvailable(true);
    setMsg('تمت إضافة المنتج بنجاح!');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <div>
      <h2>لوحة التحكم - إضافة منتج</h2>
      <form className="admin-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="اسم المنتج"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label style={{display:'flex',alignItems:'center',gap:'6px',margin:'8px 0'}}>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          متوفر
        </label>
        <input
          type="number"
          placeholder="السعر"
          value={price}
          min="0"
          step="0.01"
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files[0];
            if (!file) return setImage(null);
            const reader = new FileReader();
            reader.onload = (ev) => setImage(ev.target.result);
            reader.readAsDataURL(file);
          }}
        />
        <button type="submit">إضافة</button>
      </form>
      {msg && <div className="admin-msg">{msg}</div>}
      <h3>جميع المنتجات</h3>
      <ul className="admin-products-list">
        {products.map((p) => (
          <li key={p.id} style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {p.image && <img src={p.image} alt={p.name} style={{width:'38px',height:'38px',objectFit:'cover',borderRadius:'8px',border:'1px solid #ddd'}} />}
            {editId === p.id ? (
              <form className="admin-form" onSubmit={(e) => handleEditSave(e, p.id)} style={{marginBottom:'0'}}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
                <label style={{display:'flex',alignItems:'center',gap:'6px',margin:'8px 0'}}>
                  <input
                    type="checkbox"
                    checked={editAvailable}
                    onChange={(e) => setEditAvailable(e.target.checked)}
                  />
                  متوفر
                </label>
                <input
                  type="number"
                  value={editPrice}
                  min="0"
                  step="0.01"
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setEditImage(ev.target.result);
                    reader.readAsDataURL(file);
                  }}
                />
                <button type="submit">حفظ</button>
                <button type="button" onClick={cancelEdit}>إلغاء</button>
              </form>
            ) : (
              <>
                {p.name} - {p.price} ريال
                <button style={{marginRight:'10px'}} onClick={() => startEdit(p)}>تعديل</button>
                <button style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'6px',padding:'6px 12px',marginRight:'6px',cursor:'pointer'}} onClick={() => handleDelete(p.id)}>حذف</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
