import React from 'react'
import StickyBottom from './StickyBottom'

const StickyLayout = ({left,middle,right}) => {
  return (
   <StickyBottom>
    <div className="d-flex justify-content-between align-items-center">
      <div className="d-flex flex-column gap-1">
        {left}
        {middle}
      </div>
      <div className="nxt-btn">
        {right}
      </div>
    </div>
  </StickyBottom>
  )
}

export default StickyLayout
