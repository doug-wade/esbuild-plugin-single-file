export default function safelyGetEntryPointFilePath (entryPoint: string | { in: string; out: string; }) {
    if (typeof entryPoint === 'string') {
        return entryPoint;
    }

    return entryPoint.in;
}
