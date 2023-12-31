// / script.js
document.addEventListener('DOMContentLoaded', function () {
    
    for (let category in jewelleryData) {
        if (jewelleryData.hasOwnProperty(category)) {
            // Use the headers from the first item in the category array
            let headers = jewelleryData[category].length > 0 ? Object.keys(jewelleryData[category][0]) : [];
            generateTable(headers, jewelleryData[category], category);
        }
    }
     // Global search functionality
     let globalSearchInput = document.getElementById('globalSearch');
    globalSearchInput.addEventListener('keyup', function () {
        globalSearch(this.value.toLowerCase());
    });
    updateTotalRecordsCount();
     // Export buttons event listeners
     document.getElementById('exportToPdf').addEventListener('click', exportTableToPDF);
     document.getElementById('exportToExcel').addEventListener('click', exportTableToExcel);
     document.getElementById('importButton').addEventListener('click', function() {
        var fileInput = document.getElementById('importFromExcel');
        var file = fileInput.files[0];
        importDataFromExcel(file);
    });
});
function importDataFromExcel(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, {type: 'array'});

        var sheetName = workbook.SheetNames[0];
        var sheet = workbook.Sheets[sheetName];
        var jsonData = XLSX.utils.sheet_to_json(sheet);

        // Clear existing data
        document.getElementById('tableContainer').innerHTML = '';

        // Assuming the JSON data will be an array of objects, where the keys are the column headers
        if(jsonData.length > 0) {
            var headers = Object.keys(jsonData[0]);
            generateTable(headers, jsonData);
        }
    };

    if(file) {
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please select a file to import.');
    }
}

function generateTable(headers, data) {
    let tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = ''; // Clear any existing table

    let table = document.createElement('table');
    table.className = 'dataTable';
    let thead = table.createTHead();
    let tbody = table.createTBody();

    // Generate header row
    let headerRow = thead.insertRow();
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Populate data rows
    data.forEach(item => {
        let row = tbody.insertRow();
        headers.forEach(header => {
            let cell = row.insertCell();
            cell.textContent = item[header];
        });
    });

    tableContainer.appendChild(table);
    updateTotalRecordsCount(); // Update the total records count display
}
function updateTotalRecordsCount() {
    let totalRecords = 0;
    let tables = document.querySelectorAll('.dataTable');
    tables.forEach(table => {
        // Count only visible rows in tbody
        Array.from(table.tBodies).forEach(tbody => {
            totalRecords += Array.from(tbody.rows).filter(row => row.style.display !== "none").length;
        });
    });
    let recordsCountContainer = document.getElementById('recordsCountContainer');
    recordsCountContainer.textContent = `Total Records: ${totalRecords}`;
}

function globalSearch(searchTerm) {
    let tables = document.querySelectorAll('.dataTable');
    tables.forEach(table => {
        let rows = table.getElementsByTagName('tr');
        let headers = table.rows[1].cells; // Assuming second row has headers

        for (let i = 2; i < rows.length; i++) { // Start from 2 to skip header and filter rows
            let row = rows[i];
            let rowContainsSearchTerm = Array.from(row.cells).some(cell => {
                return cell.textContent.toLowerCase().includes(searchTerm);
            });

            row.style.display = rowContainsSearchTerm ? "" : "none";
        }

        updateNoDataMessage(table, searchTerm);
        updateTotalRecordsCount();
    });
}
function updateNoDataMessage(table, searchTerm) {
    let visibleRowsCount = Array.from(table.rows).slice(2).filter(row => row.style.display !== 'none').length;
    let noDataMessageId = 'noDataMessage_' + table.id;
    let noDataMessage = document.getElementById(noDataMessageId);

    if (visibleRowsCount === 0) {
        if (!noDataMessage) {
            noDataMessage = document.createElement('p');
            noDataMessage.id = noDataMessageId;
            noDataMessage.className = 'center-message';
            noDataMessage.textContent = 'No records found.';
            table.parentElement.appendChild(noDataMessage);
        } else {
            noDataMessage.style.display = '';
        }
    } else if (noDataMessage) {
        noDataMessage.style.display = 'none';
    }
}

let currentSortColumn = null;
let currentSortOrder = 'asc'; // or 'desc'

