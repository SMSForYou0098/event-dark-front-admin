// rootReducer.js
import { combineReducers } from 'redux'
import theme from './slices/themeSlice'
import auth from './slices/authSlice'

/**
 * Creates the combined reducer given asyncReducers.
 * This stays pure and just returns the combined reducer function.
 */
const createRootReducer = (asyncReducers = {}) =>
  combineReducers({
    theme,
    auth,
    ...asyncReducers,
  })

export default createRootReducer
