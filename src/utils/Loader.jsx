import { Image } from 'antd'
import { useMyContext } from 'Context/MyContextProvider'
import React from 'react'

const Loader = ({ imgUrl, width = 100, height = 'auto' }) => {
    const { loader } = useMyContext()
    
    const imageSrc = imgUrl || loader

    return (
        <div 
            className="loader-container d-flex justify-content-center align-items-center"
            style={{ width: "100%", height: "100%" }}
        >
            <Image
                src={imageSrc}
                alt="Loading..."
                width={width}
                height={height}
                preview={false}
                fallback="/assets/fallback-loader.gif"
            />
        </div>
    )
}

export default Loader
