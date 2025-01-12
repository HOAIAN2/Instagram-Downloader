// How Zip work here https://en.wikipedia.org/wiki/ZIP_(file_format)
function calculateCRC32(data) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createLocalFileHeader(fileName, fileSize, crc32) {
    const fileNameBytes = new TextEncoder().encode(fileName);
    const header = new Uint8Array(30 + fileNameBytes.length);
    header.set([0x50, 0x4B, 0x03, 0x04], 0);
    header.set([0x14, 0x00], 4);
    header.set([0x00, 0x00], 6);
    header.set([0x00, 0x00], 8);
    header.set([0x00, 0x00, 0x00, 0x00], 10);
    header.set(new Uint8Array(new Uint32Array([crc32]).buffer), 14);
    header.set(new Uint8Array(new Uint32Array([fileSize]).buffer), 18);
    header.set(new Uint8Array(new Uint32Array([fileSize]).buffer), 22);
    header.set(new Uint8Array(new Uint16Array([fileNameBytes.length]).buffer), 26);
    header.set([0x00, 0x00], 28);
    header.set(fileNameBytes, 30);
    return header;
}

function createCentralDirectoryHeader(fileName, fileSize, crc32, offset) {
    const fileNameBytes = new TextEncoder().encode(fileName);
    const header = new Uint8Array(46 + fileNameBytes.length);
    header.set([0x50, 0x4B, 0x01, 0x02], 0);
    header.set([0x14, 0x00], 4);
    header.set([0x14, 0x00], 6);
    header.set([0x00, 0x00], 8);
    header.set([0x00, 0x00], 10);
    header.set([0x00, 0x00, 0x00, 0x00], 12);
    header.set(new Uint8Array(new Uint32Array([crc32]).buffer), 16);
    header.set(new Uint8Array(new Uint32Array([fileSize]).buffer), 20);
    header.set(new Uint8Array(new Uint32Array([fileSize]).buffer), 24);
    header.set(new Uint8Array(new Uint16Array([fileNameBytes.length]).buffer), 28);
    header.set([0x00, 0x00], 30);
    header.set([0x00, 0x00], 32);
    header.set([0x00, 0x00], 34);
    header.set([0x00, 0x00], 36);
    header.set([0x00, 0x00, 0x00, 0x00], 38);
    header.set(new Uint8Array(new Uint32Array([offset]).buffer), 42);
    header.set(fileNameBytes, 46);
    return header;
}

function createEndOfCentralDirectoryRecord(numFiles, centralDirSize, centralDirOffset) {
    const record = new Uint8Array(22);
    record.set([0x50, 0x4B, 0x05, 0x06], 0);
    record.set([0x00, 0x00], 4);
    record.set([0x00, 0x00], 6);
    record.set(new Uint8Array(new Uint16Array([numFiles]).buffer), 8);
    record.set(new Uint8Array(new Uint16Array([numFiles]).buffer), 10);
    record.set(new Uint8Array(new Uint32Array([centralDirSize]).buffer), 12);
    record.set(new Uint8Array(new Uint32Array([centralDirOffset]).buffer), 16);
    record.set([0x00, 0x00], 20);
    return record;
}

/**
 * 
 * @param {Array<{ data: Blob, title: string }>} files
 * @returns {Promise<Blob>}
 */
async function createZip(files) {
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;
    for (const file of files) {
        const arrayBuffer = await file.data.arrayBuffer();
        const content = new Uint8Array(arrayBuffer);
        const crc32 = calculateCRC32(content);
        const header = createLocalFileHeader(file.title, content.length, crc32);
        chunks.push(header);
        chunks.push(content);
        centralDirectory.push(createCentralDirectoryHeader(file.title, content.length, crc32, offset));
        offset += header.length + content.length;
    }
    const centralDirOffset = offset;
    for (const dir of centralDirectory) {
        chunks.push(dir);
        offset += dir.length;
    }
    const endRecord = createEndOfCentralDirectoryRecord(files.length, offset - centralDirOffset, centralDirOffset);
    chunks.push(endRecord);
    return new Blob(chunks);
}
