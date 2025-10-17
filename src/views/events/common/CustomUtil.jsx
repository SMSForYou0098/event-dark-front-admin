export const getBackgroundWithOpacity = (color, opacity = 0.1) => {
    // If color is already in rgb/rgba format
    if (color?.startsWith('rgb')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
    }
    // If color is in hex format
    if (color?.startsWith('#')) {
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    // Fallback
    return color
}