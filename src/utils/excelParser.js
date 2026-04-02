import * as xlsx from 'xlsx';

export const parseExcelMenu = async (file) => {
  return new Promise((resolve, reject) => {
    const defaultStructure = {};
    for (let i = 1; i <= 31; i++) {
      defaultStructure[i] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let currentDateMatches = [];

        rows.forEach(row => {
          if (!row || row.length === 0) return;

          const firstCol = String(row[0] || '').trim();
          
          // Extract all numbers from the first column if present
          const numbers = firstCol.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            currentDateMatches = numbers.map(Number);
          }

          if (currentDateMatches.length > 0) {
            const b = String(row[1] || '').trim();
            const l = String(row[2] || '').trim();
            const s = String(row[3] || '').trim();
            const d = String(row[4] || '').trim();

            currentDateMatches.forEach(date => {
              if (date >= 1 && date <= 31) {
                if (b && b !== 'Breakfast' && !defaultStructure[date].breakfast.includes(b)) defaultStructure[date].breakfast.push(b);
                if (l && l !== 'Lunch' && !defaultStructure[date].lunch.includes(l)) defaultStructure[date].lunch.push(l);
                if (s && s !== 'Snacks' && !defaultStructure[date].snacks.includes(s)) defaultStructure[date].snacks.push(s);
                if (d && d !== 'Dinner' && !defaultStructure[date].dinner.includes(d)) defaultStructure[date].dinner.push(d);
              }
            });
          }
        });

        resolve(defaultStructure);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
