const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update SongInfo interface
code = code.replace(
  /audioUrl\?: string;\s+sourceUrl\?: string;\s+keyword: string;/g,
  `audioUrl?: string;
  sourceUrl?: string;
  public_id?: string;
  originalTargetStart?: number;
  originalTargetEnd?: number;
  keyword: string;`
);

// 2. Update PRESETS
code = code.replace(/audioUrl: 'https:\/\/res\.cloudinary\.com\/antony12\/video\/upload\/so_([\d.]+),eo_[\d.]+\/([^']+)\.mp3',\s*targetStart: [\d.]+,\s*targetEnd: ([\d.]+),([\s\S]*?)keywordTimestamp: [\d.]+/g, (match, soStr, public_id, targetEndStr, middle) => {
  const so = parseFloat(soStr);
  const originalTargetStart = so + 15;
  const originalTargetEnd = originalTargetStart + 1; // Since all original durations were 1s
  
  return `public_id: '${public_id}',
    originalTargetStart: ${originalTargetStart},
    originalTargetEnd: ${originalTargetEnd},
    targetStart: 15.0,
    targetEnd: 16.0,${middle}keywordTimestamp: 15.0`;
});

// 3. Update startSession
const newStartSession = `const shuffled = shuffleArray(PRESETS).slice(0, SONGS_PER_SESSION).map(song => {
      const R = Math.floor(Math.random() * (24 - 12 + 1)) + 12;
      const duration = song.originalTargetEnd - song.originalTargetStart;
      const so = Math.max(0, song.originalTargetStart - R);
      return {
        ...song,
        targetStart: R,
        targetEnd: R + duration,
        keywordTimestamp: R,
        audioUrl: \`https://res.cloudinary.com/antony12/video/upload/so_\${so},du_30.0/e_fade:2000/e_fade:-2000/\${song.public_id}.mp3\`
      };
    });`;
    
code = code.replace(/const shuffled = shuffleArray\(PRESETS\)\.slice\(0, SONGS_PER_SESSION\);/g, newStartSession);

// 4. Update viewDuration
code = code.replace(/useState<number>\(31\); \/\/ Fixed 31s chorus/g, 'useState<number>(30); // Fixed 30s chorus');

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx with randomness and fade");
