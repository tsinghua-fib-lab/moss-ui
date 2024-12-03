// divide the projStr by blank space, add '+' before each word if there is no '+', and join them together
export const patchProjStr = (projStr: string): string => {
    return projStr.split(' ').map(p => p.startsWith('+') ? p : `+${p}`).join(' ')
}
