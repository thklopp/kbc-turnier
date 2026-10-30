const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- QR CODE GENERATOR (Standalone Kazuhiko Arase QR Model) ---
function QR8bitByte(data) {
  this.mode = 4;
  this.data = data;
}
QR8bitByte.prototype = {
  getLength: function() { return this.data.length; },
  write: function(buffer) {
    for (var i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }
  }
};

var QRMath = {
  glog: function(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp: function(n) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};
for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (var i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

function QRPolynomial(num, shift) {
  var offset = 0;
  while (offset < num.length && num[offset] == 0) offset++;
  this.num = new Array(num.length - offset + shift);
  for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  for (var i = 0; i < shift; i++) this.num[this.num.length - shift + i] = 0;
}
QRPolynomial.prototype = {
  get: function(index) { return this.num[index]; },
  getLength: function() { return this.num.length; },
  multiply: function(e) {
    var num = new Array(this.getLength() + e.getLength() - 1);
    for (var i = 0; i < this.getLength(); i++) {
      for (var j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  },
  mod: function(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    var num = new Array(this.getLength());
    for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (var i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    return new QRPolynomial(num, 0).mod(e);
  }
};

function QRRSBlock(totalCount, dataCount) {
  this.totalCount = totalCount;
  this.dataCount = dataCount;
}
QRRSBlock.RS_BLOCK_TABLE = [
  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9]
];
QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
  var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
  var length = rsBlock.length / 3;
  var list = [];
  for (var i = 0; i < length; i++) {
    var count = rsBlock[i * 3 + 0];
    var totalCount = rsBlock[i * 3 + 1];
    var dataCount = rsBlock[i * 3 + 2];
    for (var j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
  }
  return list;
};
QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
  switch (errorCorrectLevel) {
    case 1: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
    case 0: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
    case 3: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
    case 2: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
  }
};

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}
QRBitBuffer.prototype = {
  get: function(index) {
    var bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
  },
  put: function(num, length) {
    for (var i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) == 1);
    }
  },
  getLengthInBits: function() { return this.length; },
  putBit: function(bit) {
    var bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
};

var QRUtil = {
  PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30]],
  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
  getBCHTypeInfo: function(data) {
    var d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },
  getBCHDigit: function(data) {
    var digit = 0;
    while (data != 0) { digit++; data >>>= 1; }
    return digit;
  },
  getMask: function(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 == 0;
      case 1: return i % 2 == 0;
      case 2: return j % 3 == 0;
      case 3: return (i + j) % 3 == 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) == 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0;
    }
  },
  getErrorCorrectPolynomial: function(errorCorrectLength) {
    var a = new QRPolynomial([1], 0);
    for (var i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits: function(mode, type) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case 1: return 10;
        case 2: return 9;
        case 4: return 8;
        case 8: return 8;
      }
    }
    return 8;
  },
  getLostPoint: function(qrCode) {
    var moduleCount = qrCode.getModuleCount();
    var lostPoint = 0;
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        var sameCount = 0;
        var dark = qrCode.isDark(row, col);
        for (var r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (var c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) continue;
            if (r == 0 && c == 0) continue;
            if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += (3 + sameCount - 5);
      }
    }
    return lostPoint;
  }
};

