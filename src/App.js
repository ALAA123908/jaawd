import React, { useState, useEffect } from 'react';
import './App.css';
import AdminPanel from './AdminPanel';
import { db } from './firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, doc, setDoc
} from 'firebase/firestore';

const initialProducts = [
  { id: 1, name: 'تفاح', price: 3 },
  { id: 2, name: 'موز', price: 2 },
  { id: 3, name: 'حليب', price: 5 },
  { id: 4, name: 'خبز', price: 1.5 },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  // المنتجات
  const [products, setProducts] = useState([]);
  // الطلبات
  const [orders, setOrders] = useState([]);
  const [adminSection, setAdminSection] = useState('products'); // 'products' or 'orders'

  // جلب المنتجات من Firestore بشكل لحظي (الكود المقترح)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    });
    return () => unsubscribe();
  }, []);

  // جلب الطلبات من Firestore بشكل لحظي
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(orderList);
    });
    return () => unsubscribe();
  }, []);

  // إدارة الردود على الطلبات
  const [replyInputs, setReplyInputs] = useState({});
  const handleOrderReply = async (e, orderId) => {
    e.preventDefault();
    if (!replyInputs[orderId] || !replyInputs[orderId].trim()) return;
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { reply: replyInputs[orderId] });
    setReplyInputs(inputs => ({ ...inputs, [orderId]: '' }));
  };

  // حذف الطلب
  const handleDeleteOrder = async (orderId) => {
    await deleteDoc(doc(db, 'orders', orderId));
  };


  // حالة إظهار نموذج الطلب
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderName, setOrderName] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderMsg, setOrderMsg] = useState('');

  const addToCart = (product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = async (id) => {
    await setDoc(doc(db, 'cart', id), {}, { merge: false }); // حذف الوثيقة
    // لا حاجة لتحديث الحالة، onSnapshot سيقوم بذلك
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="app-container">
      <header className="header">
        <h1>مرحبًا بك في jawad shop</h1>
        <div className="header-nav">
          <button
            className={"cart-btn" + (!showCart && !showAdmin ? " active" : "")}
            onClick={() => { setShowCart(false); setShowAdmin(false); }}
          >
            🏠 المنتجات
          </button>
          <button
            className={"cart-btn" + (showCart ? " active" : "")}
            onClick={() => { setShowCart(true); setShowAdmin(false); }}
          >
            🛒 السلة ({cart.length})
          </button>
          <button
            className={"cart-btn" + (showAdmin ? " active" : "")}
            onClick={() => { setShowAdmin(true); setShowCart(false); }}
          >
            ⚙️ لوحة التحكم
          </button>
        </div>
      </header>
      {showAdmin ? (
        <main>
          <div style={{marginBottom:'18px', display:'flex', gap:'10px'}}>
            <button className={"cart-btn" + (adminSection==='products' ? ' active' : '')} onClick={()=>setAdminSection('products')}>المنتجات</button>
            <button className={"cart-btn" + (adminSection==='orders' ? ' active' : '')} onClick={()=>setAdminSection('orders')}>الطلبات</button>
          </div>
          {adminSection === 'products' ? (
            <AdminPanel products={products} setProducts={setProducts} />
          ) : (
            <div className="orders-panel">
              <h2>الطلبات</h2>
              {orders.length === 0 ? (
                <p>لا توجد طلبات بعد.</p>
              ) : (
                <ul className="orders-list">
                  {orders.map(order => (
                    <li key={order.id} className="order-card">
                      <div><b>الاسم:</b> {order.name}</div>
                      <div><b>العنوان:</b> {order.address}</div>
                      <div><b>الجوال:</b> {order.phone}</div>
                      <div><b>التاريخ:</b> {order.date}</div>
                      <div><b>المنتجات:</b>
                        <ul>
                          {order.items.map((item,i) => (
                            <li key={i} style={{display:'flex',alignItems:'center',gap:'7px'}}>
                              {item.image && <img src={item.image} alt={item.name} style={{width:'24px',height:'24px',borderRadius:'6px',objectFit:'cover',border:'1px solid #eee'}} />}
                              {item.name} × {item.qty} ({item.price} ريال)
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div><b>الإجمالي:</b> {order.total} ريال</div>
                      <div className="order-reply-section">
                        {order.reply ? (
                          <div className="order-reply"><b>رد الإدارة:</b> {order.reply}</div>
                        ) : (
                          <form onSubmit={e => handleOrderReply(e, order.id)} style={{display:'flex',gap:'7px',marginTop:'6px'}}>
                            <input type="text" value={replyInputs[order.id]||''} onChange={e => setReplyInputs(inputs => ({...inputs, [order.id]: e.target.value}))} placeholder="اكتب الرد هنا..." style={{flex:1,padding:'5px 8px',borderRadius:'6px',border:'1.2px solid #bbb'}} />
                            <button type="submit" style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer'}}>إرسال</button>
                          </form>
                        )}
                      </div>
                      <button onClick={() => handleDeleteOrder(order.id)} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'6px',padding:'5px 14px',marginTop:'7px',cursor:'pointer'}}>حذف الطلب</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      ) : !showCart ? (
        <main>
          <h2>منتجاتنا</h2>
          <div className="products-list">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-img"
                  />
                )}
                <h3>{product.name}</h3>
                <p>السعر: {product.price} ريال</p>
                <button onClick={() => addToCart(product)}>أضف إلى السلة</button>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main>
          <h2>سلة التسوق</h2>
          {cart.length === 0 ? (
            <p>السلة فارغة.</p>
          ) : (
            <>
              <div className="cart-cards">
                {cart.map((item) => (
                  <div className="cart-card" key={item.id}>
                    <div className="cart-thumb">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="cart-img" />
                      ) : (
                        <span role="img" aria-label="product">🛍️</span>
                      )}
                    </div>
                    <div className="cart-details">
                      <div className="cart-title">{item.name}</div>
                      <div className="cart-price">{item.price} ريال / للواحدة</div>
                      <div className="cart-qty-controls">
                        <button onClick={() => decreaseQty(item.id)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => addToCart(item)}>+</button>
                      </div>
                      <div className="cart-subtotal">المجموع: {item.price * item.qty} ريال</div>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>حذف</button>
                  </div>
                ))}
              </div>
              <div className="total">الإجمالي: {total} ريال</div>
              <button className="cart-clear-btn" onClick={clearCart}>إفراغ السلة</button>
              <button className="order-btn" onClick={() => setShowOrderForm(true)}>إتمام الطلب</button>
            </>
          )}

          {showOrderForm && (
            <div className="order-form-modal">
              <form className="order-form" onSubmit={async (e) => {
                e.preventDefault();
                setOrderMsg('تم استلام طلبك بنجاح! سيتم التواصل معك قريبًا.');
                await addDoc(collection(db, 'orders'), {
                  name: orderName,
                  address: orderAddress,
                  phone: orderPhone,
                  items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price, image: item.image })),
                  total,
                  date: new Date().toLocaleString(),
                  reply: ''
                });
                setShowOrderForm(false);
                setOrderName('');
                setOrderAddress('');
                setOrderPhone('');
                setCart([]);
                setTimeout(() => setOrderMsg(''), 3000);
              }}>
                <h3>إتمام الطلب</h3>
                <input type="text" placeholder="الاسم الكامل" value={orderName} onChange={e => setOrderName(e.target.value)} required />
                <input type="text" placeholder="العنوان بالتفصيل" value={orderAddress} onChange={e => setOrderAddress(e.target.value)} required />
                <input type="tel" placeholder="رقم الجوال" value={orderPhone} onChange={e => setOrderPhone(e.target.value)} pattern="[0-9]{8,}" required />
                <div className="order-form-actions">
                  <button type="submit">تأكيد الطلب</button>
                  <button type="button" className="order-cancel-btn" onClick={() => setShowOrderForm(false)}>إلغاء</button>
                </div>
              </form>
            </div>
          )}
          {orderMsg && <div className="order-msg">{orderMsg}</div>}

          <button className="back-btn" onClick={() => setShowCart(false)}>
            ← العودة للمنتجات
          </button>
        </main>
      )}
      <footer className="footer">جميع الحقوق محفوظة © jawad shop 2025</footer>
    </div>
  );
}
