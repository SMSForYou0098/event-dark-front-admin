// store.js
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web

import createRootReducer from './rootReducer'

const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  // persist only these slices (change as needed)
  // Note: 'printer' is NOT persisted because Bluetooth/USB hardware connections
  // cannot be serialized and require fresh connection each session
  whitelist: ['auth', 'theme'],
  // blacklist: ['someTransientSlice'] // alternatively use blacklist
}

// initial empty asyncReducers map
const asyncReducers = {}

/**
 * Build persisted reducer from current async reducers
 */
const createPersistedReducer = (asyncReducersMap = {}) => {
  const rootReducer = createRootReducer(asyncReducersMap)
  return persistReducer(persistConfig, rootReducer)
}

const middlewares = []

// create store with persisted reducer
const store = configureStore({
  reducer: createPersistedReducer(asyncReducers),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist uses non-serializable actions
      immutableCheck: false,
    }).concat(middlewares),
  devTools: process.env.NODE_ENV === 'development',
})

// attach asyncReducers and helper to store
store.asyncReducers = { ...asyncReducers }

// create persistor
export const persistor = persistStore(store)

/**
 * Dynamically inject a reducer (for code-splitting / feature modules).
 * If reducer for key already exists no-op.
 * Returns store (or false if already existed).
 */
export const injectReducer = (key, reducer) => {
  if (store.asyncReducers[key]) {
    return false
  }

  store.asyncReducers[key] = reducer

  // When replacing reducer we must wrap the new root reducer with persistReducer again
  const newPersistedReducer = createPersistedReducer(store.asyncReducers)
  store.replaceReducer(newPersistedReducer)

  // Note: no need to re-create persistor; persistStore will continue to work with new reducer
  return store
}

export default store
