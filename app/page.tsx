'use client'
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-pro-react'), { ssr: false });
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
// import 'react-quill/dist/quill.snow.css';

async function getNews() {
  const res = await fetch('http://localhost:3000/api/news', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

function TextEditor({ setContent, content, readonly }: any) {
  const editor = useRef(null);
  const config = {
    readonly: readonly,
    uploader: {
      url: 'https://xdsoft.net/jodit/finder/?action=fileUpload'
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'eraser',
      'ul', 'ol', 'font', 'fontsize', 'paragraph', 'lineHeight',
      'superscript', 'subscript', 'classSpan', 'cut', 'copy',
      'paste', 'selectall'
    ],
    filebrowser: {
      ajax: {
        url: 'https://xdsoft.net/jodit/finder/'
      },
      height: 300,
    },
    height: 400,
  };
  return (
    <JoditEditor
      ref={editor}
      value={content}
      config={config}
      tabIndex={1}
      onBlur={newContent => setContent(newContent)}
      onChange={() => { }}
    />
  );
}

function EditModal({ open, data, onChange, onClose, onSave, onImageUpload, categories, onDescriptionChange }: any) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        padding: 40,
        borderRadius: 18,
        minWidth: 600,
        maxWidth: 900,
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 28, color: '#888', cursor: 'pointer', fontWeight: 300 }}>&times;</button>
        <h1 style={{ marginBottom: 28, fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>Edit News</h1>
        <div style={{ borderBottom: '1px solid #eee', marginBottom: 28 }} />
        <label style={{ fontWeight: 500, marginBottom: 18, display: 'block' }}>Headline
          <input name="headline" value={data.headline} onChange={onChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }} />
        </label>
        <label style={{ fontWeight: 500, marginBottom: 18, display: 'block' }}>Short URL
          <input name="shortUrl" value={data.shortUrl || ''} onChange={onChange} placeholder="Paste or generate short URL" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <label style={{ fontWeight: 500 }}>Author
            <select name="author" value={data.author} onChange={onChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
              <option value="Harshit Sharma">Harshit Sharma</option>
              <option value="Jitesh Kanwariya">Jitesh Kanwariya</option>
              <option value="Saroj Panigrahi">Saroj Panigrahi</option>
            </select>
          </label>
          <label style={{ fontWeight: 500 }}>Category
            <select name="category" value={data.category} onChange={onChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label style={{ fontWeight: 500 }}>Image Upload
            <input type="file" accept="image/*" onChange={onImageUpload} />
            {data.image && (
              <div style={{ marginTop: 12 }}>
                <img src={data.image} alt="Uploaded" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, border: '1px solid #eee' }} />
              </div>
            )}
          </label>
        </div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Description</div>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, minHeight: 350, marginBottom: 16, padding: 8, background: '#fafbfc' }}>
          <TextEditor setContent={onDescriptionChange} content={data.description} readonly={false} />
        </div>
        <div style={{ borderTop: '1px solid #eee', marginTop: 36, marginBottom: 16 }} />
        <div style={{ marginTop: 0, display: 'flex', gap: 18, justifyContent: 'flex-end' }}>
          <button onClick={onSave} style={{ padding: '10px 36px', fontWeight: 700, fontSize: 16, background: '#222', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', letterSpacing: 1 }}>Save</button>
          <button onClick={onClose} style={{ padding: '10px 36px', fontWeight: 500, fontSize: 16, background: '#eee', color: '#222', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear().toString().slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HomePage() {
  const [news, setNews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<any>({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [publishedIds, setPublishedIds] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [categories, setCategories] = useState<any[]>([]);

  // Login state
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');
  const [loginForm, setLoginForm] = React.useState({ username: '', password: '' });

  const router = useRouter();

  // Check login state from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isLoggedIn');
      if (loggedIn !== 'true') router.push('/login');
    }
  }, [router]);

  function handleLogout() {
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') localStorage.removeItem('isLoggedIn');
    router.push('/login');
  }

  useEffect(() => {
    // Fetch categories from WordPress
    fetch('https://trending.niftytrader.in/wp-json/wp/v2/categories')
      .then(res => res.json())
      .then(setCategories);
  }, []);

  React.useEffect(() => {
    setLoading(true);
    getNews().then((n) => {
      setNews(n.reverse()); // show newest first
      setLoading(false);
    });
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const paginatedNews = news.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  async function handleScrape() {
    setScraping(true);
    // Call all sources one by one
    const sources = ['timesofindia', 'thehindu', 'unnews', 'economictimes', 'livemint'];
    for (const source of sources) {
      await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
    }
    // Reload news
    const n = await getNews();
    setNews(n);
    setScraping(false);
  }

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setEditData(news[idx]);
    setModalOpen(true);
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  }

  function handleEditCancel() {
    setEditIdx(null);
    setEditData({});
    setModalOpen(false);
  }

  async function handleEditSave() {
    const updated = [...news];
    // PATCH to backend
    const res = await fetch('/api/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      const updatedItem = await res.json();
      updated[editIdx!] = updatedItem;
      setNews(updated);
    } else {
      // fallback: update local state anyway
      updated[editIdx!] = { ...updated[editIdx!], ...editData };
      setNews(updated);
    }
    setEditIdx(null);
    setEditData({});
    setModalOpen(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Only set local preview, do not upload to remote API
    const localUrl = URL.createObjectURL(file);
    setEditData((prev: any) => ({ ...prev, image: localUrl }));
  }

  async function handlePublish(newsItem: any) {
    // Always send category id (number) to API
    let categoryId = newsItem.category;
    if (typeof categoryId !== 'number') {
      const found = categories.find((cat) => cat.id == newsItem.category || cat.slug == newsItem.category);
      categoryId = found ? found.id : null;
    }
    const payload = { ...newsItem, categories: categoryId ? [categoryId] : [] };
    delete payload.category;
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setPublishedIds((prev) => [...prev, newsItem._id]);
      // Mark as published in state
      setNews((prev: any[]) => prev.map(n => n._id === newsItem._id ? { ...n, published: true } : n));
      // Update published flag in DB
      await fetch('/api/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newsItem, published: true }),
      });
    }
  }

  async function handleGenerateImage(newsItem: any, idx: number) {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: newsItem.description }),
    });
    if (res.ok) {
      const { base64 } = await res.json();
      const updated = [...news];
      updated[idx] = { ...updated[idx], image: `data:image/png;base64,${base64}` };
      setNews(updated);
      // Optionally update in DB
      await fetch('/api/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated[idx] }),
      });
    }
  }

  function handleDescriptionChange(value: string) {
    setEditData((prev: any) => ({ ...prev, description: value }));
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this news item?')) return;
    const res = await fetch('/api/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id: id }),
    });
    if (res.ok) {
      setNews((prev: any[]) => prev.filter(n => n._id !== id));
    }
  }

  return (
 

<main className="container">
      <div className="header">
        <h2 className="">News Dashboard</h2>
        <button
          onClick={handleScrape}
          disabled={scraping}
          className={`btn ${scraping ? 'btn-disabled' : ''}`}
        >
          {scraping ? 'Scraping...' : 'Fetch Latest News'}
        </button>
        <button
          onClick={handleLogout}
          className="btn btn-danger"
          style={{ marginLeft: 16 }}
        >
          Logout
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Headline</th>
              <th>Author</th>
              <th>Time</th>
              <th>Description</th>
              <th>Category</th>
              <th>URL</th>
              <th>Status</th>
              <th>Action</th>
              <th>Publish</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="table-loading">
                  Loading...
                </td>
              </tr>
            ) : news.length === 0 ? (
              <tr>
                <td colSpan={10} className="table-empty">
                  No news found.
                </td>
              </tr>
            ) : (
              paginatedNews.map((item, idx) => (
                <tr key={idx}>
                  <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="ellipsis" title={item.headline}>
                    {item.headline}
                  </td>
                  <td>{item.author || 'N/A'}</td>
                  <td className="time">{formatDate(item.time)}</td>
                  <td className="ellipsis description" title={item.description.replace(/<[^>]+>/g, '')}>
                    <div dangerouslySetInnerHTML={{ __html: item.description }} />
                  </td>
                  <td>
                    {categories.find((cat) => cat.id == item.category)?.name || item.category}
                  </td>
                  <td>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  </td>
                  <td>{item.published ? 'Published' : 'Pending'}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit((currentPage - 1) * itemsPerPage + idx)}
                    >
                      Edit
                    </button>
                    &nbsp;
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                  <td>
                    <button
                      className={`btn ${publishedIds.includes(item._id) ? 'btn-disabled' : 'btn-secondary'}`}
                      onClick={() => handlePublish(item)}
                      disabled={publishedIds.includes(item._id)}
                    >
                      {publishedIds.includes(item._id) ? 'Published' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-pagination"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-pagination"
          >
            Next
          </button>
        </div>
      )}

      <EditModal
        open={modalOpen}
        data={editData}
        onChange={handleEditChange}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        onImageUpload={handleImageUpload}
        categories={categories}
        onDescriptionChange={handleDescriptionChange}
      />
 </main>

  );
}
