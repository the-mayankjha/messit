const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Final_VIT-AP_APRIL_2026 Temporary Alternate Menu.xlsx');
const workbook = xlsx.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to json, raw data
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

fs.writeFileSync('/tmp/menu_dump.json', JSON.stringify(data, null, 2));
console.log('Dumped to /tmp/menu_dump.json');
