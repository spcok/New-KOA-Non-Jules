import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { Animal, DailyLog, User } from '../types/schema';

export const reportGenerator = {
  
  async generateWeeklyWeightsDoc(animals: Animal[], logs: DailyLog[], activeCategory: string) {
    const categoryAnimals = animals
      .filter(a => !a.is_deleted && !a.archived && (a.category || '').toUpperCase() === activeCategory)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffIso = sevenDaysAgo.toISOString();

    const recentLogs = logs.filter(l => !l.is_deleted && l.log_type === 'WEIGHT' && l.log_date >= cutoffIso);

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ children: [new Paragraph({ text: "House Name", alignment: AlignmentType.CENTER })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ text: "Species", alignment: AlignmentType.CENTER })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ text: "Last Recorded Weight", alignment: AlignmentType.CENTER })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ text: "Date Recorded", alignment: AlignmentType.CENTER })], shading: { fill: "E2E8F0" } }),
        ],
      }),
    ];

    categoryAnimals.forEach(animal => {
      const animalLogs = recentLogs.filter(l => l.animal_id === animal.id).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
      const latestLog = animalLogs[0];
      
      let weightText = "No record (7 Days)";
      let dateText = "--";

      if (latestLog) {
        if (latestLog.weight_not_required) weightText = "Omitted / Fast";
        else if (latestLog.weight_grams) weightText = `${latestLog.weight_grams}${latestLog.weight_unit || animal.weight_unit || 'g'}`;
        dateText = new Date(latestLog.log_date).toLocaleDateString('en-GB');
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: animal.name || 'Unnamed' })] }),
            new TableCell({ children: [new Paragraph({ text: animal.species || 'Unknown' })] }),
            new TableCell({ children: [new Paragraph({ text: weightText, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: dateText, alignment: AlignmentType.CENTER })] }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Weekly Weight Audit - ${activeCategory}`, bold: true, size: 32 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Generated: ${new Date().toLocaleString('en-GB')}`, italics: true })] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows, borders: this.getStandardBorders() })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `KOA_Weight_Audit_${activeCategory}_${new Date().toISOString().split('T')[0]}.docx`);
  },

  async generateHusbandryDoc(animals: Animal[], logs: DailyLog[], users: User[], activeCategory: string, startDate: string, endDate: string) {
    const categoryAnimalIds = new Set(
      animals.filter(a => !a.is_deleted && !a.archived && (a.category || '').toUpperCase() === activeCategory).map(a => a.id)
    );

    // Filter logs strictly between the dates, for the specific category
    const filteredLogs = logs
      .filter(l => 
        !l.is_deleted && 
        categoryAnimalIds.has(l.animal_id) &&
        l.log_date >= startDate && 
        l.log_date <= endDate + 'T23:59:59.999Z'
      )
      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date/Time", bold: true })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Animal", bold: true })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Type", bold: true })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Record Details", bold: true })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Staff", bold: true })] })], shading: { fill: "E2E8F0" } }),
        ],
      }),
    ];

    filteredLogs.forEach(log => {
      const animal = animals.find(a => a.id === log.animal_id);
      const user = users.find(u => u.id === log.created_by);
      const logDate = new Date(log.log_date);

      let recordDetails = log.notes || '--';
      
      // Parse JSONB feed details if they exist to keep the doc clean
      if (log.log_type === 'FEED' && log.feed_details && log.feed_details.length > 0) {
        const feedString = log.feed_details.map(f => `${f.quantity}x ${f.food_type}`).join(', ');
        recordDetails = `Fed: ${feedString}\n${recordDetails}`;
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: logDate.toLocaleDateString('en-GB') }), new Paragraph({ children: [new TextRun({ text: logDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ text: animal?.name || 'Unknown' }), new Paragraph({ children: [new TextRun({ text: animal?.species || '', size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ text: log.log_type })] }),
            new TableCell({ children: [new Paragraph({ text: recordDetails })] }),
            new TableCell({ children: [new Paragraph({ text: user?.initials || 'Sys' })] }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Husbandry Daily Logs - ${activeCategory}`, bold: true, size: 32 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Period: ${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}`, italics: true })] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows, borders: this.getStandardBorders() })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `KOA_Husbandry_Logs_${activeCategory}_${startDate}.docx`);
  },

  getStandardBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    };
  }
};