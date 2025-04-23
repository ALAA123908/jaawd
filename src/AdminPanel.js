import React, { useState } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';

export default function AdminPanel({ products }) {
  // إدارة الأقسام
  const [categories, setCategories] = React.useState([]);
  const [newCategory, setNewCategory] = React.useState('');
  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addDoc(collection(db, 'categories'), { name: newCategory });
    setNewCategory('');
  };
  const handleDeleteCategory = async (id) => {
    await deleteDoc(doc(db, 'categories', id));
  };
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'products', id));
  };
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');
  const [available, setAvailable] = useState(true);
  const [category, setCategory] = useState('');

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
      available,
      category
    });
    setName('');
    setPrice('');
    setImage(null);
    setAvailable(true);
    setCategory('');
    setMsg('تمت إضافة المنتج بنجاح!');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <div>
      <h2>لوحة التحكم - إضافة منتج</h2>
      {/* إدارة الأقسام */}
      <div style={{marginBottom:'26px',background:'#f9fafb',padding:'14px',borderRadius:'12px',boxShadow:'0 1px 4px #eee'}}>
        <h3 style={{margin:'0 0 8px 0'}}>إدارة الأقسام</h3>
        <form style={{display:'flex',gap:'8px',marginBottom:'10px'}} onSubmit={handleAddCategory}>
          <input type="text" placeholder="اسم القسم الجديد" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
          <button type="submit">إضافة قسم</button>
        </form>
        <ul style={{listStyle:'none',padding:'0',margin:'0',display:'flex',gap:'10px',flexWrap:'wrap'}}>
          {categories.map(cat => (
            <li key={cat.id} style={{background:'#fff',padding:'6px 12px',borderRadius:'8px',boxShadow:'0 1px 3px #eee',display:'flex',alignItems:'center',gap:'4px'}}>
              <span>{cat.name}</span>
              <button type="button" style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'5px',padding:'2px 7px',marginRight:'4px',cursor:'pointer'}} onClick={() => handleDeleteCategory(cat.id)}>حذف</button>
            </li>
          ))}
        </ul>
      </div>

      <form className="admin-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="اسم المنتج"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)} required style={{margin:'8px 0',padding:'8px',borderRadius:'6px'}}>
          <option value="">اختر القسم</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
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
            reader.onload = (ev) => {
              // ضغط وتصغير الصورة
              const img = new window.Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width = Math.round(width * (MAX_HEIGHT / height));
                    height = MAX_HEIGHT;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // جودة 0.7
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setImage(dataUrl);
              };
              img.src = ev.target.result;
            };
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
                    reader.onload = (ev) => {
                      // ضغط وتصغير الصورة عند التعديل
                      const img = new window.Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 300;
                        const MAX_HEIGHT = 300;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                          if (width > MAX_WIDTH) {
                            height = Math.round(height * (MAX_WIDTH / width));
                            width = MAX_WIDTH;
                          }
                        } else {
                          if (height > MAX_HEIGHT) {
                            width = Math.round(width * (MAX_HEIGHT / height));
                            height = MAX_HEIGHT;
                          }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        // جودة 0.7
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        setEditImage(dataUrl);
                      };
                      img.src = ev.target.result;
                    };
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
