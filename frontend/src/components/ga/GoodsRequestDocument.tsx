import Image from 'next/image';

export const CMC_LOGO_SRC = '/images/logo-cmc.png';
export const goodsIdentityRowClass =
  'grid min-h-11 grid-cols-[88px_12px_minmax(0,1fr)] items-center border-b border-slate-200 text-xs dark:border-slate-800';

export function GoodsDocumentHeading({ detail = false, title, headingColorClass = 'text-slate-900 dark:text-white' }: { detail?: boolean; title?: string; headingColorClass?: string }) {
  const Heading = detail ? 'h2' : 'h1';
  return (
    <div className="grid grid-cols-[70px_minmax(0,1fr)_40px] border-b border-slate-300 sm:grid-cols-[120px_minmax(0,1fr)_120px] dark:border-slate-800">
      <div className="flex items-center justify-center border-r border-slate-300 px-1 py-3 dark:border-slate-800">
        <Image
          src={CMC_LOGO_SRC}
          alt="Logo Cahaya Mas Cemerlang (CMC)"
          width={72}
          height={64}
          className="h-12 w-14 object-contain sm:h-16 sm:w-[72px]"
        />
      </div>
      <div className="flex flex-col items-center justify-center px-2 py-4 text-center">
        <Heading className={`text-sm font-extrabold uppercase underline sm:text-xl ${headingColorClass}`}>
          Form Permintaan Barang
        </Heading>
        {title && (
          <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {title}
          </p>
        )}
      </div>
      <div className="border-l border-slate-300 dark:border-slate-800" aria-hidden="true" />
    </div>
  );
}

export function GoodsDocumentSignatures({ requesterName }: { requesterName: string }) {
  return (
    <table
      aria-label="Pengesahan permintaan barang"
      className="w-full min-w-[850px] table-fixed border-collapse text-center text-xs text-slate-800 dark:text-slate-200"
    >
      <thead>
        <tr>
          {['Diajukan', 'Diketahui Oleh', 'Diperiksa', 'Disetujui', 'Penjual'].map((label) => (
            <th
              key={label}
              scope="col"
              className="border border-slate-300 bg-slate-50/60 px-2 py-2 text-center font-semibold whitespace-nowrap dark:border-slate-800 dark:bg-slate-800/40"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {[requesterName, '', '', '', ''].map((name, index) => (
            <td key={index} className="h-28 border border-slate-300 px-3 pb-3 text-center align-bottom dark:border-slate-800">
              <div className="flex w-full justify-center text-center">
                {name ? `( ${name} )` : '( __________________ )'}
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
