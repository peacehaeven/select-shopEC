export default function AdminLoginPage() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>管理者ログイン画面</h1>
      <form style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto' }}>
        <input type="text" placeholder="管理者ID" style={{ padding: '10px' }} />
        <input type="password" placeholder="パスワード" style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
          ログイン
        </button>
      </form>
    </main>
  );
}