import React, { useState, useEffect } from 'react';
import './App.css';
import AdminPanel from './AdminPanel';
import ErrorBoundary from './ErrorBoundary';
import Toast from './components/Toast';
import { db } from './firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, doc, setDoc, deleteDoc
} from 'firebase/firestore';

const initialProducts = [
  { id: 1, name: 'تفاح', price: 3 },
  { id: 2, name: 'موز', price: 2 },
  { id: 3, name: 'حليب', price: 5 },
  { id: 4, name: 'خبز', price: 1.5 },
];

export default function App() {
  // إشعار عائم للردود
  const [toastMsg, setToastMsg] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [products, setProducts] = useState([]); // تعريف المنتجات أولاً
  const [orders, setOrders] = useState([]);
  const [adminSection, setAdminSection] = useState('products');
  // كلمات السر للأقسام
  const [sectionPasswords, setSectionPasswords] = useState({});
  const [passwordInputs, setPasswordInputs] = useState({});
  const [passwordEdit, setPasswordEdit] = useState({});
  const [passwordMsg, setPasswordMsg] = useState('');
  // حماية الأقسام بكلمة سر
  const [sectionAuth, setSectionAuth] = useState({});
  const [showPwdModal, setShowPwdModal] = useState(null); // اسم القسم المطلوب كلمة سره
  const [pwdModalInput, setPwdModalInput] = useState('');
  const [pwdModalError, setPwdModalError] = useState('');
  // حماية لوحة التحكم بالكامل
  const [panelPassword, setPanelPassword] = useState('');
  const [panelPasswordInput, setPanelPasswordInput] = useState('');
  const [panelAuth, setPanelAuth] = useState(false);
  const [showPanelPwdModal, setShowPanelPwdModal] = useState(false);
  const [panelPwdError, setPanelPwdError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // الآن يمكن تصفية المنتجات بأمان
  const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState('');
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
    setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  return () => unsubscribe();
}, []);
let filteredProducts = [];
try {
  filteredProducts = products.filter(p => {
    // تجاهل المنتج إذا لم يكن له اسم نصي
    if (!p.name || typeof p.name !== 'string') return false;
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      p.name.toLowerCase().includes(search) ||
      (typeof p.price !== 'undefined' && p.price !== null && p.price.toString().includes(search)) ||
      (p.description && typeof p.description === 'string' && p.description.toLowerCase().includes(search))
    );
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
} catch (e) {
  console.error('خطأ أثناء تصفية المنتجات! تحقق من الحقول الناقصة أو القيم غير المتوقعة:', e, products);
  filteredProducts = [];
}

  // جلب المنتجات من Firestore بشكل لحظي (الكود المقترح)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Firestore products:', productList);
      setProducts(productList);
    });
    return () => unsubscribe();
  }, []);

  // جلب كلمات سر الأقسام من Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sectionPasswords"), (snapshot) => {
      const pwds = {};
      snapshot.forEach(doc => {
        pwds[doc.id] = doc.data().password;
      });
      setSectionPasswords(pwds);
      setPanelPassword(pwds['panel'] || '');
    });
    return () => unsubscribe();
  }, []);

  // جلب الطلبات من Firestore بشكل لحظي
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersArr);
      // تحقق إذا هناك رد جديد للأدمن على أي طلب
      const repliedOrder = ordersArr.find(order => order.adminReply && !order.replySeen);
      if (repliedOrder) {
        setToastMsg(repliedOrder.adminReply);
        setToastVisible(true);
        // ضع علامة أن الرسالة شوهدت (اختياري)
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'orders', repliedOrder.id), { replySeen: true });
          } catch {}
        }, 500);
      }
    });
    return () => unsub();
  }, []);

  // إدارة الردود على الطلبات
  const [replyInputs, setReplyInputs] = useState({});
  const handleOrderReply = async (e, orderId) => {
    e.preventDefault();
    if (!replyInputs[orderId] || !replyInputs[orderId].trim()) return;
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { adminReply: replyInputs[orderId] });
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
      // تأكد أن خاصية image موجودة
      return [...prev, { ...product, qty: 1, image: product.image || '' }];
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
    <>
      <Toast message={typeof toastMsg === 'string' ? toastMsg : (toastMsg ? JSON.stringify(toastMsg) : '')} visible={toastVisible} onClose={() => setToastVisible(false)} duration={3500} />
      <div className="app-container">
        {/* إشعار عائم أعلى الصفحة */}
      {toastVisible && toastMsg && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0ea5eedd',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: '14px',
          fontSize: '1.18em',
          fontWeight: 600,
          boxShadow: '0 6px 24px #0003',
          zIndex: 9999,
          transition: 'opacity 0.4s',
          opacity: toastVisible ? 1 : 0
        }}>
          {typeof toastMsg === 'string' ? toastMsg : (toastMsg ? JSON.stringify(toastMsg) : '')}
        </div>
      )}
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
      {showAdmin && panelPassword && !panelAuth ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'70vh'}}>
          <form onSubmit={e => {
            e.preventDefault();
            if (panelPasswordInput === panelPassword) {
              setPanelAuth(true);
              setPanelPwdError('');
            } else {
              setPanelPwdError('كلمة السر غير صحيحة!');
            }
          }} style={{background:'#fff',padding:'36px 30px',borderRadius:'16px',minWidth:'320px',boxShadow:'0 8px 32px #0002',display:'flex',flexDirection:'column',gap:'18px',alignItems:'center'}}>
            <h3 style={{margin:0}}>أدخل كلمة سر لوحة التحكم</h3>
            <input type="password" autoFocus value={panelPasswordInput} onChange={e=>setPanelPasswordInput(e.target.value)} style={{padding:'9px',borderRadius:'8px',border:'1.5px solid #bbb',width:'100%'}} />
            {panelPwdError && <div style={{color:'#ef4444',fontWeight:'bold'}}>{panelPwdError}</div>}
            <button type="submit" style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 24px',fontWeight:'bold',cursor:'pointer'}}>دخول</button>
          </form>
        </div>
      ) : showAdmin ? (
         <main>
          <div style={{marginBottom:'18px', display:'flex', gap:'10px'}}>
            <button className={"cart-btn" + (adminSection==='products' ? ' active' : '')} onClick={() => {
              if (sectionPasswords['products'] && !sectionAuth['products']) {
                setShowPwdModal('products');
              } else {
                setAdminSection('products');
              }
            }}>المنتجات</button>
            <button className={"cart-btn" + (adminSection==='orders' ? ' active' : '')} onClick={() => {
              if (sectionPasswords['orders'] && !sectionAuth['orders']) {
                setShowPwdModal('orders');
              } else {
                setAdminSection('orders');
              }
            }}>الطلبات</button>
            <button className={"cart-btn" + (adminSection==='security' ? ' active' : '')} onClick={() => {
              if (sectionPasswords['security'] && !sectionAuth['security']) {
                setShowPwdModal('security');
              } else {
                setAdminSection('security');
              }
            }}>الأمان</button>
          </div>

          {/* نافذة تحقق كلمة السر */}
          {showPwdModal && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#0007',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <form onSubmit={e => {
                e.preventDefault();
                if (pwdModalInput === sectionPasswords[showPwdModal]) {
                  setSectionAuth(auth => ({...auth, [showPwdModal]: true}));
                  setShowPwdModal(null);
                  setPwdModalInput('');
                  setPwdModalError('');
                  setAdminSection(showPwdModal);
                } else {
                  setPwdModalError('كلمة السر غير صحيحة!');
                }
              }} style={{background:'#fff',padding:'36px 30px',borderRadius:'16px',minWidth:'320px',boxShadow:'0 8px 32px #0002',display:'flex',flexDirection:'column',gap:'18px',alignItems:'center'}}>
                <h3 style={{margin:0}}>أدخل كلمة سر قسم {showPwdModal==='products'?'المنتجات':showPwdModal==='orders'?'الطلبات':'الأمان'}</h3>
                <input type="password" autoFocus value={pwdModalInput} onChange={e=>setPwdModalInput(e.target.value)} style={{padding:'9px',borderRadius:'8px',border:'1.5px solid #bbb',width:'100%'}} />
                {pwdModalError && <div style={{color:'#ef4444',fontWeight:'bold'}}>{pwdModalError}</div>}
                <div style={{display:'flex',gap:'10px',width:'100%',justifyContent:'center'}}>
                  <button type="submit" style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 24px',fontWeight:'bold',cursor:'pointer'}}>دخول</button>
                  <button type="button" style={{background:'#64748b',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 18px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>{setShowPwdModal(null);setPwdModalInput('');setPwdModalError('');}}>إلغاء</button>
                </div>
              </form>
            </div>
          )}

          {adminSection === 'security' ? (
            <div className="orders-panel" style={{maxWidth:'420px',margin:'0 auto'}}>
              <h2>إعدادات الأمان</h2>
              <div style={{marginBottom:'18px',color:'#64748b'}}>يمكنك تعيين أو تغيير كلمة سر لكل قسم أو لوحة التحكم بالكامل. يمكنك أيضًا إزالة كلمة السر لأي قسم أو لوحة التحكم من هنا.</div>
              {/* كلمة سر لوحة التحكم */}
              <form style={{marginBottom:'22px',display:'flex',gap:'8px',alignItems:'center'}} onSubmit={async e => {
                e.preventDefault();
                if (!passwordInputs['panel'] || passwordInputs['panel'].length < 3) {
                  setPasswordMsg('كلمة السر يجب أن تكون 3 أحرف أو أكثر');
                  return;
                }
                await setDoc(doc(db, 'sectionPasswords', 'panel'), { password: passwordInputs['panel'] });
                setPasswordMsg('تم حفظ كلمة سر لوحة التحكم بنجاح!');
                setTimeout(()=>setPasswordMsg(''), 1500);
                setPasswordInputs(inputs => ({...inputs, panel: ''}));
              }}>
                <label style={{minWidth:'80px',fontWeight:'bold'}}>لوحة التحكم:</label>
                <input
                  type={passwordEdit['panel'] ? 'text':'password'}
                  placeholder={panelPassword ? '••••••' : 'أدخل كلمة سر جديدة'}
                  value={passwordInputs['panel'] || ''}
                  onChange={e => setPasswordInputs(inputs => ({...inputs, panel: e.target.value}))}
                  style={{flex:1,padding:'7px',borderRadius:'6px',border:'1px solid #ddd'}}
                />
                <button type="button" style={{background:'#fbbf24',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>setPasswordEdit(edit => ({...edit, panel: !edit['panel']}))}>{passwordEdit['panel']?'إخفاء':'إظهار'}</button>
                <button type="submit" style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 16px',fontWeight:'bold',cursor:'pointer'}}>حفظ</button>
                {panelPassword && <button type="button" style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 14px',fontWeight:'bold',cursor:'pointer'}} onClick={async()=>{
                  await deleteDoc(doc(db, 'sectionPasswords', 'panel'));
                  setPanelPassword('');
                  setPanelAuth(false);
                  setPasswordMsg('تمت إزالة كلمة سر لوحة التحكم!');
                  setTimeout(()=>setPasswordMsg(''), 1500);
                }}>إزالة</button>}
              </form>
              {/* كلمات سر الأقسام */}
              {['products','orders','security'].map(sec => (
                <form key={sec} style={{marginBottom:'18px',display:'flex',gap:'8px',alignItems:'center'}} onSubmit={async e => {
                  e.preventDefault();
                  if (!passwordInputs[sec] || passwordInputs[sec].length < 3) {
                    setPasswordMsg('كلمة السر يجب أن تكون 3 أحرف أو أكثر');
                    return;
                  }
                  await setDoc(doc(db, 'sectionPasswords', sec), { password: passwordInputs[sec] });
                  setPasswordMsg('تم حفظ كلمة السر للقسم بنجاح!');
                  setTimeout(()=>setPasswordMsg(''), 1500);
                  setPasswordInputs(inputs => ({...inputs, [sec]: ''}));
                }}>
                  <label style={{minWidth:'80px',fontWeight:'bold'}}>{sec==='products'?'المنتجات':sec==='orders'?'الطلبات':'الأمان'}:</label>
                  <input
                    type={passwordEdit[sec] ? 'text':'password'}
                    placeholder={sectionPasswords[sec] ? '••••••' : 'أدخل كلمة سر جديدة'}
                    value={passwordInputs[sec] || ''}
                    onChange={e => setPasswordInputs(inputs => ({...inputs, [sec]: e.target.value}))}
                    style={{flex:1,padding:'7px',borderRadius:'6px',border:'1px solid #ddd'}}
                  />
                  <button type="button" style={{background:'#fbbf24',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>setPasswordEdit(edit => ({...edit, [sec]: !edit[sec]}))}>{passwordEdit[sec]?'إخفاء':'إظهار'}</button>
                  <button type="submit" style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 16px',fontWeight:'bold',cursor:'pointer'}}>حفظ</button>
                  {sectionPasswords[sec] && <button type="button" style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 14px',fontWeight:'bold',cursor:'pointer'}} onClick={async()=>{
                    await deleteDoc(doc(db, 'sectionPasswords', sec));
                    setPasswordMsg('تمت إزالة كلمة سر القسم!');
                    setTimeout(()=>setPasswordMsg(''), 1500);
                    setSectionAuth(auth => ({...auth, [sec]: false}));
                  }}>إزالة</button>}
                </form>
              ))}
              {passwordMsg && <div style={{color:'#16a34a',marginTop:'10px',textAlign:'center'}}>{passwordMsg}</div>}
            </div>
          ) : adminSection === 'products' ? (
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
                      <div><b>الاسم:</b> {typeof order.name === 'string' ? order.name : order.name ? JSON.stringify(order.name) : ''}</div>
                      <div><b>العنوان:</b> {typeof order.address === 'string' ? order.address : order.address ? JSON.stringify(order.address) : ''}</div>
                      <div><b>رقم الجوال:</b> {typeof order.phone === 'string' ? order.phone : order.phone ? JSON.stringify(order.phone) : ''}</div>
                      <div><b>الإجمالي:</b> {typeof order.total === 'string' || typeof order.total === 'number' ? order.total : order.total ? JSON.stringify(order.total) : ''} $</div>
                      <div><b>تاريخ الطلب:</b> {typeof order.date === 'string' ? order.date : order.date ? JSON.stringify(order.date) : ''}</div>
                      <div><b>المنتجات:</b>
                        <ul>
                          {Array.isArray(order.items) && order.items.map((item, idx) => (
                            <li key={idx}>{typeof item.name === 'string' ? item.name : item.name ? JSON.stringify(item.name) : ''} × {typeof item.qty === 'number' ? item.qty : item.qty ? JSON.stringify(item.qty) : ''} ({typeof item.price === 'number' ? item.price : item.price ? JSON.stringify(item.price) : ''} ر.س)</li>
                          ))}
                        </ul>
                      </div>
                      <form style={{marginTop:'10px',display:'flex',gap:'8px'}} onSubmit={e => handleOrderReply(e, order.id)}>
                        <input
                          type="text"
                          placeholder="رد للزبون..."
                          value={replyInputs[order.id] || ''}
                          onChange={e => setReplyInputs(inputs => ({ ...inputs, [order.id]: e.target.value }))}
                          style={{flex:1,padding:'7px',borderRadius:'6px',border:'1px solid #ddd'}}
                        />
                        <button type="submit" style={{background:'#0ea5e9',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 16px',fontWeight:'bold',cursor:'pointer'}}>إرسال</button>
                        <button type="button" onClick={() => handleDeleteOrder(order.id)} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 14px',fontWeight:'bold',cursor:'pointer'}}>حذف</button>
                      </form>
                      {order.adminReply && (
                        <div style={{marginTop:'8px',background:'#f0fdf4',color:'#15803d',padding:'8px 12px',borderRadius:'8px',fontWeight:'bold',border:'1px solid #bbf7d0'}}>
                          رد الإدارة: {order.adminReply}
                        </div>
                      )}
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
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px 10px',
              boxShadow: '0 2px 8px #eee',
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                right: '38px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
                pointerEvents: 'none',
                fontSize: '1.35em'
              }}>🔍</span>
              <input
                type="text"
                placeholder="ابحث بالاسم أو السعر أو الوصف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 36px 10px 16px',
                  borderRadius: '8px',
                  border: '1.5px solid #bbb',
                  width: '70%',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border 0.2s',
                  boxShadow: '0 1px 3px #eee',
                  direction: 'rtl'
                }}
              />
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 1px 3px #eee'
                }}
              >مسح</button>
            </div>
            {/* تصفية الأقسام */}
            <div className="category-nav">
              <button
                onClick={() => setSelectedCategory('')}
                className={selectedCategory === '' ? 'cat-btn active' : 'cat-btn'}
              >كل الأقسام</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={selectedCategory === cat.name ? 'cat-btn active' : 'cat-btn'}
                >{cat.name}</button>
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <div style={{textAlign:'center',margin:'30px 0',color:'#888',fontSize:'1.2em',background:'#fff',padding:'18px',borderRadius:'12px',boxShadow:'0 1px 4px #eee'}}>
                لم يتم العثور على منتجات مطابقة لبحثك.
              </div>
            ) : (
              <div className="products-list">
                {filteredProducts.map(product => (
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
                    <div style={{marginTop:'4px',fontSize:'0.95em',color:product.available !== false ? '#16a34a':'#ef4444',fontWeight:'bold'}}>
                      {product.available !== false ? 'متوفر' : 'غير متوفر'}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      <div style={{fontSize:'0.95em',color:item.available !== false ? '#16a34a':'#ef4444',fontWeight:'bold'}}>
                        {item.available !== false ? 'متوفر' : 'غير متوفر'}
                      </div>
                      <div className="cart-price">{item.price} $ / للواحدة</div>
                      <div className="cart-qty-controls">
                        <button onClick={() => decreaseQty(item.id)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => addToCart(item)}>+</button>
                      </div>
                      <div className="cart-subtotal">المجموع: {item.price * item.qty} $</div>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>حذف</button>
                  </div>
                ))}
              </div>
              <div className="total">الإجمالي: {total} $</div>
              <button className="cart-clear-btn" onClick={clearCart}>إفراغ السلة</button>
              <button className="order-btn" onClick={() => setShowOrderForm(true)}>إتمام الطلب</button>
              {/* إشعار رد الإدارة على الطلب الأخير للزبون */}
              {orders.length > 0 && orders.filter(o => o.phone === orderPhone || o.name === orderName).slice(-1)[0]?.adminReply && (
                <div className="order-msg" style={{background:'#f0fdf4',color:'#15803d',border:'1.5px solid #bbf7d0',marginTop:'22px'}}>
                  <b>رد الإدارة:</b> {orders.filter(o => o.phone === orderPhone || o.name === orderName).slice(-1)[0].adminReply}
                </div>
              )}
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
          {typeof orderMsg === 'string' && orderMsg && <div className="order-msg">{orderMsg}</div>}

          <button className="back-btn" onClick={() => setShowCart(false)}>
            ← العودة للمنتجات
          </button>
        </main>
      )}
      <footer className="footer">جميع الحقوق محفوظة © jawad shop 2025</footer>
    </div>
  </>
  );
}