function QRCodeModel(typeNumber, errorCorrectLevel) {
  this.typeNumber = typeNumber;
  this.errorCorrectLevel = errorCorrectLevel;
  this.modules = null;
  this.moduleCount = 0;
  this.dataCache = null;
  this.dataList = [];
}
QRCodeModel.prototype = {
  addData: function(data) {
    this.dataList.push(new QR8bitByte(data));
    this.dataCache = null;
  },
  isDark: function(row, col) { return this.modules[row][col]; },
  getModuleCount: function() { return this.moduleCount; },
  make: function() { this.makeImpl(false, this.getBestMaskPattern()); },
  makeImpl: function(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (var row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (var col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = null;
      }
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) this.setupTypeNumber(test);
    if (this.dataCache == null) {
      this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  },
  setupPositionProbePattern: function(row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
            (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  },
  getBestMaskPattern: function() {
    var minLostPoint = 0;
    var pattern = 0;
    for (var i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      var lostPoint = QRUtil.getLostPoint(this);
      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  },
  setupTimingPattern: function() {
    for (var r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = (r % 2 == 0);
    }
    for (var c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = (c % 2 == 0);
    }
  },
  setupPositionAdjustPattern: function() {
    var pos = QRUtil.PATTERN_POSITION_TABLE[this.typeNumber - 1];
    if (!pos) return;
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i];
        var col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            if (Math.abs(r) == 2 || Math.abs(c) == 2 || (r == 0 && c == 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  },
  setupTypeInfo: function(test, maskPattern) {
    var data = (this.errorCorrectLevel << 3) | maskPattern;
    var bits = QRUtil.getBCHTypeInfo(data);
    for (var i = 0; i < 15; i++) {
      var mod = (!test && ((bits >> i) & 1) == 1);
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;

      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  },
  mapData: function(data, maskPattern) {
    var inc = -1;
    var row = this.moduleCount - 1;
    var bitIndex = 7;
    var byteIndex = 0;
    for (var col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            var dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
            }
            var mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
};

QRCodeModel.createData = function(typeNumber, errorCorrectLevel, dataList) {
  var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
  var buffer = new QRBitBuffer();
  for (var i = 0; i < dataList.length; i++) {
    var data = dataList[i];
    buffer.put(data.mode, 4);
    buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
    data.write(buffer);
  }
  var totalDataCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
  if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error("overflow");
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.getLengthInBits() % 8 != 0) buffer.putBit(false);
  while (true) {
    if (buffer.getLengthInBits() >= totalDataCount * 8) break;
    buffer.put(0xec, 8);
    if (buffer.getLengthInBits() >= totalDataCount * 8) break;
    buffer.put(0x11, 8);
  }
  return QRCodeModel.createBytes(buffer, rsBlocks);
};

QRCodeModel.createBytes = function(buffer, rsBlocks) {
  var offset = 0;
  var maxDcCount = 0;
  var maxEcCount = 0;
  var dcdata = new Array(rsBlocks.length);
  var ecdata = new Array(rsBlocks.length);
  for (var r = 0; r < rsBlocks.length; r++) {
    var dcCount = rsBlocks[r].dataCount;
    var ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);
    dcdata[r] = new Array(dcCount);
    for (var i = 0; i < dcdata[r].length; i++) {
      dcdata[r][i] = 0xff & buffer.buffer[i + offset];
    }
    offset += dcCount;
    var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
    var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
    var modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.getLength() - 1);
    for (var i = 0; i < ecdata[r].length; i++) {
      var modIndex = i + modPoly.getLength() - ecdata[r].length;
      ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
    }
  }
  var totalCodeCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
  var data = new Array(totalCodeCount);
  var index = 0;
  for (var i = 0; i < maxDcCount; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < dcdata[r].length) data[index++] = dcdata[r][i];
    }
  }
  for (var i = 0; i < maxEcCount; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < ecdata[r].length) data[index++] = ecdata[r][i];
    }
  }
  return data;
};

