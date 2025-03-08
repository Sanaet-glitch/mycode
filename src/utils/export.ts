import { AttendanceRecord } from "@/types/attendance";

type MonthlyAttendanceData = {
  month: string;
  present: number;
  absent: number;
  total: number;
  attendanceRate: string;
};

/**
 * Utility functions for exporting data
 */

/**
 * Convert an array of objects to CSV format and download the file
 * @param data - Array of objects to export
 * @param filename - Name of the file to download (without extension)
 * @param delimiter - CSV delimiter (default: comma)
 */
export const exportToCSV = (
  data: Record<string, any>[],
  filename = "export",
  delimiter = ","
): void => {
  if (!data || !data.length) {
    console.warn("No data provided for export");
    return;
  }

  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(delimiter),
      ...data.map(row => 
        headers.map(header => {
          // Handle different data types and escape values with quotes if needed
          const cell = row[header] === null || row[header] === undefined ? "" : row[header];
          const cellStr = String(cell);
          // Escape quotes and add quotes around cells containing delimiters, newlines, or quotes
          if (cellStr.includes(delimiter) || cellStr.includes("\n") || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(delimiter)
      )
    ].join("\n");
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
    
    return;
  } catch (error) {
    console.error("Error creating CSV export:", error);
    throw error;
  }
};

/**
 * Helper function to download a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  // For browsers that support the download attribute
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export data to JSON file
 * @param data - Data to export
 * @param filename - Name of the file to download (without extension)
 */
export const exportToJSON = (data: any, filename = "export"): void => {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `${filename}.json`);
  } catch (error) {
    console.error("Error creating JSON export:", error);
    throw error;
  }
};

/**
 * Export HTML table to PDF (basic implementation)
 * Note: For a complete PDF solution, you may want to use a library like jsPDF
 * @param tableId - ID of the HTML table element to export
 * @param filename - Name of the file to download (without extension)
 */
export const printTableToPDF = (tableId: string, filename = "export"): void => {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`Table with ID "${tableId}" not found`);
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error("Failed to open print window. Pop-up might be blocked.");
    return;
  }

  // Write HTML content
  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${table.outerHTML}
      </body>
    </html>
  `);

  // Wait for content to load then print
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    // printWindow.close(); // Uncomment to close after print dialog
  };
};