// App.jsx (or App.js)
import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeSwitcherProvider } from 'react-css-theme-switcher'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import store, { persistor } from './store'
import Layouts from './layouts'
import { THEME_CONFIG } from './configs/AppConfig'
import './index.css' // keep whatever global CSS you need
import { MyContextProvider } from 'Context/MyContextProvider'

const themes = {
  dark: `${process.env.PUBLIC_URL}/css/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/css/light-theme.css`,
}

// Create a QueryClient for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
})

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <MyContextProvider>

          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ThemeSwitcherProvider
                themeMap={themes}
                defaultTheme={THEME_CONFIG.currentTheme}
                insertionPoint="styles-insertion-point"
              >
                <Layouts />
              </ThemeSwitcherProvider>
            </BrowserRouter>
          </QueryClientProvider>
          </MyContextProvider>
        </PersistGate>
      </Provider>
    </div>
  )
}

export default App
