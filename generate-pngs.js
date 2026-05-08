const zlib = require('zlib');
const fs = require('fs');

function createPNG(w, h, r, g, b) {
    function crc32(data) {
        const table = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            table[n] = c >>> 0;
        }
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    function chunk(ctype, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const type = Buffer.from(ctype);
        const crcData = Buffer.concat([type, data]);
        const crcVal = Buffer.alloc(4);
        crcVal.writeUInt32BE(crc32(crcData), 0);
        return Buffer.concat([len, type, data, crcVal]);
    }
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    let raw = Buffer.alloc((w * 3 + 1) * h);
    for (let y = 0; y < h; y++) {
        raw[y * (w * 3 + 1)] = 0;
        for (let x = 0; x < w; x++) {
            raw[y * (w * 3 + 1) + 1 + x * 3] = r;
            raw[y * (w * 3 + 1) + 1 + x * 3 + 1] = g;
            raw[y * (w * 3 + 1) + 1 + x * 3 + 2] = b;
        }
    }
    const compressed = zlib.deflateSync(raw, { level: 9 });
    const idat = chunk('IDAT', compressed);
    const iend = chunk('IEND', Buffer.alloc(0));
    return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

// Create each file
const files = [
    { name: 'icon-search.png', w: 24, h: 24, r: 136, g: 136, b: 136 },
    { name: 'home-promo.png', w: 375, h: 150, r: 244, g: 162, b: 97 },
    { name: 'banner-escort.png', w: 375, h: 200, r: 233, g: 30, b: 99 },
    { name: 'banner-nursing.png', w: 375, h: 200, r: 74, g: 144, b: 217 },
    { name: 'banner-mail.png', w: 375, h: 200, r: 231, g: 76, b: 60 },
    { name: 'banner-meal-delivery.png', w: 375, h: 200, r: 243, g: 156, b: 18 },
    { name: 'banner-repair.png', w: 375, h: 200, r: 39, g: 174, b: 96 },
    { name: 'banner-cleaning.png', w: 375, h: 200, r: 22, g: 160, b: 133 },
    { name: 'banner-cooking.png', w: 375, h: 200, r: 255, g: 112, b: 67 },
    { name: 'banner-delivery.png', w: 375, h: 200, r: 142, g: 68, b: 173 },
    { name: 'ai-default-avatar.png', w: 80, h: 80, r: 66, g: 185, b: 131 },
];

// Ensure directory exists
const dir = 'd:/cherrystudio/yyousn/images/';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

files.forEach(f => {
    const png = createPNG(f.w, f.h, f.r, f.g, f.b);
    fs.writeFileSync(dir + f.name, png);
    console.log('Created: ' + f.name + ' (' + png.length + ' bytes)');
});

console.log('\nAll PNG files created successfully!');
