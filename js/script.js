const STORAGE_KEY = 'weld_invoice_items';
const STORAGE_ADV = 'weld_invoice_advance';
const itemForm = document.getElementById('itemForm');
const itemNameInput = document.getElementById('itemName');
const itemRateInput = document.getElementById('itemRate');
const itemQtyInput = document.getElementById('itemQty');
const invoiceTableBody = document.querySelector('#invoiceTable tbody');
const grandTotalEl = document.getElementById('grandTotal');
const advanceInput = document.getElementById('advance');
const balanceEl = document.getElementById('balance');
let items = [];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    items = raw ? JSON.parse(raw) : [];
  } catch (e) {
    items = [];
  }
  const adv = localStorage.getItem(STORAGE_ADV);
  if (adv !== null) advanceInput.value = Number(adv);
  renderTable();
  updateTotals();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(STORAGE_ADV, Number(advanceInput.value || 0));
}

function formatCurrency(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function renderTable() {
  invoiceTableBody.innerHTML = '';
  items.forEach((it, idx) => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = it.name;
    tr.appendChild(tdName);

    const tdRate = document.createElement('td');
    tdRate.textContent = `₹${formatCurrency(it.rate)}`;
    tr.appendChild(tdRate);

    const tdQty = document.createElement('td');
    tdQty.textContent = it.qty;
    tr.appendChild(tdQty);

    const tdTotal = document.createElement('td');
    tdTotal.textContent = `₹${formatCurrency(it.total)}`;
    tr.appendChild(tdTotal);

    const tdAction = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      deleteItem(idx);
    });
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    invoiceTableBody.appendChild(tr);
  });
}

function updateTotals() {
  const grand = items.reduce((s, it) => s + Number(it.total), 0);
  grandTotalEl.textContent = formatCurrency(grand);
  const advance = Number(advanceInput.value || 0);
  const balance = grand - advance;
  balanceEl.textContent = formatCurrency(balance >= 0 ? balance : 0);
  saveData();
}

