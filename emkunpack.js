// emkunpack.js
const fs = require('fs');
const zlib = require('zlib');

function processFile(filePath) {
  const data = fs.readFileSync(filePath);
  const xorKey = Buffer.from('AFF24C9CE9EA9943', 'hex');
  for (let i = 0; i < data.length; i++) {
    data[i] ^= xorKey[i % xorKey.length];
  }

  const magic = Buffer.from('2e53464453', 'hex');
  if (!data.slice(0, magic.length).equals(magic)) {
    throw new Error('Invalid magic');
  }

  const headerPos = Number(data.readBigUInt64LE(0x22));
  const headerEnd = Number(data.readBigUInt64LE(0x2a));

  const header = data.slice(headerPos, headerEnd);
  let off = 0;
  const skipBytes = (n) => (off += n);
  const readByte = () => header[off++];
  const readUShort = () => {
    const v = header.readUInt16LE(off);
    off += 2;
    return v;
  };
  const readUInt = () => {
    const v = header.readUInt32LE(off);
    off += 4;
    return v;
  };
  const readString = () => {
    const len = readByte();
    const str = header.slice(off, off + len).toString('utf8');
    off += len;
    return str;
  };
  const checkMagic = (magic) => {
    const data = header.slice(off, off + magic.length);
    if (!data.equals(magic)) {
      throw new Error('Invalid magic: ' + data.toString('hex') + ' != ' + magic.toString('hex'));
    }
    off += magic.length;
  };

  const readTag = () => {
    const tag = readByte();
    switch (tag) {
      case 2: {
        const v = readByte();
        return { tag: 'BYTE', value: v };
      }
      case 3: {
        const v = readUShort();
        return { tag: 'USHORT', value: v };
      }
      case 4: {
        const v = readUInt();
        return { tag: 'UINT', value: v };
      }
      case 6: {
        const v = readString();
        return { tag: 'STRING', value: v };
      }
      default:
        throw new Error('Unknown tag: 0x' + tag.toString(16));
    }
  };

  const magicTag = Buffer.from('53464453', 'hex'); // SFDS
  const files = [];
  while (off < header.length) {
    checkMagic(magicTag);
    const tag = readTag().value;
    const uncompressedSize = readTag().value;
    const unk2 = readTag().value;
    const dataBegin = readTag().value;
    const dataEnd = readTag().value;
    const unk5 = readTag().value; 
    const unk6 = readTag().value;
    skipBytes(0x10);
    const unk7 = readTag().value;
    const unk8 = readTag().value;

    const compressedData = data.slice(dataBegin, dataEnd);

    const rawData = zlib.inflateSync(compressedData, { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    if (rawData.length !== uncompressedSize) {
      throw new Error('Invalid uncompressed size');
    }

    const ext = {
      'HEADER': 'txt',
      'MIDI_DATA': 'mid',
      'LYRIC_DATA': 'txt',
      'CURSOR_DATA': 'bin',
    };

    const filename = tag + '.' + (ext[tag] || 'bin');
    fs.writeFileSync(filename, rawData);
    files.push(filename);
  }
  return files;
}

module.exports = processFile;