function generateTable(headers, categoryData, categoryName) {
    let tableContainer = document.getElementById('tableContainer');

    // Create a table and append it to the tableContainer
    let table = document.createElement('table');
    table.className = 'dataTable'; // Setting a class for potential styling
    table.id = 'dataTable' + (categoryName ? `_${categoryName}` : '');

    // Create the header of the table with filter inputs
    let thead = table.createTHead();
    let filterRow = thead.insertRow();
    headers.forEach(header => {
        let th = document.createElement('th');
        let input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Filter...';
        input.onkeyup = function () {
            filterTable(table, headers.indexOf(header));
        };
        th.appendChild(input);
        filterRow.appendChild(th);
    });

    let headerRow = thead.insertRow();
    headers.forEach(header => {
        let th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Create the body of the table
    let tbody = table.createTBody();
    categoryData.forEach(item => {
        let row = tbody.insertRow();
        headers.forEach(header => {
            let cell = row.insertCell();
            cell.textContent = item[header];
        });
    });

    // Optionally, create a title for the table
    // if (categoryName) {
    //     let title = document.createElement('h3');
    //     title.textContent = categoryName;
    //     tableContainer.appendChild(title);
    // }

    tableContainer.appendChild(table);
    if (categoryData.length === 0) {
        let noDataMessage = document.createElement('p');
        noDataMessage.className = 'center-message'; // Add class for styling
        noDataMessage.textContent = 'No records found.';
        tableContainer.appendChild(noDataMessage);
    } else {
        tableContainer.appendChild(table);
    }
}


function filterTable(table, columnIndex) {
    let filter = table.getElementsByTagName('input')[columnIndex].value.toLowerCase();
    let rows = table.getElementsByTagName('tr');
    let visibleRowsCount = 0;
    for (let i = 2; i < rows.length; i++) { // Start from 2 to skip header and filter rows
        let cell = rows[i].getElementsByTagName('td')[columnIndex];
        if (cell) {
            let cellText = cell.textContent || cell.innerText;
            if (cellText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
                visibleRowsCount++;
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    // Display a message if no rows are visible
    let noDataMessage = document.getElementById('noDataMessage');
    if (visibleRowsCount === 0) {
        if (!noDataMessage) {
            noDataMessage = document.createElement('p');
            noDataMessage.id = 'noDataMessage';
            noDataMessage.className = 'center-message'; // Add class for styling
            noDataMessage.textContent = 'No records found.';
            table.parentElement.appendChild(noDataMessage);
        } else {
            noDataMessage.style.display = '';
        }
    } else if (noDataMessage) {
        noDataMessage.style.display = 'none';
    }
    updateTotalRecordsCount();
}

function sortTable(column) {
    let table = document.getElementById('dataTable');
    let rows = Array.from(table.rows).slice(2); // Skip filter and header rows
    let sortOrder = (column === currentSortColumn && currentSortOrder === 'asc') ? 'desc' : 'asc';

    rows.sort((a, b) => {
        let x = a.cells[column].textContent.trim();
        let y = b.cells[column].textContent.trim();
        return sortOrder === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
    });

    rows.forEach(row => table.appendChild(row));

    currentSortColumn = column;
    currentSortOrder = sortOrder;
 
}
function exportTableToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape', // Use landscape orientation
        unit: 'pt', // Points can allow for finer control
        format: 'a4', // You can try 'a3' for a larger format if necessary
    });

    doc.autoTable({
        html: document.querySelector('.dataTable'),
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // Add style as needed
        styles: {
            minCellHeight: 8,
            fontSize: 6, // Smaller font size
            cellWidth: 'wrap' // Wrap text to fit as much as possible
        },
        columnStyles: {
            0: { cellWidth: 30 }, // Adjust cell widths as necessary
            // ...other columns
        },
        didParseCell: function (data) {
            // Adjust cell size dynamically if necessary
        },
        margin: { top: 20, right: 10, bottom: 20, left: 10 },
        startY: 10,
    });

    // Save the created PDF
    doc.save('table-data.pdf');
}



// Function to export table to Excel
function exportTableToExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(document.querySelector('.dataTable'));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Trigger a download
    XLSX.writeFile(workbook, 'table-data.xlsx');
}
