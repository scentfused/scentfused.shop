import { useMemo, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import Admin from './pages/Admin.jsx'
import { initialProducts, CATEGORIES } from './data/catalog.js'
import { defaultSettings } from './data/settings.js'
import { shade } from './utils/color.js'

export default function App() {
  const [products, setProducts] = useState(initialProducts)
  const [settings, setSettings] = useState(defaultSettings)

  // Derive the bright/dim accent shades from the single chosen accent color,
  // and expose the brand font as a CSS variable, so both apply live site-wide.
  const themeVars = useMemo(() => ({
    '--brand-font': `'${settings.brandFont}', sans-serif`,
    '--gold': settings.accentColor,
    '--gold-bright': shade(settings.accentColor, 0.35),
    '--gold-dim': shade(settings.accentColor, -0.45)
  }), [settings.brandFont, settings.accentColor])

  return (
    <div style={themeVars} className="app-shell">
      <Routes>
        <Route path="/" element={<Home products={products} settings={settings} />} />
        {CATEGORIES.map((cat) => (
          <Route
            key={cat.key}
            path={`/${cat.key}`}
            element={<CategoryPage products={products} categoryKey={cat.key} />}
          />
        ))}
        <Route
          path="/admin"
          element={
            <Admin
              products={products}
              setProducts={setProducts}
              settings={settings}
              setSettings={setSettings}
            />
          }
        />
      </Routes>
    </div>
  )
}
