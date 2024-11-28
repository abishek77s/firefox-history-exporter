const DEBUG = true;

// Debug logging utility
function debugLog(stage, message, data = null) {
    if (!DEBUG) return;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${stage}]:`, message);
    if (data) console.log('Data:', data);
}

// Utility to get today's start time
function getTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

// Convert data to CSV format
function convertToCSV(data) {
    if (!Array.isArray(data) || !data.length) {
        throw new Error('Invalid data format for CSV conversion');
    }

    const headers = ['DateTime', 'NavigatedToUrl', 'PageTitle'];
    const csvRows = [headers.join(',')];

    data.forEach(item => {
        const row = headers.map(header => {
            const value = item[header] || '';
            return String(value).replace(/[\r\n]/g, ''); // Remove line breaks
        });
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

// Trigger a file download
async function downloadData(content, filename) {
    const link = document.createElement('a');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });

    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

// Export browsing history
async function exportHistory(days) {
    try {
        debugLog('export', `Starting export for ${days} days in CSV format`);

        const endTime = Date.now();
        const startTime = 
            days === 'today' 
            ? getTodayStart() 
            : endTime - days * 24 * 60 * 60 * 1000;

        debugLog('search', `Searching history from ${new Date(startTime)} to ${new Date(endTime)}`);

        const history = await browser.history.search({
            text: '',
            startTime,
            endTime,
            maxResults: 10000,
        });

        if (!history.length) {
            alert('No history data found for the selected period.');
            return;
        }

        debugLog('process', `Processing ${history.length} history items`);

        const formattedHistory = history.map(item => ({
            DateTime: new Date(item.lastVisitTime).toISOString(),
            NavigatedToUrl: item.url || '',
            PageTitle: item.title || '',
        }));

        const content = convertToCSV(formattedHistory);
        const filename = `firefox_history_${days === 'today' ? 'today' : `${days}_days`}.csv`;

        debugLog('download', `Initiating download of ${filename}`);
        await downloadData(content, filename);
        debugLog('complete', 'Export completed successfully');
    } catch (error) {
        console.error('Error exporting history:', error);
        alert(`Failed to export history: ${error.message}`);
    }
}

// Add event listener to export button
document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.getElementById('exportHistory');
    const timeRangeSelect = document.getElementById('timeRange');

    exportButton.addEventListener('click', async () => {
        const selectedValue = timeRangeSelect.value;
        exportButton.disabled = true;
        try {
            await exportHistory(selectedValue === 'today' ? 'today' : parseInt(selectedValue, 10));
        } finally {
            exportButton.disabled = false;
        }
    });
});
