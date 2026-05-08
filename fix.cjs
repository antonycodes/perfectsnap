const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const idMap = {
  '1-%20Mu%E1%BB%99n%20R%E1%BB%93i%20M%C3%A0%20Sao%20C%C3%B2n.mp3': 'ygs4da7veeiwjjqpao1f.mp3',
  '2-Ph%C3%A9p%20M%C3%A0u.mp3': 'ss9teyeskavw8c7oyyid.mp3',
  '3-T%C3%A1i%20Sinh.mp3': 'jiqip3rmvibbkj46q255.mp3',
  '4-CH%E1%BA%A0Y%20NGAY%20%C4%90I.mp3': 'peaj39lfmllcpd2xbknf.mp3',
  '5-C%C3%B2n%20G%C3%AC%20%C4%90%E1%BA%B9p%20H%C6%A1n.mp3': 'npnplp1qkjmorjs2jdr2.mp3',
  '6-B%C3%ACnh%20Y%C3%AAn.mp3': 'qol6ljh260dotoodbswx.mp3',
  '7-Thi%E1%BB%87p%20H%E1%BB%93ng%20Sai%20T%C3%AAn.mp3': 'ejwhcw3iebmwntg0lylw.mp3',
  '8-B%E1%BA%A7u%20Tr%E1%BB%9Di%20M%E1%BB%9Bi.mp3': 'gjuvrbd3e3ao8eegprj6.mp3',
  '9-Th%C3%A1ng%20T%C6%B0%20L%C3%A0%20L%E1%BB%9Di%20N%C3%B3i%20D%E1%BB%91i%20C%E1%BB%A7a%20Em.mp3': 'bjkveztxgszadynzfdyd.mp3',
  '10-Exit%20Sign.mp3': 'yxzh4frhstbabzgqdgco.mp3',
  '11-Gi%C3%A1%20Nh%C6%B0.mp3': 'oji4dbyaqwltxojg0jbi.mp3',
  '12-V%C3%AC%20Anh%20%C4%90%C3%A2u%20C%C3%B3%20Bi%E1%BA%BFt.mp3': 'jo045vexhculbb3bfdch.mp3',
  '13-M%E1%BB%99t%20V%C3%B2ng%20Vi%E1%BB%87t%20Nam.mp3': 'qnqbsnon7byir3mwrkxb.mp3',
  '14-H%C3%A3y%20Trao%20Cho%20Anh.mp3': 'jy0jy7pyefwb39m9gttd.mp3',
  '15-Waiting%20For%20You.mp3': 'qiufvohqlgpaysas7hog.mp3',
  '16-n%E1%BA%BFu%20l%C3%BAc%20%C4%91%C3%B3.mp3': 'ssxpmomcnodjjafhh8mb.mp3',
  '17-M%E1%BA%A5t%20K%E1%BA%BFt%20N%E1%BB%91i.mp3': 'did9sb7r5ceor4zv82wf.mp3',
  '18-Kho%20B%C3%A1u.mp3': 'brlesnlgzjv2n2wvalde.mp3',
  '19-%C4%90i%20Gi%E1%BB%AFa%20Tr%E1%BB%9Di%20R%E1%BB%B1c%20R%E1%BB%A1.mp3': 'sj0k5ybbyppwqhiq9iq7.mp3',
  '20-Ng%C6%B0%E1%BB%9Di%20%C4%90%E1%BA%A7u%20Ti%C3%AAn.mp3': 'f4zd1te2qcfu27wwwqug.mp3'
};

for (const [key, value] of Object.entries(idMap)) {
  code = code.replace(`v1/Danh%20sa%CC%81ch%20nha%CC%A3c%20va%CC%80%20tu%CC%80%20khoa%CC%81%20cho%20BOSE/Nha%CC%A3c%20game%20BOSE/${key}`, value);
}

code = code.replace('const SESSION_TIME_LIMIT = 600;', 'const SESSION_TIME_LIMIT = 180;');
code = code.replace('const SONGS_PER_SESSION = 20;', 'const SONGS_PER_SESSION = 5;');

fs.writeFileSync('src/App.tsx', code);
