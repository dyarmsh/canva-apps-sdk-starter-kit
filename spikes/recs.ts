type RGB = {
    r: number
    g: number
    b: number
}

type HSL = {
    h: number
    s: number
    l: number
}

type Result = {
    NormalAA: boolean,
    NormalAAA: boolean,
    LargeAA: boolean,
    LargeAAA: boolean
}

function withinRange(colorLinear: RGB, adjust: number) {
    return (colorLinear.r * adjust <= 1 && colorLinear.g * adjust <= 1 && colorLinear.b * adjust <= 1 
        && colorLinear.r * adjust >= 0 && colorLinear.g * adjust >= 0 && colorLinear.b * adjust >= 0)
}

function convertRGBToLinearRGB(color: RGB): RGB {
    const redsRGB: number = color.r/255
    const greensRGB: number = color.g/255
    const blueSRGB: number = color.b/255

    const redLinear: number = ((redsRGB <= 0.03928) ? redsRGB/12.92 : ((redsRGB +0.055)/1.055) ** 2.4)
    const greenLinear: number = ((greensRGB <= 0.03928) ? greensRGB/12.92 : ((greensRGB +0.055)/1.055) ** 2.4)
    const blueLinear: number = ((blueSRGB <= 0.03928) ? blueSRGB/12.92 : ((blueSRGB +0.055)/1.055) ** 2.4)

    return { r: redLinear, g: greenLinear, b: blueLinear }
}

function convertLinearRGBToRGB(colorLinear: RGB): RGB {
    const redsRGB: number = ((colorLinear.r <= 491 / 161500) ? colorLinear.r * 12.92 : ((colorLinear.r ** (1/2.4)) * 1.055) - 0.055)
    const greensRGB: number = ((colorLinear.g <= 491 / 161500) ? colorLinear.g * 12.92 : ((colorLinear.g ** (1/2.4)) * 1.055) - 0.055)
    const blueSRGB: number = ((colorLinear.b <= 491 / 161500) ? colorLinear.b * 12.92 : ((colorLinear.b ** (1/2.4)) * 1.055) - 0.055)

    const red: number = redsRGB * 255
    const green: number = greensRGB * 255
    const blue: number = blueSRGB * 255

    return { r: Math.round(red), g: Math.round(green), b: Math.round(blue) }
}

function convertRGBtoHSL(color: RGB): HSL {
    const r = color.r / 255
    const g = color.g / 255
    const b = color.b / 255

    const x_max: number = Math.max(r, g, b)
    const x_min: number = Math.min(r, g, b)
    const c: number = x_max - x_min
    const l: number = (x_max + x_min) / 2
    let h: number
    let s: number

    if (c == 0) {
        h = 0
    }
    else if (x_max == r) {
        h = 60 * (((g - b) / c) % 6)
    }
    else if(x_max == g) {
        h = 60 * (((b - r) / c) + 2)
    }
    else {
        h = 60 * (((r - g) / c) + 4)
    }

    if (l == 0 || l == 1) {
        s = 0
    }
    else {
        s = (c / (1 - Math.abs((2 * l) - 1)))
    }

    return { h: h, s: s, l: l }
}

function convertHSLtoRGB(colorHSL: HSL): RGB {
    const c: number = (1 - Math.abs((2 * colorHSL.l) - 1)) * colorHSL.s
    const h_: number = colorHSL.h / 60
    const x: number = c * (1 - Math.abs((h_ % 2) - 1))
    let R1G1B1: RGB

    if(h_ < 1) {
        R1G1B1 = { r: c, g: x, b: 0 }
    }
    else if(h_ < 2) {
        R1G1B1 = { r: x, g: c, b: 0 }
    }
    else if(h_ < 3) {
        R1G1B1 = { r: 0, g: c, b: x }
    }
    else if(h_ < 4) {
        R1G1B1 = { r: 0, g: x, b: c }
    }
    else if(h_ < 5) {
        R1G1B1 = { r: x, g: 0, b: c }
    }
    else {
        R1G1B1 = { r: c, g: 0, b: x }
    }

    const m: number = colorHSL.l - (c / 2)
    
    return { r: Math.round((R1G1B1.r + m) * 255), g: Math.round((R1G1B1.g + m) * 255), b: Math.round((R1G1B1.b + m) * 255) }
}

function findRelativeLuminance(color: RGB) {
    const colorLinear: RGB = convertRGBToLinearRGB(color)

    const lum: number = 0.2126 * colorLinear.r + 0.7152 * colorLinear.g + 0.0722 * colorLinear.b

    return lum
}

