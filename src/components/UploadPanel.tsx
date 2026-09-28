import { useState, type ChangeEvent, type DragEvent } from 'react';

interface Props {
  onFile: (file: File) => void;
  error?: string;
  warnings: string[];
}

export function UploadPanel({ onFile, error, warnings }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <section aria-labelledby="upload-title" className="upload">
      <h2 id="upload-title" className="rail__title">
        Use your own statement
      </h2>
      <label
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".csv,text/csv" onChange={handleChange} />
        <span className="dropzone__main">Choose a monthly statement</span>
        <span className="dropzone__sub">or drop a .csv file here. It is read in your browser and never uploaded.</span>
      </label>

      {error && (
        <p role="alert" className="notice notice--error">
          {error}
        </p>
      )}
      {warnings.length > 0 && (
        <div className="notice notice--warn">
          <p>{warnings.length} row(s) were skipped:</p>
          <ul>
            {warnings.slice(0, 4).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {warnings.length > 4 && <p>and {warnings.length - 4} more.</p>}
        </div>
      )}

      <details className="format">
        <summary>Expected columns</summary>
        <p>
          One row per award, month and category: <code>project_id</code>, <code>month</code>, <code>category</code>,{' '}
          <code>amount</code>, <code>award_total</code>, <code>end_month</code>. Optional: <code>project_name</code>,{' '}
          <code>pi</code>, <code>start_month</code>.
        </p>
        <a href={`${import.meta.env.BASE_URL}sample-statement.csv`} download>
          Download a sample file
        </a>
      </details>
    </section>
  );
}
