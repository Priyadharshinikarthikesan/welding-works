window.printInvoice = function() {
    if (items.length === 0) {
        alert('Please add items to the bill before printing');
        return;
    }

    const customerName = document.getElementById('customerName').value;
    if (!customerName) {
        alert('Please enter customer name before printing');
        return;
    }

    const invoiceNo = 'INV-' + new Date().getTime().toString().slice(-6);
    const dateStr = new Date().toLocaleString('en-IN');
    const totalAmount = items.reduce((sum, it) => sum + Number(it.total), 0);
    const advanceAmount = Number(advanceInput.value || 0);
    const balanceAmount = Math.max(0, totalAmount - advanceAmount);
    const itemRows = items.map((it, index) => `
        <tr>
            <td style="text-align:left;padding:8px;border:1px solid #ddd">${index + 1}. ${it.name}</td>
            <td style="text-align:right;padding:8px;border:1px solid #ddd">₹${formatCurrency(it.rate)}</td>
            <td style="text-align:center;padding:8px;border:1px solid #ddd">${it.qty}</td>
            <td style="text-align:right;padding:8px;border:1px solid #ddd">₹${formatCurrency(it.total)}</td>
        </tr>
    `).join('');

    // Store only the sanitized bill data (no HTML or large blobs)
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
        advance: Number(advanceAmount || 0),
        balance: Number(balanceAmount || 0)
    };
    bills.push(sanitizedBill);
    localStorage.setItem('weld_bills', JSON.stringify(bills));

    const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - Amman Welding Works</title>
            <meta charset="UTF-8">
            <style>
                @page {
                    size: A4;
                    margin: 1cm;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .bill-header {
                    background-color: #2b6cb0 !important;
                    color: white !important;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .bill-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    color: white !important;
                }
                .bill-header p {
                    margin: 5px 0;
                    font-size: 16px;
                    color: white !important;
                }
                .customer-info {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8fafc;
                    border-radius: 6px;
                }
                .customer-info p {
                    margin: 5px 0;
                    font-size: 16px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background-color: white;
                }
                th {
                    background-color: #2b6cb0 !important;
                    color: white !important;
                    padding: 12px;
                    border: 1px solid #1a4971;
                }
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                .amount-summary {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f8fafc;
                    border-radius: 6px;
                    text-align: right;
                }
                .grand-total {
                    font-size: 20px;
                    font-weight: bold;
                    color: #2b6cb0;
                }
                .footer-note {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }
                @media print {
                    .bill-header {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    th {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="bill-header">
                    ${companyHeader}
                </div>
                
                <div class="customer-info">
                    <p><strong>Customer Name:</strong> ${customerName}</p>
                    <p><strong>Invoice Date:</strong> ${dateStr}</p>
                    <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align:left">Item</th>
                            <th style="text-align:right">Rate</th>
                            <th style="text-align:center">Qty</th>
                            <th style="text-align:right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>

                <div class="amount-summary">
                    <p class="grand-total">Grand Total: ₹${formatCurrency(totalAmount)}</p>
                    <p>Advance Paid: ₹${formatCurrency(advanceAmount)}</p>
                    <p><strong>Balance Due: ₹${formatCurrency(balanceAmount)}</strong></p>
                </div>

                <div class="footer-note">
                    <p>Thank you for your business!</p>
                    <p>For questions or concerns about this invoice, please contact us.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            const checkPrintDialogClosed = setInterval(() => {
                if (printWindow.document.readyState === 'complete' && !printWindow.document.hasFocus()) {
                    clearInterval(checkPrintDialogClosed);
                    printWindow.close();
                }
            }, 500);
        }, 250);
    };
}