function findContrastRatio(fg: RGB, bg: RGB) {
    const lum1: number = findRelativeLuminance(fg)
    const lum2: number = findRelativeLuminance(bg)

    let ratio: number = (lum1 + 0.05) / (lum2 + 0.05)
    if (ratio < 1) {
        ratio = 1/ratio
    }

    return ratio
}

function runContrastTests(fg: RGB, bg: RGB) {
    const ratio: number = findContrastRatio(fg, bg)
    let result: Result = {
        NormalAA: false,
        NormalAAA: false,
        LargeAA: false,
        LargeAAA: false
    }

    if (ratio >= 3) {
        result.LargeAA = true
    }
    if (ratio >= 4.5) {
        result.LargeAAA = true
        result.NormalAA = true
    }
    if (ratio >= 7) {
        result.NormalAAA = true
    }

    return result
}

// function findBetterColor(original: RGB, context: RGB): RGB {
//     if (findContrastRatio(original, context) >= 7) {
//         return original
//     }
//     else {
//         let lumOriginal = findRelativeLuminance(original)
//         let lumContext = findRelativeLuminance(context)

//         const numAdjust = ((7 * lumContext) + 0.3) / lumOriginal
//         const denomAdjust = (lumContext - 0.3) / (7 * lumOriginal) //Must ensure lumOrginal > 0

//         const originalLinear = convertRGBToLinearRGB(original)
//         let adjusted = original

//         if (lumOriginal * numAdjust > lumContext && withinRange(originalLinear, numAdjust)) {
//             console.log("Case 1")
//             adjusted =  convertLinearRGBToRGB({ r: originalLinear.r * numAdjust, g: originalLinear.g * numAdjust, b: originalLinear.b * numAdjust })
//         }
//         else if (lumContext > lumOriginal * denomAdjust && withinRange(originalLinear, denomAdjust)) {
//             console.log("Case 2")
//             adjusted =  convertLinearRGBToRGB({ r: originalLinear.r * denomAdjust, g: originalLinear.g * denomAdjust, b: originalLinear.b * denomAdjust })
//         }
//         else {
//         console.log("Failed")
//         }

//         return adjusted
//     }
// }

function findBetterColor(original: RGB, context: RGB): RGB {
    if (findContrastRatio(original, context) >= 7) {
        return original
    }
    else {
        let adjusted = original
        const originalHSL: HSL = convertRGBtoHSL(original)
        if(findContrastRatio(convertHSLtoRGB({ h: originalHSL.h, s: originalHSL.s, l: 1 }), context) >= 7) {
            console.log("Case 1")
            for(let i: number = 0.01; i <= 1 - originalHSL.l; i += 0.01) {
                adjusted = convertHSLtoRGB({ h: originalHSL.h, s: originalHSL.s, l: originalHSL.l + i })
                if (findContrastRatio(adjusted, context) >= 7) {
                    break
                }
            }

            return adjusted
        }
        else if(findContrastRatio(convertHSLtoRGB({ h: originalHSL.h, s: originalHSL.s, l: 0 }), context) >= 7) {
            console.log("Case 2")
            for(let i: number = 0.01; i <= originalHSL.l; i += 0.01) {
                adjusted = convertHSLtoRGB({ h: originalHSL.h, s: originalHSL.s, l: originalHSL.l - i })
                if (findContrastRatio(adjusted, context) >= 7) {
                    break
                }
            }

            return adjusted
        }
        else {
            console.log("Failed")
            return original
        }
    }
}

const fg: RGB = { r: Math.round(Math.random() * 255), g: Math.round(Math.random() * 255), b: Math.round(Math.random() * 255) }
const bg: RGB = { r: Math.round(Math.random() * 255), g: Math.round(Math.random() * 255), b: Math.round(Math.random() * 255) }
// const fg: RGB = { r: 16, g: 94, b: 139 }
// const bg: RGB = { r: 26, g: 65, b: 14 }

const fgLinear: RGB = convertRGBToLinearRGB(fg)
const fgHSL: HSL = convertRGBtoHSL(fg)

console.log("Original Colors: ", fg, bg)
console.log("Contrast Ratio:", findContrastRatio(fg, bg))
// console.log("FG Lum.: ", findRelativeLuminance(fg))
// console.log("BG Lum.: ", findRelativeLuminance(bg))
// console.log(runContrastTests(fg, bg))

// console.log(fgLinear)
// console.log(fgHSL)
// console.log(convertHSLtoRGB(fgHSL))

console.log("Adjusted Colors: ", findBetterColor(fg, bg), bg)
console.log("Contrast Ratio: ", findContrastRatio(findBetterColor(fg, bg), bg))