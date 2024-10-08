/**
 * Asynchronously creates a ZIP file from an array of files.
 * @param {Array<{ data: Blob, title: string }>} files - Array of files to be included in the ZIP.
 *   Each file should have a 'data' property containing a Blob object representing file content,
 *   and a 'title' property containing the filename.
 * @returns {Promise<Blob>} A Promise that resolves to a Blob representing the created ZIP file.
 */
async function createZip(files) {
    const crc32Table = createCRC32Table();
    const localFileHeaders = [];
    const centralDirectoryHeaders = [];
    const fileContents = [];
    let offset = 0;

    // Prepare all files asynchronously
    await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.data.arrayBuffer();
        const contentArray = new Uint8Array(arrayBuffer);

        const crc32 = calculateCRC32(contentArray, crc32Table);
        const filename = file.title;

        // Local file header
        const localFileHeader = createLocalFileHeader(filename, crc32, contentArray.length);
        localFileHeaders.push(localFileHeader);

        // Central directory file header
        const centralFileHeader = createCentralFileHeader(filename, crc32, contentArray.length, offset);
        centralDirectoryHeaders.push(centralFileHeader);

        // File content
        fileContents.push(contentArray);

        // Update offset for the next file
        offset += localFileHeader.length + contentArray.length;
    }));

    // Create end of central directory record
    const endOfCentralDirRecord = createEndOfCentralDirRecord(files.length, centralDirectoryHeaders, offset);

    // Calculate total size of the ZIP file
    const zipSize = localFileHeaders.reduce((sum, header) => sum + header.length, 0) +
        fileContents.reduce((sum, content) => sum + content.length, 0) +
        centralDirectoryHeaders.reduce((sum, header) => sum + header.length, 0) +
        endOfCentralDirRecord.length;

    // Create Uint8Array for the ZIP file contents
    const zipFileContents = new Uint8Array(zipSize);
    let currentOffset = 0;

    // Fill the Uint8Array with headers and contents
    localFileHeaders.forEach((header, i) => {
        zipFileContents.set(header, currentOffset);
        currentOffset += header.length;
        zipFileContents.set(fileContents[i], currentOffset);
        currentOffset += fileContents[i].length;
    });

    centralDirectoryHeaders.forEach((header) => {
        zipFileContents.set(header, currentOffset);
        currentOffset += header.length;
    });

    zipFileContents.set(endOfCentralDirRecord, currentOffset);

    // Create Blob from Uint8Array and return
    return new Blob([zipFileContents], { type: 'application/zip' });
}

function createLocalFileHeader(filename, crc32, compressedSize) {
    const localFileHeaderSignature = [0x50, 0x4B, 0x03, 0x04];
    const versionNeededToExtract = [0x14, 0x00];
    const generalPurposeBitFlag = [0x00, 0x00];
    const compressionMethod = [0x00, 0x00];
    const lastModFileTime = [0x00, 0x00];
    const lastModFileDate = [0x00, 0x00];
    const crc32Bytes = intToBytes(crc32, 4);
    const compressedSizeBytes = intToBytes(compressedSize, 4);
    const uncompressedSizeBytes = compressedSizeBytes;
    const filenameBytes = new TextEncoder().encode(filename);
    const fileNameLength = [filenameBytes.length, 0x00];
    const extraFieldLength = [0x00, 0x00];

    return new Uint8Array([
        ...localFileHeaderSignature,
        ...versionNeededToExtract,
        ...generalPurposeBitFlag,
        ...compressionMethod,
        ...lastModFileTime,
        ...lastModFileDate,
        ...crc32Bytes,
        ...compressedSizeBytes,
        ...uncompressedSizeBytes,
        ...fileNameLength,
        ...extraFieldLength,
        ...filenameBytes
    ]);
}

function createCentralFileHeader(filename, crc32, compressedSize, offset) {
    const centralFileHeaderSignature = [0x50, 0x4B, 0x01, 0x02];
    const versionMadeBy = [0x14, 0x00];
    const versionNeededToExtract = [0x14, 0x00];
    const generalPurposeBitFlag = [0x00, 0x00];
    const compressionMethod = [0x00, 0x00];
    const lastModFileTime = [0x00, 0x00];
    const lastModFileDate = [0x00, 0x00];
    const crc32Bytes = intToBytes(crc32, 4);
    const compressedSizeBytes = intToBytes(compressedSize, 4);
    const uncompressedSizeBytes = compressedSizeBytes;
    const filenameBytes = new TextEncoder().encode(filename);
    const fileNameLength = [filenameBytes.length, 0x00];
    const extraFieldLength = [0x00, 0x00];
    const fileCommentLength = [0x00, 0x00];
    const diskNumberStart = [0x00, 0x00];
    const internalFileAttributes = [0x00, 0x00];
    const externalFileAttributes = [0x00, 0x00, 0x00, 0x00];
    const relativeOffsetOfLocalHeader = intToBytes(offset, 4);

    return new Uint8Array([
        ...centralFileHeaderSignature,
        ...versionMadeBy,
        ...versionNeededToExtract,
        ...generalPurposeBitFlag,
        ...compressionMethod,
        ...lastModFileTime,
        ...lastModFileDate,
        ...crc32Bytes,
        ...compressedSizeBytes,
        ...uncompressedSizeBytes,
        ...fileNameLength,
        ...extraFieldLength,
        ...fileCommentLength,
        ...diskNumberStart,
        ...internalFileAttributes,
        ...externalFileAttributes,
        ...relativeOffsetOfLocalHeader,
        ...filenameBytes
    ]);
}

function createEndOfCentralDirRecord(numFiles, centralDirectoryHeaders, offset) {
    const endOfCentralDirSignature = [0x50, 0x4B, 0x05, 0x06];
    const numberOfThisDisk = [0x00, 0x00];
    const numberOfDiskWithStartOfCentralDirectory = [0x00, 0x00];
    const totalNumberOfEntriesOnThisDisk = intToBytes(numFiles, 2);
    const totalNumberOfEntries = intToBytes(numFiles, 2);
    const sizeOfCentralDirectory = intToBytes(centralDirectoryHeaders.reduce((sum, header) => sum + header.length, 0), 4);
    const offsetOfStartOfCentralDirectory = intToBytes(offset, 4);
    const zipFileCommentLength = [0x00, 0x00];

    return new Uint8Array([
        ...endOfCentralDirSignature,
        ...numberOfThisDisk,
        ...numberOfDiskWithStartOfCentralDirectory,
        ...totalNumberOfEntriesOnThisDisk,
        ...totalNumberOfEntries,
        ...sizeOfCentralDirectory,
        ...offsetOfStartOfCentralDirectory,
        ...zipFileCommentLength
    ]);
}

function createCRC32Table() {
    const crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crc32Table[i] = c;
    }
    return crc32Table;
}

function calculateCRC32(array, crc32Table) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < array.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ array[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

function intToBytes(num, byteSize) {
    const bytes = [];
    for (let i = 0; i < byteSize; i++) {
        bytes.push(num & 0xFF);
        num >>= 8;
    }
    return bytes;
}
