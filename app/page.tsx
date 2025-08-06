'use client'
import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
const JoditEditor = dynamic(() => import('jodit-pro-react'), { ssr: false });

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSignOutAlt, faEdit, faTrash, faUpload, faCheck, faTimes, faLink, faClock } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Loader from '@/components/Loader';
// import 'react-quill/dist/quill.snow.css';

async function getNews() {
  const res = await fetch('/api/news', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

function TextEditor({ setContent, content, readonly }: any) {
  const editor = React.useRef(null);
  const config = {
    readonly: readonly,
    height: 400,
    toolbarSticky: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough',
      'ul', 'ol', 'outdent', 'indent',
      'paragraph', 'font', 'fontsize',
      'align', 'undo', 'redo', 'hr',
      'eraser', 'copyformat', 'fullsize', 'preview'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    paste: {
      cleanOnPaste: true,
      allowTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'b', 'i', 'u', 'h1', 'h2', 'h3']
    }
  };
  return (
    <JoditEditor
      ref={editor}
      value={content || ''}
      config={config}
      tabIndex={1}
      onBlur={newContent => setContent(newContent)}
    />
  );
}

function EditModal({ open, data, onChange, onClose, onSave, onImageUpload, categories, WP_USERS, errors = {}, isAdd = false, imageUploading }: any) {
  const [seoScore, setSeoScore] = React.useState<number | null>(null);
  const [seoSuggestions, setSeoSuggestions] = React.useState<string[]>([]);
  const [seoLoading, setSeoLoading] = React.useState(false);
  const debounceRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!data.headline && !data.description) {
      setSeoScore(null);
      setSeoSuggestions([]);
      return;
    }
    setSeoLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const keyword = (data.headline || '').split(' ')[0] || '';
      const res = await fetch('/api/news/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: data.headline, description: data.description, keyword }),
      });
      const result = await res.json();
      setSeoScore(result.score);
      setSeoSuggestions(result.suggestions);
      setSeoLoading(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [data.headline, data.description, data.shortUrl]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-white p-8 rounded shadow-lg max-w-[80%] w-full max-h-[80vh] overflow-y-auto border border-gray-300">
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-gray-500 text-2xl font-light cursor-pointer">&times;</button>
        <h1 className="text-2xl font-bold mb-4 text-blue-700">{isAdd ? 'Add News' : 'Edit News'}</h1>
        <div className="border-b border-gray-200 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side: all fields except description */}
          <div className="flex flex-col gap-4">
            <label className="block font-semibold text-base">Headline
              <input name="title" value={data.title || ''} onChange={onChange} className="w-full p-2 border border-gray-300 text-base mt-1 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
              {isAdd && errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
            </label>
            <label className="block font-medium text-sm">Short URL
              <input name="shortUrl" value={data.shortUrl || ''} onChange={onChange} placeholder="Paste or generate short URL" className="w-full p-2 border border-gray-300 text-base mt-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
            </label>
            <label className="block text-sm font-medium">Author
              <select name="author" value={data.author} onChange={onChange} className="w-full p-2 border border-gray-300 text-sm mt-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none">
                <option value="">Select Author</option>
                {WP_USERS.map((user: any, idx: number) => (
                  <option key={idx} value={user.username}>{user.username} ({user.role})</option>
                ))}
              </select>
              {isAdd && errors.author && <div className="text-red-500 text-xs mt-1">{errors.author}</div>}
            </label>
            <label className="block text-sm font-medium">Category
              <select name="category" value={data.category} onChange={onChange} className="w-full p-2 border border-gray-300 text-sm mt-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none">
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {isAdd && errors.category && <div className="text-red-500 text-xs mt-1">{errors.category}</div>}
            </label>
            {/* <label className="block text-sm font-medium">Image Upload
              <input type="file" accept="image/*" onChange={onImageUpload} className="w-full p-2 border border-gray-300 text-sm mt-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" disabled={!data.author} />
              {data.image && typeof data.image === 'string' && data.image.startsWith('blob:') && (
                <div className="mt-2">
                  <img src={data.image} alt="Uploaded" className="max-w-32 max-h-24 border border-gray-200" />
                </div>
              )}
            </label> */}
          </div>
          {/* Right side: description only */}
          <div className="flex flex-col h-full">
            <div className="font-semibold text-base mb-2">Description</div>
            <div className="min-h-[120px] bg-gray-100 flex-1 border border-gray-200">
              <TextEditor setContent={(content: string) => onChange({ target: { name: 'description', value: content } })} content={data.description} readonly={false} />
              {isAdd && errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-6 mb-4" />
        <div className="flex justify-end gap-3">
          <button onClick={onSave} className="px-6 py-1 font-bold text-base bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition disabled:opacity-60" style={{borderRadius: 0}} disabled={imageUploading}>
            {isAdd ? 'Add' : 'Save'}
          </button>
          <button onClick={onClose} className="px-6 py-1 font-medium text-base bg-gray-100 text-gray-800 border border-gray-400 hover:bg-gray-200 transition" style={{borderRadius: 0}}>
            Cancel
          </button>
        </div>
        {imageUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-50">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            <div className="text-blue-700 font-semibold text-lg">Uploading image...</div>
          </div>
        )}
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
  const [isScraping, setIsScraping] = React.useState(false);
  const [news, setNews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<any>({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [publishedIds, setPublishedIds] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [categories, setCategories] = React.useState<any[]>([]);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addData, setAddData] = React.useState<any>({ headline: '', description: '', author: '', category: '', image: '', shortUrl: '' });
  const [addErrors, setAddErrors] = React.useState<any>({});
  // Add state for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  // Add image upload loading state
  const [imageUploading, setImageUploading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const WP_USERS = [
    { username: 'sourabh', password: '4xMb49FUasHQM2OJyk4nxdYR', role: 'Author' },
    { username: 'aman', password: 'm0ZulaUFR2MXNlcJtxqScZsQ', role: 'Author' },
    { username: 'Jitesh Kanwariya', password: 'ppBcUh2xJyfhfJBp5rfX2Q1f', role: 'Author' },
    { username: 'Mahima Bhatt', password: 'vPPhR2iOG908N69DyGk3dPOb', role: 'Author' },
    { username: 'pradeep', password: 'bD72QVvfOqSNzFgzk78q25Sy', role: 'Author' },
    { username: 'Ravindra Dayma', password: 'OcX3aMF80lUXdJAMp0SwQLXP', role: 'Author' },
    { username: 'snehagandhi', password: 'qCBrBSxu3cJzlyraLy5NgZaW', role: 'Author' },
    { username: 'RuchikaDave', password: 'Yov6XpW57I7CnrKjur6fpkqi', role: 'Author' },

  ];

  // Login state
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);


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

  React.useEffect(() => {
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
  const filteredNews = news.filter(item => {
    const q = search.toLowerCase();
    return (
      item.headline?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      categories.find((cat) => cat.id == item.category)?.name?.toLowerCase().includes(q) ||
      item.url?.toLowerCase().includes(q)
    );
  });
  const paginatedNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    async function handleScrape() {
    setIsScraping(true);
    setScraping(true);
    // Call all sources one by one (include all from scrapers.ts)
    const sources = [
      'timesofindia',
      'moneycontrol',
      'cnbc',
      // 'rssfeed',
      'livemintnews',
      'economictimesnews',
      'news18news',
      'moneycontroleconomy',
      'indiatodayworld',
      'livemintworld',
      'moneycontrolworld',
      'economictimesworld'
    ];
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
    setIsScraping(false);
  }

  function handleEdit(idx: number) {
    setEditIdx(idx);
    setEditData(news[idx]);
    setModalOpen(true);
  }

  function generateSlug(headline: string) {
    return headline
      .slice(0, 25)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }



    function handleEditChange(e: any) {
    let value = e.target.value;
    let updated = { ...editData, [e.target.name]: value };
    if (e.target.name === 'title') {
      updated.shortUrl = generateSlug(value);
    }
    setEditData(updated);
  }

  function handleEditCancel() {
    setEditIdx(null);
    setEditData({});
    setModalOpen(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    // Get selected user from WP_USERS using author field
    const selectedUser = WP_USERS.find((u: any) => u.username === editData.author);
    const username = selectedUser?.username || '';
    const appPassword = selectedUser?.password || '';
    formData.append('username', username);
    formData.append('appPassword', appPassword);

    const res = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData,
    });

    setImageUploading(false);
    if (!res.ok) {
      const err = await res.json();
      console.error('Upload failed:', err);
      return;
    }

    const data = await res.json();
    setEditData((prev: any) => ({
      ...prev,
      image: data.id, // store only the id
      imageAuthor: data.author, // store image author id
    }));
  }

  async function handleEditSave() {
    const updated = [...news];
    const selectedUser = WP_USERS.find((u: any) => u.username === editData.author);
    const updatedEditData = {
      ...editData,
      author: selectedUser ? selectedUser.username : editData.author,
    };
    const imageId = Number(updatedEditData.image);
    if (isNaN(imageId) || imageId <= 0) delete updatedEditData.image;
    const res = await fetch('/api/news', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEditData),
    });
    if (res.ok) {
      const updatedItem = await res.json();
      updated[editIdx!] = updatedItem;
      setNews(updated);
    } else {
      updated[editIdx!] = { ...updated[editIdx!], ...updatedEditData };
      setNews(updated);
    }
    setEditIdx(null);
    setEditData({});
    setModalOpen(false);
  }

  async function handlePublish(newsItem: any) {
    let categoryId = newsItem.category;
    if (typeof categoryId !== 'number') {
      const found = categories.find((cat) => cat.id == newsItem.category || cat.slug == newsItem.category);
      categoryId = found ? found.id : null;
    }
    const selectedUser = WP_USERS.find((u: any) => u.username === newsItem.author);
    const slug = (newsItem.headline || '').slice(0, 25).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const payload = {
      ...newsItem,
      categories: categoryId ? [categoryId] : [],
      wpUser: selectedUser?.username,
      wpPass: selectedUser?.password,
      slug,
    };
    const imageId = Number(newsItem.image);
    if (!isNaN(imageId) && imageId > 0) payload.featured_media = imageId;
    // Do NOT send featured_media if imageId is not a valid positive number
    delete payload.category;
    delete payload.image;
    delete payload.imageAuthor;
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setPublishedIds((prev) => [...prev, newsItem._id]);
      setNews((prev: any[]) => prev.map(n => n._id === newsItem._id ? { ...n, published: true } : n));
      await fetch('/api/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newsItem, published: true }),
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

  function handleDeleteClick(id: string) {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  }
  async function handleDeleteConfirmed() {
    if (!deleteId) return;
    const res = await fetch('/api/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id: deleteId }),
    });
    if (res.ok) {
      setNews((prev: any[]) => prev.filter(n => n._id !== deleteId));
    }
    setDeleteConfirmOpen(false);
    setDeleteId(null);
  }
  function handleDeleteCancel() {
    setDeleteConfirmOpen(false);
    setDeleteId(null);
  }

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    let value = e.target.value;
    let updated = { ...addData, [e.target.name]: value };
    if (e.target.name === 'headline') {
      updated.shortUrl = generateSlug(value);
    }
    setAddData(updated);
  }
  function handleAddDescriptionChange(value: string) {
    setAddData((prev: any) => ({ ...prev, description: value }));
  }
  async function handleAddImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    // Get selected user from WP_USERS using author field
    const selectedUser = WP_USERS.find((u: any) => u.username === addData.author);
    const username = selectedUser?.username || '';
    const appPassword = selectedUser?.password || '';
    formData.append('username', username);
    formData.append('appPassword', appPassword);

    const res = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData,
    });

    setImageUploading(false);
    if (!res.ok) {
      const err = await res.json();
      console.error('Upload failed:', err);
      return;
    }

    const data = await res.json();
    setAddData((prev: any) => ({
      ...prev,
      image: data.id, // store only the id
      featured_media: data.id, // store only the id for WordPress compatibility
    }));
  }
  function validateAddForm() {
    const errors: any = {};
    if (!addData.headline || addData.headline.trim().length < 5) errors.headline = 'Headline is required (min 5 chars)';
    if (!addData.description || addData.description.trim().length < 10) errors.description = 'Description is required (min 10 chars)';
    if (!addData.author) errors.author = 'Author is required';
    if (!addData.category) errors.category = 'Category is required';
    return errors;
  }
  async function handleAddSave() {
    const errors = validateAddForm();
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = { ...addData };
    const imageId = Number(payload.image);
    if (isNaN(imageId) || imageId <= 0) delete payload.image;
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setAddModalOpen(false);
      setAddData({ headline: '', description: '', author: '', category: '', image: '', shortUrl: '' });
      setAddErrors({});
      // Refresh news
      const n = await getNews();
      setNews(n.reverse());
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setCurrentPage(1);
  }

  return (
 

    <main className="container-fluid mx-auto p-0 bg-white border border-gray-300 min-h-screen">
      <Head>
  <title>NiftyTrader News Dashboard</title>
  <meta name="description" content="Manage and publish NiftyTrader news with real-time SEO suggestions and WordPress integration." />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta charSet="utf-8" />
  <meta name="robots" content="index, follow" />

  {/* Canonical URL */}
  <link rel="canonical" href="https://yourdomain.com" />

  {/* Open Graph tags for social sharing */}
  <meta property="og:title" content="NiftyTrader News Dashboard" />
  <meta property="og:description" content="Manage and publish NiftyTrader news with real-time SEO suggestions." />
  {/* <meta property="og:image" content="https://yourdomain.com/og-image.jpg" />
  <meta property="og:url" content="https://yourdomain.com" /> */}
  <meta property="og:type" content="website" />

  {/* Twitter card */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="NiftyTrader News Dashboard" />
  <meta name="twitter:description" content="Publish financial news with smart SEO in NiftyTrader." />
  {/* <meta name="twitter:image" content="https://yourdomain.com/twitter-card.jpg" /> */}
      </Head>

      {/* {isScraping && (
       <Loader/>
      )} */}
  {/* Navbar/Header */}
  <div className="flex items-center justify-between border-b border-gray-300 px-8 py-3" style={{minHeight: '64px'}}>
    <div className="flex items-center gap-1">
    <Image src="/logo_side.svg" alt="NiftyTrader Logo" width={100} height={100} className='h-12 w-12' priority />
      <span className="text-xl font-semibold ">NiftyTrader News </span>
    </div>
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-1 bg-red-700 text-white rounded hover:bg-red-800  border border-red-600 transition-all duration-150 text-sm"
     
    >
      <FontAwesomeIcon icon={faSignOutAlt} className='h-4 w-4'  /> Logout
    </button>
  </div>

  {/* Controls above table */}
  <div className="w-full flex justify-center border-b border-gray-200 bg-gray-50">
    <div className="flex flex-col md:flex-row md:items-center justify-between w-full max-w-full px-8 py-3 gap-3">
   

<div className="flex items-center gap-3">
  {/* Add News Button */}
  <button
    onClick={() => setAddModalOpen(true)}
    className="flex items-center gap-2 px-4 py-[7px] bg-blue-600 text-white rounded-md border border-blue-700 hover:bg-blue-700 font-medium transition-all duration-150 text-sm shadow-sm"
  >
    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
    Add News
  </button>

  {/* Fetch Latest News Button */}
  <button
    onClick={handleScrape}
    disabled={scraping}
    className={`flex items-center gap-2 px-4 py-[7px] rounded-md font-medium text-sm transition-all duration-150 shadow-sm border ${
      scraping
        ? 'bg-blue-100 text-blue-500 border-blue-300 cursor-not-allowed'
        : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-600 hover:text-white focus:ring-2 focus:ring-blue-300 active:bg-blue-100'
    }`}
  >
    <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
    {scraping ? 'Scraping...' : 'Fetch Latest News'}
  </button>
</div>

      <div className="flex-1 flex justify-end">
        <input
          type="text"
          placeholder="Search news..."
          className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={search}
          onChange={handleSearchChange}
          style={{minHeight: '40px'}}
        />
      </div>
    </div>
  </div>

      <div className="table-wrapper w-full overflow-x-auto">
        <table className="w-full text-sm border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 font-bold border-b border-gray-300 text-left">#</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Headline</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Author</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Source</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Description</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Category</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Zone</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Sentiment</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Weightage</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">URL</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Status</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Action</th>
              <th className="p-3 font-bold border-b border-gray-300 text-left">Publish</th>
            </tr>
          </thead>
          <tbody>
            {loading || isScraping? 
            
            (
              Array.from({ length: 10 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                  {Array.from({ length: 13 }).map((_, colIndex) => (
                    <td key={colIndex} className="p-3 border-b border-gray-300">
                      <div className="h-9 bg-gray-200 rounded w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) 
            : news.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400 border-b border-gray-300">No news found.</td>
              </tr>
            ) : (
              paginatedNews.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="p-3 border-b border-gray-300 align-middle">{currentPage * itemsPerPage - itemsPerPage + idx + 1}</td>
                  <td className="p-3 border-b border-gray-300 max-w-xs truncate align-middle" title={item.title}>{item.title}</td>
                  <td className="p-3 border-b border-gray-300 align-middle capitalize">{item.author || 'N/A'}</td>
                  <td className="p-3 border-b border-gray-300 text-xs text-gray-500 align-middle uppercase">{item.source}</td>
                  <td className="p-3 border-b border-gray-300 max-w-xs truncate align-middle" title={(item.description || '').replace(/<[^>]+>/g, '')}>{(item.description || '').replace(/<[^>]+>/g, '')}</td>
                  <td className="p-3 border-b border-gray-300 align-middle uppercase font-semibold text-[11px] ">
                    <div className='bg-[#FFEDD5] text-[#2e261b] font-semibold text-center rounded-sm shadow-sm'>{categories.find((cat) => cat.id == item.category)?.name || item.category}</div>
                  </td>
                  <td className="p-3 border-b border-gray-300 align-middle capitalize">{item.zone || '-'}</td>
                  <td className="p-3 border-b border-gray-300 align-middle">{typeof item.sentiment === 'number' ? `${item.sentiment}/5` : '-'}</td>
                  <td className={`p-3 border-b border-gray-300 align-middle ${item.weightage === 'High' ? 'text-red-600 font-bold' : item.weightage === 'Low' ? 'text-yellow-600 font-bold' : ''}`}>{item.weightage || '-'}</td>
                  <td className="p-3 border-b border-gray-300 align-middle">
                    <span className="inline-flex items-center justify-center p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open Link">
                        <FontAwesomeIcon icon={faLink} />
                      </a>
                    </span>
                  </td>
                  <td className="p-3 border-b border-gray-300 align-middle">
                    {item.published ? (
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                        <FontAwesomeIcon icon={faClock} className="text-orange-600" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-b border-gray-300 flex gap-2 align-middle">
                    <button className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" onClick={() => handleEdit(currentPage * itemsPerPage - itemsPerPage + idx)} title="Edit"><FontAwesomeIcon icon={faEdit} /></button>
                    <button className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition" onClick={() => handleDeleteClick(item._id)} title="Delete"><FontAwesomeIcon icon={faTrash} /></button>
                  </td>
                  <td className="p-3 border-b border-gray-300 align-middle">
                    <button
                      className={`flex items-center gap-1 px-3 py-1 border text-sm font-semibold transition ${item.published ? 'bg-green-100 text-green-700 border-green-400 cursor-not-allowed' : !item.author ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'}`}
                      onClick={() => handlePublish(item)}
                      disabled={item.published || !item.author}
                      title={item.published ? 'Already published' : (!item.author ? 'Please edit this news and select an author' : '')}
                    >
                      <FontAwesomeIcon icon={faUpload} />
                      {item.published ? 'Published' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-6 mt-2 px-2">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, news.length)} of {news.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-40"
            >
              &#60;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
              (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) ? (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border border-gray-300 text-sm font-semibold transition ${currentPage === page ? 'bg-white text-blue-700 border-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-white'}`}
                >
                  {page}
                </button>
              ) : (
                (page === currentPage - 3 || page === currentPage + 3) && <span key={page} className="px-2 text-gray-400">...</span>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-40"
            >
              &#62;
            </button>
          </div>
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
        WP_USERS={WP_USERS}
        imageUploading={imageUploading}
      />
      {addModalOpen && (
        <EditModal
          open={addModalOpen}
          data={addData}
          onChange={handleAddChange}
          onClose={() => { setAddModalOpen(false); setAddErrors({}); }}
          onSave={handleAddSave}
          onImageUpload={handleAddImageUpload}
          categories={categories}
          onDescriptionChange={handleAddDescriptionChange}
          WP_USERS={WP_USERS}
          errors={addErrors}
          isAdd={true}
          imageUploading={imageUploading}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 shadow-lg p-8 max-w-sm w-full flex flex-col items-center" style={{borderRadius: 0}}>
            <div className="mb-3">
              <svg className="w-12 h-12 text-blue-600 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
            </div>
            <div className="text-lg font-semibold mb-6 text-center text-blue-700">Are you sure you want to delete this news item?</div>
            <div className="flex justify-center gap-4 w-full">
              <button onClick={handleDeleteConfirmed} className="px-6 py-1 bg-blue-600 text-white border border-blue-700 font-bold hover:bg-blue-700 transition text-base" style={{borderRadius: 0}}>Yes, Delete</button>
              <button onClick={handleDeleteCancel} className="px-6 py-1 bg-gray-100 text-gray-800 border border-gray-400 font-medium hover:bg-gray-200 transition text-base" style={{borderRadius: 0}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
 </main>

  );
}
