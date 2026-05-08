const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/audioUrl: 'https:\/\/res\.cloudinary\.com\/antony12\/video\/upload\/([^']+)',\s*targetStart: ([\d.]+),\s*targetEnd: ([\d.]+),([\s\S]*?)keywordTimestamp: [\d.]+/g, (match, public_id, targetStartStr, targetEndStr, middle) => {
  const targetStart = parseFloat(targetStartStr);
  const targetEnd = parseFloat(targetEndStr);
  const so = targetStart - 15;
  const eo = targetEnd + 15;
  const newTargetStart = 15.0;
  const newTargetEnd = newTargetStart + (targetEnd - targetStart);
  
  return `audioUrl: 'https://res.cloudinary.com/antony12/video/upload/so_${so},eo_${eo}/${public_id}',
    targetStart: ${newTargetStart},
    targetEnd: ${newTargetEnd},${middle}keywordTimestamp: ${newTargetStart}`;
});

code = code.replace('useState<number>(30); // Fixed 30s chorus', 'useState<number>(31); // Fixed 31s chorus');

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx");
