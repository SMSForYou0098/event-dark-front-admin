// rootReducer.js
import { combineReducers } from 'redux'
import theme from './slices/themeSlice'
import auth from './slices/authSlice'
import printer from './slices/printerSlice'
import refund from './slices/refundSlice'

/**
 * Creates the combined reducer given asyncReducers.
 * This stays pure and just returns the combined reducer function.
 */
const createRootReducer = (asyncReducers = {}) =>
  combineReducers({
    theme,
    auth,
    printer,
    refund,
    ...asyncReducers,
  })

export default createRootReducer
