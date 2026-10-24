/** One example block on a React page: the live parts, then the JSX that makes them. */
export function Demo({ id, title, code, children }) {
  return (
    <section className="demo-block" id={id}>
      <div className="demo-head">
        <h2 className="sd-label">{title}</h2>
      </div>
      <div className="grid gap-4">{children}</div>
      <div className="sd-code">
        <div className="sd-code-head">JSX</div>
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