// --- PDF COMPOSITION ---
function generatePdf() {
  const logoWebpPath = path.resolve(__dirname, "../public/images/RRK.webp");
  const logoPngPath = "/tmp/rrk_logo_poster.png";
  try {
    execSync(`sips -s format png "${logoWebpPath}" --out "${logoPngPath}"`, { stdio: "ignore" });
  } catch (e) {
    console.warn("Could not convert logo:", e.message);
  }

  // QR Model for URL
  const qrUrl = "https://kbc.rrk08.club";
  const qr = new QRCodeModel(2, 0); // Type 2 (25x25 modules), EC Level M
  qr.addData(qrUrl);
  qr.make();
  const moduleCount = qr.getModuleCount();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Background (very light slate/gray)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Red Accent Line
  doc.setFillColor(204, 0, 0); // RRK Red #cc0000
  doc.rect(0, 0, pageWidth, 4, "F");

  // Header Banner: RRK Navy (#003366)
  const headerHeight = 58;
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 4, pageWidth, headerHeight, "F");

  // Subtle dynamic diagonal slash in header for sportiness
  doc.setFillColor(3, 64, 126);
  doc.triangle(0, 4, pageWidth, 4, pageWidth, 28, "F");

  // Logo in Header
  const logoWidth = 22;
  const logoHeight = 28.1;
  const logoX = 18;
  const logoY = 15;

  if (fs.existsSync(logoPngPath)) {
    const logoData = fs.readFileSync(logoPngPath).toString("base64");
    doc.addImage("data:image/png;base64," + logoData, "PNG", logoX, logoY, logoWidth, logoHeight);
  }

  // Header Typography
  const headerTextX = logoX + logoWidth + 9;

  // Subtitle / Club
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(186, 215, 253);
  doc.text("RÜSSELSHEIMER RUDER-KLUB 08 E.V. • HOCKEY", headerTextX, 20.5);

  // Tournament Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20.5);
  doc.setTextColor(255, 255, 255);
  doc.text("20. Kurt-Becker-Cup 2026", headerTextX, 29.5);

  // Subline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(224, 242, 254);
  doc.text("Das traditionelle Hallenhockey-Turnier der mU14 & wU14", headerTextX, 36);

  // Header Badges
  // Badge 1: Halle (Red)
  doc.setFillColor(204, 0, 0);
  doc.roundedRect(headerTextX, 41, 52, 6.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text("GROSSSPORTHALLE", headerTextX + 26, 45.4, { align: "center" });

  // Badge 2: Date (Dark Navy Blue Tint)
  doc.setFillColor(1, 38, 77);
  doc.roundedRect(headerTextX + 55, 41, 52, 6.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text("31. OKT & 1. NOV 2026", headerTextX + 55 + 26, 45.4, { align: "center" });


  // --- MAIN CALL TO ACTION ---
  let curY = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18.5);
  doc.setTextColor(0, 51, 102);
  doc.text("LIVE-SPIELPLAN & ERGEBNISSE", pageWidth / 2, curY, { align: "center" });

  curY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("QR-Code einfach mit der Smartphone-Kamera scannen:", pageWidth / 2, curY, { align: "center" });


  // --- CENTRAL CARD ---
  curY += 7;
  const cardWidth = 144;
  const cardHeight = 114;
  const cardX = (pageWidth - cardWidth) / 2;
  const cardY = curY;

  // Soft Card Shadow
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(cardX + 1.2, cardY + 1.5, cardWidth, cardHeight, 5, 5, "F");

  // Card Body
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, "FD");

  // "SCAN MICH" Pill Top Badge
  const badgeW = 36;
  const badgeH = 7.2;
  doc.setFillColor(204, 0, 0); // RRK Red
  doc.roundedRect((pageWidth - badgeW) / 2, cardY - (badgeH / 2), badgeW, badgeH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("SCAN MICH", pageWidth / 2, cardY - (badgeH / 2) + 5, { align: "center" });

  // Vector QR Code Drawing
  const qrSize = 72; // mm
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = cardY + 8.5;
  const modSize = qrSize / moduleCount;

  // Quiet Zone White Background
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX - 2.5, qrY - 2.5, qrSize + 5, qrSize + 5, "F");

  // Modules in RRK Navy Blue (#003366)
  doc.setFillColor(0, 51, 102);
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        doc.rect(qrX + c * modSize, qrY + r * modSize, modSize + 0.05, modSize + 0.05, "F");
      }
    }
  }

  // Red Corner Brackets (Focus Frame)
  const bSize = 6;
  const bDist = 4;
  doc.setDrawColor(204, 0, 0);
  doc.setLineWidth(1.3);

  // Top-left
  doc.line(qrX - bDist, qrY - bDist + bSize, qrX - bDist, qrY - bDist);
  doc.line(qrX - bDist, qrY - bDist, qrX - bDist + bSize, qrY - bDist);

  // Top-right
  doc.line(qrX + qrSize + bDist - bSize, qrY - bDist, qrX + qrSize + bDist, qrY - bDist);
  doc.line(qrX + qrSize + bDist, qrY - bDist, qrX + qrSize + bDist, qrY - bDist + bSize);

  // Bottom-left
  doc.line(qrX - bDist, qrY + qrSize + bDist - bSize, qrX - bDist, qrY + qrSize + bDist);
  doc.line(qrX - bDist, qrY + qrSize + bDist, qrX - bDist + bSize, qrY + qrSize + bDist);

  // Bottom-right
  doc.line(qrX + qrSize + bDist - bSize, qrY + qrSize + bDist, qrX + qrSize + bDist, qrY + qrSize + bDist);
  doc.line(qrX + qrSize + bDist, qrY + qrSize + bDist, qrX + qrSize + bDist, qrY + qrSize + bDist - bSize);

  // URL Box inside Card
  const urlBoxY = cardY + qrSize + 17;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX + 11, urlBoxY, cardWidth - 22, 10.5, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Direkt im Browser öffnen:", pageWidth / 2, urlBoxY + 3.8, { align: "center" });

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text("https://kbc.rrk08.club", pageWidth / 2, urlBoxY + 8.1, { align: "center" });


  // --- 4 FEATURE HIGHLIGHT BOXES ---
  const featY = cardY + cardHeight + 9;
  const featMargin = 18;
  const featGap = 8;
  const featColWidth = (pageWidth - 2 * featMargin - featGap) / 2;
  const featHeight = 21;

  const features = [
    {
      title: "Live-Spielstand & Ticker",
      desc: "Alle Tore, Zwischenstände und Spielzeiten sekundengenau.",
      badge: "LIVE",
      isRed: true
    },
    {
      title: "Tabellen & Platzierungen",
      desc: "Aktuelle Gruppenstände & Finalrunden stets auf einen Blick.",
      badge: "TABELLEN",
      isRed: false
    },
    {
      title: "Spielplan & Paarungen",
      desc: "Alle Spiele, Anstoßzeiten und Gegner beider Turniertage.",
      badge: "SPIELPLAN",
      isRed: false
    },
    {
      title: "Tagesplan & Halleninfos",
      desc: "Zeitablauf, Essensangebot & Orientierung in der Halle.",
      badge: "TAGESPLAN",
      isRed: true
    }
  ];

  features.forEach((feat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const fx = featMargin + col * (featColWidth + featGap);
    const fy = featY + row * (featHeight + 5);

    // Box Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(fx, fy, featColWidth, featHeight, 2.5, 2.5, "FD");

    // Left accent strip (Red if isRed, Navy Blue if not)
    doc.setFillColor(feat.isRed ? 204 : 0, feat.isRed ? 0 : 51, feat.isRed ? 0 : 102);
    doc.roundedRect(fx, fy, 2.5, featHeight, 1, 1, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(feat.title, fx + 6, fy + 6.8);

    // Badge dynamic width
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    const badgeTextW = doc.getTextWidth(feat.badge);
    const bW = badgeTextW + 6;
    const bH = 4.6;
    doc.setFillColor(feat.isRed ? 254 : 239, feat.isRed ? 226 : 246, feat.isRed ? 226 : 255);
    doc.roundedRect(fx + featColWidth - bW - 3.5, fy + 3.5, bW, bH, 1, 1, "F");
    doc.setTextColor(feat.isRed ? 204 : 0, feat.isRed ? 0 : 51, feat.isRed ? 0 : 102);
    doc.text(feat.badge, fx + featColWidth - 3.5 - (bW / 2), fy + 6.8, { align: "center" });

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(feat.desc, featColWidth - 11), fx + 6, fy + 13);
  });


  // --- FOOTER ---
  const footerY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(18, footerY, pageWidth - 18, footerY);

  // Club & Venue Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 51, 102);
  doc.text("Rüsselsheimer Ruder-Klub 08 e.V. • Hockeyabteilung", pageWidth / 2, footerY + 5.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Großsporthalle Rüsselsheim • Evreuxring 31, 65428 Rüsselsheim am Main", pageWidth / 2, footerY + 9.8, { align: "center" });

  // Red divider bar before dark bar
  doc.setFillColor(204, 0, 0);
  doc.rect(0, 285.2, pageWidth, 0.8, "F");

  // Bottom Banner (RRK Navy)
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 286, pageWidth, 11, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(224, 242, 254);
  doc.text("Offizielle Turnierwebseite: kbc.rrk08.club • Eintritt frei • Für Speisen und Getränke ist gesorgt", pageWidth / 2, 292.5, { align: "center" });

  // Output
  const outputDir = path.resolve(__dirname, "../pdf");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.resolve(outputDir, "Kurt-Becker-Cup_QR-Code.pdf");
  fs.writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
  console.log("PDF created successfully at:", outputPath);

  // Also convert to PNG for easy viewing
  const previewPngPath = path.resolve(outputDir, "Kurt-Becker-Cup_QR-Code.png");
  try {
    execSync(`sips -s format png "${outputPath}" --out "${previewPngPath}"`, { stdio: "ignore" });
    console.log("Preview PNG created at:", previewPngPath);
  } catch (e) {
    console.warn("Could not create PNG preview:", e.message);
  }
}

generatePdf();