function printInvoice() {
  // If no items, show a brief non-blocking message and do nothing
  if (items.length === 0) {
    showMessage('Please add items to the bill before printing');
    return;
  }

  // If customer name missing, auto-fill with a default so printing continues without alert
  let customerName = document.getElementById('customerName').value;
  if (!customerName) {
    customerName = 'Walk-in Customer';
    document.getElementById('customerName').value = customerName;
  }

    const invoiceNo = 'INV-' + new Date().getTime().toString().slice(-6);
    const dateStr = new Date().toLocaleString('en-IN');
    const totalAmount = items.reduce((sum, it) => sum + Number(it.total), 0);
    const advancePaid = Number(advanceInput.value || 0);
    const balanceAmount = Math.max(0, totalAmount - advancePaid);
    // Store only sanitized bill data (no HTML or large blobs)
    const bills = JSON.parse(localStorage.getItem('weld_bills') || '[]');
    const sanitizedBill = {
        invoiceNo,
        date: new Date().toISOString(),
        customerName,
        items: Array.isArray(items) ? items.map(it => ({
            name: it.name || '',
            rate: Number(it.rate || 0),
            qty: Number(it.qty || 0),
            total: Number(it.total || 0)
        })) : [],
        grandTotal: Number(totalAmount || 0),
        advance: Number(advancePaid || 0),
        balance: Number(balanceAmount || 0)
    };
    bills.push(sanitizedBill);
    localStorage.setItem('weld_bills', JSON.stringify(bills));

  // Open a temporary print window (user won't see the separate print.html)
  const printWindow = window.open('', '_blank');
  const itemsHtml = sanitizedBill.items.map((it, i) => `
        <tr>
          <td style="text-align:left;padding:8px;border:1px solid #ddd">${i + 1}. ${it.name}</td>
          <td style="text-align:right;padding:8px;border:1px solid #ddd">₹${formatCurrency(it.rate)}</td>
          <td style="text-align:center;padding:8px;border:1px solid #ddd">${it.qty}</td>
          <td style="text-align:right;padding:8px;border:1px solid #ddd">₹${formatCurrency(it.total)}</td>
        </tr>
    `).join('');

  const printHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#333;margin:0;padding:20px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#2b6cb0;color:#fff;padding:12px;border:1px solid #1a4971}
      td{padding:8px;border:1px solid #ddd}
      .bill-header{background:#2b6cb0;color:#fff;padding:20px;border-radius:6px;text-align:center}
      .summary{margin-top:20px;padding:15px;background:#f8fafc;border-radius:6px;text-align:right}
    </style>
  </head><body>
    <div class="bill-header"><h1>AMMAN WELDING WORKS</h1><div>20, Arch Main Road, Velankanni, Nagapattinam(dt)</div><div>Mobile: 8973894307</div></div>
    <div style="margin:20px 0;padding:15px;background:#f8fafc;border-radius:6px;"><p><strong>Customer:</strong> ${sanitizedBill.customerName}</p><p><strong>Invoice:</strong> ${sanitizedBill.invoiceNo}</p><p><strong>Date:</strong> ${new Date(sanitizedBill.date).toLocaleString('en-IN')}</p></div>
    <table>
      <thead>
        <tr><th style="text-align:left">Item</th><th style="text-align:right">Rate</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div class="summary"><p style="font-weight:700;color:#2b6cb0">Grand Total: ₹${formatCurrency(sanitizedBill.grandTotal)}</p><p>Advance: ₹${formatCurrency(sanitizedBill.advance)}</p><p><strong>Balance: ₹${formatCurrency(sanitizedBill.balance)}</strong></p></div>
  </body></html>`;

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();

  // When print dialog finishes, close print window and clear the form in opener
  // Function to reset the form
  function resetForm() {
    items = [];
    saveData();
    renderTable();
    updateTotals();
    
    // Reset all form fields
    const advEl = document.getElementById('advance');
    if (advEl) advEl.value = '0';
    
    const custEl = document.getElementById('customerName');
    if (custEl) {
      custEl.value = '';
      custEl.focus();
    }
    
    const itemNameEl = document.getElementById('itemName');
    if (itemNameEl) itemNameEl.value = '';
    
    const itemRateEl = document.getElementById('itemRate');
    if (itemRateEl) itemRateEl.value = '';
    
    const itemQtyEl = document.getElementById('itemQty');
    if (itemQtyEl) itemQtyEl.value = '';
    
    showMessage('Bill printed successfully. Form cleared for new entry', 2000);
  }

  printWindow.onload = function () {
    printWindow.focus();
    // give time for fonts/styles to render
    setTimeout(() => {
      try {
        printWindow.print();
        // Set flag to clear form when returning to page
        setPrintComplete();
      } catch (e) {
        console.warn('print failed', e);
        showMessage('Print failed. Please try again.', 3000);
      }
      printWindow.onafterprint = function () {
        try { 
          printWindow.close();
          // Set flag to clear form when returning to page
          setPrintComplete();
        } catch (e) { /* ignore */ }
      };
    }, 300);
  };
}

  // show a transient inline message instead of alert()
  function showMessage(text, ms = 3000) {
    try {
      const el = document.getElementById('message');
      if (!el) {
        console.warn('message element not found:', text);
        return;
      }
      el.textContent = text;
      el.style.display = 'block';
      el.classList.add('inline-message');
      clearTimeout(el._hideTimer);
      el._hideTimer = setTimeout(() => {
        el.style.display = 'none';
      }, ms);
    } catch (e) {
      console.warn('showMessage error', e);
    }
  }

function addItem(name, rate, qty) {
  const r = Number(rate) || 0;
  const q = Number(qty) || 0;
  const total = +(r * q);
  items.push({ name, rate: r, qty: q, total });
  saveData();
  renderTable();
  updateTotals();
}

function deleteItem(index) {
  items.splice(index, 1);
  saveData();
  renderTable();
  updateTotals();
}

itemForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = itemNameInput.value.trim();
  const rate = itemRateInput.value;
  const qty = itemQtyInput.value;
  
  // Validate inputs
  if (!name) {
    showMessage('Please enter item name');
    itemNameInput.focus();
    return;
  }
  if (!rate || rate <= 0) {
    showMessage('Please enter a valid rate');
    itemRateInput.focus();
    return;
  }
  if (!qty || qty <= 0) {
    showMessage('Please enter a valid quantity');
    itemQtyInput.focus();
    return;
  }

  // Add item and clear form
  addItem(name, rate, qty);
  itemNameInput.value = '';
  itemRateInput.value = '';
  itemQtyInput.value = '';
  itemNameInput.focus();
  showMessage('Item added successfully', 1500);
});

// Handle advance input changes
advanceInput.addEventListener('input', () => {
  const value = Number(advanceInput.value);
  const total = Number(grandTotalEl.textContent.replace(/,/g, ''));
  
  // Don't allow advance greater than total
  if (value > total) {
    advanceInput.value = total;
    showMessage('Advance cannot be greater than total amount');
  }
  updateTotals();
});

// Handle keyboard navigation
itemNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && itemNameInput.value.trim()) {
    e.preventDefault();
    itemRateInput.focus();
  }
});

itemRateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && itemRateInput.value > 0) {
    e.preventDefault();
    itemQtyInput.focus();
  }
});

// Validate number inputs
itemRateInput.addEventListener('input', () => {
  if (itemRateInput.value < 0) itemRateInput.value = 0;
});

itemQtyInput.addEventListener('input', () => {
  if (itemQtyInput.value < 0) itemQtyInput.value = 0;
});

// expose print function globally for the button
window.printInvoice = printInvoice;

// Function to clear all form data and prepare for new entry
function clearAllFormData() {
  // Clear items array and localStorage
  items = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_ADV);

  // Reset all form fields
  const fields = {
    customerName: '',
    itemName: '',
    itemRate: '',
    itemQty: '',
    advance: '0'
  };

  // Update each field
  Object.keys(fields).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = fields[id];
  });

  // Reset table and totals
  renderTable();
  updateTotals();

  // Focus on customer name for new entry
  const customerNameField = document.getElementById('customerName');
  if (customerNameField) customerNameField.focus();
}

// Check if we need to clear form (after printing)
function checkAndClearForm() {
  const needsClear = sessionStorage.getItem('clear_form');
  if (needsClear) {
    sessionStorage.removeItem('clear_form');
    clearAllFormData();
    showMessage('Ready for new customer entry', 2000);
  }
}

// When printing is done, set flag to clear form
function setPrintComplete() {
  sessionStorage.setItem('clear_form', 'true');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // First check if we need to clear the form
  checkAndClearForm();
  // Then load any saved data
  loadData();
});

function saveBill() {
  if (items.length === 0) {
    showMessage('Please add items before saving the bill', 3000);
    return;
  }

  const customerName = document.getElementById('customerName').value.trim();
  if (!customerName) {
    showMessage('Please enter customer name before saving', 3000);
    return;
  }

  const invoiceNo = 'INV-' + new Date().getTime().toString().slice(-6);
  const totalAmount = items.reduce((sum, it) => sum + Number(it.total), 0);
  const advancePaid = Number(advanceInput.value || 0);
  const balanceAmount = Math.max(0, totalAmount - advancePaid);

  const bills = JSON.parse(localStorage.getItem('weld_bills') || '[]');
  const newBill = {
    invoiceNo,
    date: new Date().toISOString(),
    customerName,
    items: items.map(it => ({
      name: it.name || '',
      rate: Number(it.rate || 0),
      qty: Number(it.qty || 0),
      total: Number(it.total || 0)
    })),
    grandTotal: totalAmount,
    advance: advancePaid,
    balance: balanceAmount
  };

  bills.push(newBill);
  localStorage.setItem('weld_bills', JSON.stringify(bills));

  showMessage('Bill saved successfully!', 2000);

  // Optional: Clear current form after saving
  items = [];
  saveData();
  renderTable();
  updateTotals();
  document.getElementById('customerName').value = '';
}

