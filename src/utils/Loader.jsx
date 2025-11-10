import { Image } from 'antd'
import { useMyContext } from 'Context/MyContextProvider'
import React from 'react'

const Loader = () => {
    const {loader} = useMyContext()
    return (
        <div className="loader-container d-flex justify-content-center align-items-center">
            <Image src={loader} alt="Loading..." width={100} />
        </div>
    )
}

export default Loader
