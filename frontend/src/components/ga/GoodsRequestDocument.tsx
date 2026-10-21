export const CMC_LOGO_SRC = '/images/logo-cmc.png';
export const goodsIdentityRowClass =
  'grid min-h-11 grid-cols-[88px_12px_minmax(0,1fr)] items-center border-b border-slate-200 text-xs dark:border-slate-800';

export function GoodsDocumentHeading({ detail = false, title, headingColorClass = 'text-black' }: { detail?: boolean; title?: string; headingColorClass?: string }) {
  const Heading = detail ? 'h2' : 'h1';
  return (
    <div className="flex border-b border-black">
      <div className="w-[85px] sm:w-[110px] flex-shrink-0 flex items-center justify-center border-r border-black p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CMC_LOGO_SRC}
          alt="Logo Cahaya Mas Cemerlang (CMC)"
          width={72}
          height={64}
          className="h-10 w-12 sm:h-12 sm:w-16 object-contain"
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center">
        <Heading className={`text-base sm:text-xl font-bold uppercase underline tracking-wider ${headingColorClass}`}>
          FORM PERMINTAAN BARANG
        </Heading>
        {title && (
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {title}
          </p>
        )}
      </div>
    </div>
  );
}

export function GoodsDocumentSignatures({
  requesterName,
  approverName = 'Jef Budiharto',
}: {
  requesterName: string;
  approverName?: string;
}) {
  const columns = [
    { label: 'Diajukan', name: requesterName },
    { label: 'Diketahui Oleh', name: '' },
    { label: 'Diperiksa', name: '' },
    { label: 'Disetujui', name: approverName },
    { label: 'Penjual', name: '' },
  ];

  return (
    <table
      aria-label="Pengesahan permintaan barang"
      className="w-full table-fixed border-collapse text-center text-xs text-black border-t border-black"
    >
      <thead>
        <tr className="border-b border-black font-semibold">
          {columns.map((col, idx) => (
            <th
              key={col.label}
              scope="col"
              className={`py-1.5 px-1 text-center font-semibold text-[11px] sm:text-xs text-black ${
                idx < columns.length - 1 ? 'border-r border-black' : ''
              }`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {columns.map((col, idx) => (
            <td
              key={idx}
              className={`h-20 sm:h-24 px-1 pb-2 text-center align-bottom text-[11px] sm:text-xs text-black ${
                idx < columns.length - 1 ? 'border-r border-black' : ''
              }`}
            >
              <div className="flex w-full justify-center text-center font-medium">
                {col.name ? `( ${col.name} )` : '(                )'}
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
