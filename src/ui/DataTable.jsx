/**
 * Generic table used by mapping sheets and tools panels.
 * @param {{
 *   className?: string,
 *   columns: Array<{key: string, label: string, thClass?: string, tdClass?: (row: *) => string, render: (row: *, index: number) => * }>,
 *   rows: Array<*>,
 *   rowKey: (row: *, index: number) => string,
 * }} props
 */
export function DataTable({
  className,
  columns,
  rows,
  rowKey,
  rowClassName,
  onRowEnter,
  onRowLeave,
}) {
  return (
    <table className={className}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.thClass}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={rowKey(row, index)}
            className={rowClassName?.(row, index)}
            onMouseEnter={() => onRowEnter?.(row, index)}
            onMouseLeave={() => onRowLeave?.(row, index)}
          >
            {columns.map((col) => (
              <td key={col.key} className={col.tdClass?.(row, index)}>
                {col.render(row, index)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
