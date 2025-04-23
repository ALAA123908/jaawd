import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // يمكنك إرسال الخطأ لسيرفر خارجي هنا إذا أردت
    console.error('ErrorBoundary caught:', error, info);
    if (error && error.message) {
      console.error('Error message:', error.message);
    }
    if (error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    if (info && info.componentStack) {
      console.error('Component stack:', info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'40px',textAlign:'center',color:'#b91c1c',background:'#fff0f1',borderRadius:'16px',margin:'40px auto',maxWidth:500}}>
          <h2>حدث خطأ غير متوقع في التطبيق</h2>
          <p>يرجى إعادة تحميل الصفحة أو التواصل مع الدعم الفني.</p>
          <details style={{color:'#a94442',marginTop:'20px',direction:'ltr',textAlign:'left'}}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error && this.state.error.message}
            <br />
            {this.state.error && this.state.error.stack && (
              <pre style={{fontSize:'0.85em',overflowX:'auto'}}>{this.state.error.stack}</pre>
            )}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
