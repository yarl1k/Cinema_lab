export const downloadTicketPDF = async (
  userName: string,
  movieTitle: string,
  startTime: string,
  hallName: string,
  tickets: Array<{ row: number; seatNumber: number; ticketNumber?: string }>,
  orderNumber: string
) => {
  try {
    // @ts-ignore
    const md = await import('html2pdf.js');
    const html2pdf = md.default || md;

    const formattedDate = new Date(startTime).toLocaleString('uk-UA', { 
        timeZone: 'Europe/Kyiv',
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    const ticketsHtml = tickets.map(t => `
        <tr>
            <td style="color:#000000;font-size:14px;padding:12px 0;border-bottom:1px solid #e0e0e0;">Ряд ${t.row}, Місце ${t.seatNumber}</td>
            <td style="color:#000000;font-size:14px;padding:12px 0;text-align:right;border-bottom:1px solid #e0e0e0;font-family:monospace;">${t.ticketNumber || orderNumber}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:20px;background:#ffffff;font-family:sans-serif;color:#000000;">
      <div style="max-width:520px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e0e0e0;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:24px;font-weight:900;color:#d33131;letter-spacing:3px;">CINEMALAB</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;">Квитки, ${userName}!</h2>
        <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
          Замовлення <strong>${orderNumber}</strong>.
        </p>
        <div style="background:#f9f9f9;padding:20px;margin-bottom:24px;border:1px solid #e0e0e0;">
            <h3 style="margin:0 0 12px;font-size:18px;">${movieTitle}</h3>
            <p style="font-size:14px;margin:0 0 8px;"><strong>Час:</strong> ${formattedDate}</p>
            <p style="font-size:14px;margin:0 0 16px;"><strong>Зал:</strong> ${hallName}</p>
            
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left;font-size:12px;padding-bottom:8px;border-bottom:1px solid #cccccc;">Ряд, Місце</th>
                        <th style="text-align:right;font-size:12px;padding-bottom:8px;border-bottom:1px solid #cccccc;">Код квитка</th>
                    </tr>
                </thead>
                <tbody>
                    ${ticketsHtml}
                </tbody>
            </table>
        </div>
      </div>
    </body>
    </html>
    `;

    const opt: any = {
      margin: 0.5,
      filename: `ticket-${orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Use a detached DOM node so we don't pollute the document and avoid Tailwind Oklab issues
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    html2pdf().from(tempDiv).set(opt).save();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Не вдалося згенерувати PDF-файл. Перевірте консоль для деталей.');
  }
};
