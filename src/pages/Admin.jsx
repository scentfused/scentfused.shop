import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, emptyDraft } from '../data/catalog.js'
import { FONT_OPTIONS } from '../data/settings.js'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2MB, keeps in-memory state reasonable

export default function Admin({ products, setProducts, settings, setSettings }) {
  const [draft, setDraft] = useState(emptyDraft())
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [imageError, setImageError] = useState('')

  const stats = useMemo(() => {
    const total = products.length
    const value = products.reduce((sum, p) => sum + Number(p.price || 0), 0)
    const byCategory = CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      count: products.filter((p) => p.category === c.key).length
    }))
    return { total, value, byCategory }
  }, [products])

  const visible = filter === 'all' ? products : products.filter((p) => p.category === filter)

  function resetForm() {
    setDraft(emptyDraft())
    setEditingId(null)
    setImageError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!draft.name.trim() || !draft.price) return

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...draft, price: Number(draft.price) } : p))
      )
    } else {
      const nextId = Math.max(0, ...products.map((p) => p.id)) + 1
      setProducts((prev) => [...prev, { id: nextId, ...draft, price: Number(draft.price) }])
    }
    resetForm()
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setImageError('')
    setDraft({
      name: product.name,
      category: product.category,
      note: product.note,
      price: String(product.price),
      image: product.image || ''
    })
  }

  function handleDelete(id) {
    if (editingId === id) resetForm()
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large — please use a file under 2MB, or paste a URL instead.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, image: reader.result }))
    reader.onerror = () => setImageError('Could not read that file — please try again.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="admin">
      <header className="admin-topbar">
        <span className="brand">scentfused <em>admin</em></span>
        {/* Top-right button back to the storefront */}
        <Link className="admin-btn" to="/">View site</Link>
      </header>

      <div className="wrap admin-wrap">
        <section className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Total products</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Catalog value</span>
            <span className="stat-value">Rs. {stats.value.toLocaleString()}</span>
          </div>
          {stats.byCategory.map((c) => (
            <div className="stat-card" key={c.key}>
              <span className="stat-label">{c.label}</span>
              <span className="stat-value">{c.count}</span>
            </div>
          ))}
        </section>

        {/* ---------- Site settings ---------- */}
        <section className="admin-form-card">
          <h2>Site settings</h2>

          <div className="settings-grid">
            <div className="settings-group">
              <h3 className="settings-group-title">Branding</h3>

              <label className="settings-row">
                Brand font
                <select
                  value={settings.brandFont}
                  onChange={(e) => setSettings({ ...settings, brandFont: e.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </label>
              <span className="brand-preview" style={{ fontFamily: `'${settings.brandFont}', sans-serif` }}>
                scentfused
              </span>

              <label className="settings-row">
                Accent color
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                />
              </label>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Display</h3>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.showNewBadge}
                  onChange={(e) => setSettings({ ...settings, showNewBadge: e.target.checked })}
                />
                Show "New" badge on latest arrivals
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.carouselAutoplay}
                  onChange={(e) => setSettings({ ...settings, carouselAutoplay: e.target.checked })}
                />
                Auto-scroll the latest arrivals carousel
              </label>
            </div>
          </div>
        </section>

        {/* ---------- Add / edit product ---------- */}
        <section className="admin-form-card">
          <h2>{editingId ? 'Edit product' : 'Add a product'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Name
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Noir Oud"
                required
              />
            </label>

            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>

            <label>
              Note
              <input
                type="text"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="e.g. Smoked oud, dark amber, leather"
              />
            </label>

            <label>
              Price (Rs.)
              <input
                type="number"
                min="0"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder="e.g. 6500"
                required
              />
            </label>

            <label className="admin-form-wide">
              Image URL
              <input
                type="url"
                value={draft.image.startsWith('data:') ? '' : draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </label>

            <label className="admin-form-wide">
              Or upload an image
              <input type="file" accept="image/*" onChange={handleImageFile} />
            </label>

            {imageError && <p className="admin-form-error admin-form-wide">{imageError}</p>}

            {draft.image && (
              <div className="admin-form-wide image-preview">
                <img src={draft.image} alt="Preview" />
                <button type="button" onClick={() => setDraft({ ...draft, image: '' })}>
                  Remove image
                </button>
              </div>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-solid">
                {editingId ? 'Save changes' : 'Add product'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-line" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ---------- Product table ---------- */}
        <section className="admin-table-card">
          <div className="admin-table-head">
            <h2>Products</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Note</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-thumb">
                      {p.image
                        ? <img src={p.image} alt={p.name} />
                        : <span className="admin-thumb-empty">—</span>}
                    </div>
                  </td>
                  <td>{p.name}</td>
                  <td>{CATEGORIES.find((c) => c.key === p.category)?.label}</td>
                  <td className="muted">{p.note}</td>
                  <td>Rs. {Number(p.price).toLocaleString()}</td>
                  <td className="admin-row-actions">
                    <button onClick={() => handleEdit(p)}>Edit</button>
                    <button onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">No products in this category yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
